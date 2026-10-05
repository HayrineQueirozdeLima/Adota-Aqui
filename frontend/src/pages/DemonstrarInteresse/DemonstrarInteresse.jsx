import { useEffect, useRef, useState } from "react";
import { Link, useParams } from "react-router-dom";
import AvisoPagina from "../../components/AvisoPagina/AvisoPagina";
import Botao from "../../components/Botao/Botao";
import Carregando from "../../components/Carregando/Carregando";
import GrupoOpcoes from "../../components/GrupoOpcoes/GrupoOpcoes";
import Tag from "../../components/Tag/Tag";
import { useAuth } from "../../contexts/AuthContext";
import { useFocoNoPrimeiroErro } from "../../hooks/useFocoNoPrimeiroErro";
import { buscarAnimal } from "../../services/animais";
import { demonstrarInteresse } from "../../services/interesses";
import { mascaraTelefone } from "../../utils/mascaras";
import { especies, portes } from "../../utils/rotulos";
import { partesDaTriagem, triagemVazia } from "../../utils/triagem";

// Demonstrar interesse (Figma: "Demonstrar interesse"), em /animais/:id/interesse.
// A rota é só de Usuario logado: a RotaProtegida já barrou visitante e Abrigo antes de chegar aqui.
export default function DemonstrarInteresse() {
  const { id } = useParams();
  const { token, sair } = useAuth();
  const [animal, setAnimal] = useState(null);
  // "carregando" | "pronto" | "nao-encontrado" | "erro" | "concluido"
  const [situacao, setSituacao] = useState("carregando");
  const [interesse, setInteresse] = useState(null);

  useEffect(() => {
    let cancelado = false;

    buscarAnimal(id, token)
      .then((dados) => {
        if (cancelado) return;
        setAnimal(dados);
        setSituacao("pronto");
      })
      .catch((erro) => {
        if (cancelado) return;
        // Sessão vencida: ao sair, a RotaProtegida manda pro login e volta pra cá depois
        if (erro.status === 401) {
          sair();
          return;
        }
        setSituacao(
          erro.status === 404 || erro.status === 400
            ? "nao-encontrado"
            : "erro",
        );
      });

    return () => {
      cancelado = true;
    };
  }, [id, token, sair]);

  function concluir(interesseCriado) {
    setInteresse(interesseCriado);
    setSituacao("concluido");
  }

  if (situacao === "carregando") {
    return (
      <main className="px-5 py-8 md:px-14">
        <Carregando texto="Carregando animal..." />
      </main>
    );
  }

  if (situacao === "nao-encontrado") {
    return (
      <AvisoPagina titulo="Animal não encontrado">
        <p>Ele pode já ter sido adotado, ou o endereço está errado.</p>
        <Botao para="/animais" className="mt-5">
          Ver animais disponíveis
        </Botao>
      </AvisoPagina>
    );
  }

  if (situacao === "erro") {
    return (
      <AvisoPagina titulo="Não foi possível carregar o animal" alerta>
        <p>Confira sua conexão e recarregue a página.</p>
      </AvisoPagina>
    );
  }

  if (situacao === "concluido") {
    return <InteresseRegistrado animal={animal} interesse={interesse} />;
  }

  // A API diz se dá pra demonstrar interesse. Se não der, a tela explica em vez de mostrar o formulário
  if (!animal.podeDemonstrarInteresse) {
    return <SemPermissao animal={animal} />;
  }

  return <Formulario animal={animal} aoConcluir={concluir} />;
}

function Formulario({ animal, aoConcluir }) {
  const { token, sair } = useAuth();
  const [aceite, setAceite] = useState(false);
  const [respostas, setRespostas] = useState(triagemVazia);
  const [erros, setErros] = useState({});
  const [erroEnvio, setErroEnvio] = useState("");
  const [enviando, setEnviando] = useState(false);
  const [tentativas, setTentativas] = useState(0);
  const formulario = useRef(null);

  useFocoNoPrimeiroErro(formulario, tentativas);

  function responder(campo, valor) {
    setRespostas((atuais) => ({ ...atuais, [campo]: valor }));
    // respondeu: o erro daquela pergunta some na hora
    setErros((atuais) => ({ ...atuais, [campo]: undefined }));
  }

  function marcarAceite(marcado) {
    setAceite(marcado);
    setErros((atuais) => ({ ...atuais, aceite: undefined }));
  }

  function validar() {
    const encontrados = {};
    if (!aceite)
      encontrados.aceite =
        "Pra continuar, aceite o termo de compromisso e guarda responsável.";
    Object.entries(respostas).forEach(([campo, valor]) => {
      if (!valor) encontrados[campo] = "Escolha uma opção.";
    });
    return encontrados;
  }

  async function enviar(evento) {
    evento.preventDefault();
    setErroEnvio("");

    const encontrados = validar();
    if (Object.keys(encontrados).length > 0) {
      setErros(encontrados);
      setTentativas((total) => total + 1);
      return;
    }

    setEnviando(true);
    try {
      const criado = await demonstrarInteresse(
        animal.id,
        { aceiteTermo: true, triagem: respostas },
        token,
      );
      aoConcluir(criado);
    } catch (erro) {
      if (erro.status === 401) {
        sair();
        return;
      }
      // A API devolve os erros de campo como "triagem.moradia": tira o "triagem." pra casar com a tela
      const doServidor = {};
      Object.entries(erro.campos).forEach(([campo, mensagem]) => {
        const nome =
          campo === "aceiteTermo" ? "aceite" : campo.replace("triagem.", "");
        doServidor[nome] = mensagem;
      });
      if (Object.keys(doServidor).length > 0) {
        setErros(doServidor);
        setTentativas((total) => total + 1);
      } else {
        // 403 (outro estado, conta de abrigo) e 409 (já tem interesse, já foi adotado) vêm com mensagem pronta
        setErroEnvio(erro.message);
      }
      setEnviando(false);
    }
  }

  return (
    <main className="mx-auto w-full max-w-[1440px] px-5 py-6 md:px-14 md:py-8">
      <Caminho animal={animal} />

      <h1 className="mt-5 font-titulo text-secao font-semibold text-texto-principal">
        Demonstrar interesse em {animal.nome}
      </h1>
      <p className="mt-2 text-corpo text-texto-secundario">
        Duas etapas rápidas: o aceite do termo de guarda responsável e uma
        triagem curta, para o Protetor entender sua rotina antes da conversa.
      </p>

      <div className="mt-6 grid gap-5 lg:grid-cols-[minmax(0,1fr)_350px] lg:items-start">
        <form
          ref={formulario}
          onSubmit={enviar}
          noValidate
          className="flex flex-col gap-5"
        >
          <section className="rounded-[16px] bg-status-atencao-fundo p-5 text-status-atencao-texto">
            <h2 className="font-titulo text-subtitulo font-semibold">
              Compromisso e guarda responsável
            </h2>
            <p className="mt-3 text-compacto">
              Adotar é um compromisso de dez a vinte anos.{" "}
              <strong>Maus-tratos e abandono são crimes no Brasil</strong> (Leis
              nº 9.605/1998 e nº 14.064/2020), com pena agravada para cães e
              gatos. Ao continuar, você declara que tem condições de oferecer
              alimentação, abrigo, cuidado veterinário e convivência ao animal,
              e que não irá abandoná-lo.
            </p>
            <hr className="my-4 border-borda-sutil" />
            <label className="flex items-center gap-2.5 font-titulo font-semibold text-campo text-texto-principal">
              <input
                type="checkbox"
                checked={aceite}
                onChange={(evento) => marcarAceite(evento.target.checked)}
                aria-invalid={erros.aceite ? true : undefined}
                aria-describedby="aceite-ajuda"
                className="size-[18px] accent-marca-roxo"
              />
              Li e aceito o termo de compromisso e guarda responsável.
            </label>
            <p
              id="aceite-ajuda"
              className={`mt-2 text-legenda ${erros.aceite ? "text-status-erro-texto" : ""}`}
            >
              {erros.aceite ??
                "Campo obrigatório. Sem o aceite, o interesse não é registrado."}
            </p>
          </section>

          {partesDaTriagem.map((parte) => (
            <section
              key={parte.titulo}
              className="rounded-[16px] border border-borda-sutil bg-fundo-superficie p-5"
            >
              <h2 className="font-titulo text-overline uppercase text-texto-terciario">
                {parte.titulo}
              </h2>
              {parte.explicacao && (
                <p className="mt-2 text-legenda text-texto-terciario">
                  {parte.explicacao}
                </p>
              )}
              <div className="mt-4 flex flex-col gap-5">
                {parte.perguntas.map((pergunta) => (
                  <GrupoOpcoes
                    key={pergunta.campo}
                    nome={pergunta.campo}
                    legenda={pergunta.legenda}
                    opcoes={pergunta.opcoes}
                    valor={respostas[pergunta.campo]}
                    aoMudar={(valor) => responder(pergunta.campo, valor)}
                    erro={erros[pergunta.campo]}
                  />
                ))}
              </div>
            </section>
          ))}

          {erroEnvio && (
            <p
              role="alert"
              className="rounded-[10px] bg-status-erro-fundo px-4 py-3 text-compacto text-status-erro-texto"
            >
              {erroEnvio}
            </p>
          )}

          <div className="flex flex-wrap gap-3">
            <Botao type="submit" disabled={enviando}>
              {enviando ? "Enviando..." : "Confirmar interesse"}
            </Botao>
            <Botao variante="secundario" para={`/animais/${animal.id}`}>
              Cancelar
            </Botao>
          </div>
        </form>

        <aside className="flex flex-col gap-4">
          <ResumoAnimal animal={animal} />
          <section className="rounded-[16px] border border-borda-sutil bg-fundo-superficie p-5">
            <h2 className="font-titulo text-overline uppercase text-texto-terciario">
              O que acontece depois
            </h2>
            <p className="mt-3 text-compacto text-texto-secundario">
              Seu interesse entra como Pendente. O Protetor recebe o aviso e os
              contatos ficam visíveis para os dois lados. A entrevista, a visita
              e a decisão final acontecem fora do sistema.
            </p>
          </section>
        </aside>
      </div>
    </main>
  );
}

// Depois do 201: os contatos do Protetor aparecem na hora (RF09)
function InteresseRegistrado({ animal, interesse }) {
  const contato = interesse.contatoProtetor;

  return (
    <main className="mx-auto w-full max-w-[720px] px-5 py-10 md:px-14">
      <section
        role="status"
        className="rounded-[16px] border border-borda-sutil bg-fundo-superficie p-6 md:p-8"
      >
        <Tag variante="disponivel">Interesse registrado</Tag>
        <h1 className="mt-4 font-titulo text-secao font-semibold text-texto-principal">
          Pronto! {contato.nome} já pode falar com você
        </h1>
        <p className="mt-3 text-corpo text-texto-secundario">
          Seus contatos ficaram visíveis para o Protetor de {animal.nome}, e os
          dele estão aqui embaixo. Qualquer um pode iniciar a conversa.
        </p>

        <div className="mt-6 rounded-[12px] bg-fundo-pagina p-5">
          <p className="font-titulo font-semibold text-texto-principal">
            {contato.nome}
          </p>
          <ul className="mt-2 flex flex-col gap-1.5 text-compacto">
            <li>
              <a
                href={`https://wa.me/55${contato.telefone}`}
                target="_blank"
                rel="noopener noreferrer"
                className="text-marca-roxo underline"
              >
                WhatsApp: {mascaraTelefone(contato.telefone)}
              </a>
            </li>
            <li>
              <a
                href={`mailto:${contato.email}`}
                className="text-marca-roxo underline"
              >
                {contato.email}
              </a>
            </li>
          </ul>
        </div>

        <div className="mt-6 flex flex-wrap gap-3">
          <Botao para="/meus-interesses">Ver minhas candidaturas</Botao>
          <Botao variante="secundario" para={`/animais/${animal.id}`}>
            Voltar para {animal.nome}
          </Botao>
        </div>
      </section>
    </main>
  );
}

// Quando a API diz que não dá (já tem interesse, é o protetor, outro estado...)
function SemPermissao({ animal }) {
  const interesseAtivo =
    animal.meuInteresse &&
    ["PENDENTE", "EM_CONTATO"].includes(animal.meuInteresse.statusAndamento);

  if (interesseAtivo) {
    return (
      <AvisoPagina titulo={`Você já demonstrou interesse em ${animal.nome}`}>
        <p>O andamento fica nas suas candidaturas.</p>
        <Botao para="/meus-interesses" className="mt-5">
          Ver minhas candidaturas
        </Botao>
      </AvisoPagina>
    );
  }

  return (
    <AvisoPagina
      titulo={`Não é possível demonstrar interesse em ${animal.nome}`}
    >
      <p>
        {animal.ehMeu
          ? "Você é o Protetor deste animal."
          : "A adoção pelo Adota Aqui acontece dentro do mesmo estado, com animais disponíveis."}
      </p>
      <Botao para={`/animais/${animal.id}`} className="mt-5">
        Voltar para {animal.nome}
      </Botao>
    </AvisoPagina>
  );
}

function Caminho({ animal }) {
  return (
    <nav aria-label="Caminho" className="text-legenda text-texto-terciario">
      <Link to="/animais" className="hover:underline">
        Explorar
      </Link>
      {" / "}
      <Link to={`/animais/${animal.id}`} className="hover:underline">
        {animal.nome}
      </Link>
      {" / "}
      <span aria-current="page">Demonstrar interesse</span>
    </nav>
  );
}

function ResumoAnimal({ animal }) {
  const { nome, especie, racaNome, porte, peso, fotos, protetor } = animal;
  const descricao = [
    especies[especie],
    racaNome,
    portes[porte],
    peso && `${peso.toLocaleString("pt-BR")} kg`,
  ]
    .filter(Boolean)
    .join(" · ");

  return (
    <section className="rounded-[16px] border border-borda-sutil bg-fundo-superficie p-5">
      <h2 className="font-titulo text-overline uppercase text-texto-terciario">
        Você está demonstrando interesse em
      </h2>
      <div className="mt-4 flex gap-4">
        {fotos.length > 0 ? (
          <img
            src={fotos[0]}
            alt={`Foto de ${nome}`}
            className="size-20 shrink-0 rounded-[12px] object-cover"
          />
        ) : (
          <span className="flex size-20 shrink-0 items-center justify-center rounded-[12px] bg-marca-roxo-suave text-legenda text-texto-terciario">
            foto
          </span>
        )}
        <div className="flex flex-col items-start gap-1.5">
          <p className="font-titulo text-subtitulo font-semibold text-texto-principal">
            {nome}
          </p>
          <p className="text-legenda text-texto-terciario">{descricao}</p>
          <Tag variante="disponivel">Disponível</Tag>
        </div>
      </div>
      <hr className="my-4 border-borda-sutil" />
      <p className="text-legenda text-texto-terciario">
        Protetor: {protetor.nome} · {protetor.cidade}/{protetor.estado}
      </p>
    </section>
  );
}
