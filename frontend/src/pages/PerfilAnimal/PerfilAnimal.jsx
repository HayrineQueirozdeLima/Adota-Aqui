import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import AvisoPagina from "../../components/AvisoPagina/AvisoPagina";
import Botao from "../../components/Botao/Botao";
import Carregando from "../../components/Carregando/Carregando";
import GaleriaFotos from "../../components/GaleriaFotos/GaleriaFotos";
import Tag from "../../components/Tag/Tag";
import { useAuth } from "../../contexts/AuthContext";
import { buscarAnimal } from "../../services/animais";
import { desistirDoInteresse } from "../../services/interesses";
import {
  artigoDefinido,
  convivencias,
  corDaConvivencia,
  especies,
  formatarData,
  idadeEstimada,
  iniciais,
  portes,
  rotuloCastrado,
  rotuloEnergia,
  sexos,
  statusDoInteresse,
} from "../../utils/rotulos";

// Perfil do animal (Figma: "Ficha do animal"), em /animais/:id
export default function PerfilAnimal() {
  const { id } = useParams();
  const { usuario, token, sair } = useAuth();
  const [animal, setAnimal] = useState(null);
  // "carregando" | "pronto" | "nao-encontrado" | "erro"
  const [situacao, setSituacao] = useState("carregando");
  const [tentativa, setTentativa] = useState(0);

  // Busca de novo se mudar o animal, se alguém entrar ou sair da conta, ou no "Tentar de novo"
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
        // Token vencido: sai da conta e a busca roda de novo sozinha, como visitante
        if (erro.status === 401 && token) {
          sair();
          return;
        }
        // 404: não existe, foi removido ou já foi adotado (a API esconde os adotados de quem não é o protetor)
        // 400: o pedaço da URL nem é um id válido
        setSituacao(
          erro.status === 404 || erro.status === 400
            ? "nao-encontrado"
            : "erro",
        );
      });

    return () => {
      cancelado = true;
    };
  }, [id, token, sair, tentativa]);

  function tentarDeNovo() {
    setSituacao("carregando");
    setTentativa((total) => total + 1);
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
        <p>Confira sua conexão e tente de novo.</p>
        <Botao onClick={tentarDeNovo} className="mt-5">
          Tentar de novo
        </Botao>
      </AvisoPagina>
    );
  }

  return <Perfil animal={animal} usuario={usuario} aoMudar={tentarDeNovo} />;
}

function Perfil({ animal, usuario, aoMudar }) {
  const {
    nome,
    especie,
    racaNome,
    sexo,
    porte,
    peso,
    dataNascEstimada,
    castrado,
    energia,
    convivencia,
    historia,
    fotos,
    vacinas,
    statusAdocao,
  } = animal;
  const a = artigoDefinido(sexo);
  const idade = idadeEstimada(dataNascEstimada);

  const caracteristicas = [
    especies[especie],
    racaNome,
    portes[porte],
    sexos[sexo],
    peso && `${peso.toLocaleString("pt-BR")} kg`,
    idade && `${idade} (estimado)`,
    castrado && rotuloCastrado(sexo),
  ].filter(Boolean);

  const convivenciasDoAnimal = [
    { quem: "Crianças", valor: convivencia.crianca },
    { quem: "Cães", valor: convivencia.cao },
    { quem: "Gatos", valor: convivencia.gato },
  ];

  return (
    <main className="mx-auto w-full max-w-[1440px] px-5 py-6 md:px-14 md:py-8">
      <nav aria-label="Caminho" className="text-legenda text-texto-terciario">
        <Link to="/animais" className="hover:underline">
          Explorar
        </Link>
        {" / "}
        <span aria-current="page">{nome}</span>
      </nav>

      <div className="mt-5 flex flex-wrap items-center gap-3">
        <h1 className="font-titulo text-secao font-semibold text-texto-principal">
          {nome}
        </h1>
        {statusAdocao === "ADOTADO" ? (
          <Tag>Adotado</Tag>
        ) : (
          <Tag variante="disponivel">Disponível</Tag>
        )}
      </div>

      <div className="mt-5 grid gap-5 lg:grid-cols-[minmax(0,1fr)_350px] lg:items-start">
        <div className="flex flex-col gap-5">
          <GaleriaFotos nome={nome} fotos={fotos} />

          <Secao titulo="Características">
            <div className="flex flex-wrap gap-1.5">
              {caracteristicas.map((texto) => (
                <Tag key={texto}>{texto}</Tag>
              ))}
            </div>
            <hr className="my-4 border-borda-sutil" />
            <h3 className="font-titulo text-overline uppercase text-texto-terciario">
              Convivência
            </h3>
            <div className="mt-3 flex flex-wrap gap-1.5">
              {convivenciasDoAnimal.map(({ quem, valor }) => (
                <Tag key={quem} variante={corDaConvivencia[valor]}>
                  {quem}: {convivencias[valor]}
                </Tag>
              ))}
              <Tag variante="atencao">{rotuloEnergia(energia, sexo)}</Tag>
            </div>
          </Secao>

          {vacinas.length > 0 && (
            <Secao titulo="Histórico de vacinação">
              <ul className="flex flex-col gap-2.5">
                {vacinas.map((vacina) => (
                  <li
                    key={vacina.id}
                    className="flex flex-wrap items-center justify-between gap-2 rounded-[10px] border border-borda-sutil bg-fundo-pagina px-3.5 py-3"
                  >
                    <span className="font-titulo font-semibold text-texto-principal">
                      {vacina.nome}
                    </span>
                    <span className="text-legenda text-texto-terciario">
                      {[
                        vacina.dose && `${vacina.dose}ª dose`,
                        formatarData(vacina.dataAplicacao),
                      ]
                        .filter(Boolean)
                        .join(" · ")}
                    </span>
                  </li>
                ))}
              </ul>
            </Secao>
          )}

          {historia && (
            <Secao titulo={`A história d${a} ${nome}`}>
              <p className="whitespace-pre-line text-corpo text-texto-secundario">
                {historia}
              </p>
            </Secao>
          )}
        </div>

        <aside className="flex flex-col gap-4">
          <CartaoInteresse
            animal={animal}
            usuario={usuario}
            aoMudar={aoMudar}
          />
          <p className="rounded-[16px] bg-status-atencao-fundo px-5 py-4 text-compacto text-status-atencao-texto">
            <strong>Guarda responsável é obrigatória.</strong> Maus-tratos e
            abandono são crimes no Brasil (Leis nº 9.605/1998 e nº 14.064/2020).
          </p>
        </aside>
      </div>
    </main>
  );
}

// O cartão da direita. O que aparece depende de quem está vendo, e quem decide
// o que a pessoa pode fazer é a API (ehMeu, podeDemonstrarInteresse, meuInteresse)
function CartaoInteresse({ animal, usuario, aoMudar }) {
  const {
    id,
    nome,
    sexo,
    protetor,
    ehMeu,
    podeDemonstrarInteresse,
    meuInteresse,
  } = animal;
  const { token, sair } = useAuth();
  const [confirmandoDesistencia, setConfirmandoDesistencia] = useState(false);
  const [desistindo, setDesistindo] = useState(false);
  const [erroDesistencia, setErroDesistencia] = useState("");
  const a = artigoDefinido(sexo);
  const interesseAtivo =
    meuInteresse &&
    ["PENDENTE", "EM_CONTATO"].includes(meuInteresse.statusAndamento);

  // UC07 FA01: o interesse é apagado e o perfil é buscado de novo (aí volta o "Quero conhecer")
  async function desistir() {
    setDesistindo(true);
    setErroDesistencia("");
    try {
      await desistirDoInteresse(meuInteresse.id, token);
      aoMudar();
    } catch (erro) {
      if (erro.status === 401) {
        sair();
        return;
      }
      setErroDesistencia(erro.message);
      setDesistindo(false);
    }
  }

  function conteudo() {
    if (ehMeu) {
      return (
        <>
          <p>
            Você cadastrou {a} {nome}. Os interesses recebidos ficam no seu
            painel.
          </p>
          <Botao para={`/meus-animais/${id}/editar`} className="w-full">
            Editar {nome}
          </Botao>
          <Botao
            variante="secundario"
            para="/interesses-recebidos"
            className="w-full"
          >
            Ver interesses recebidos
          </Botao>
        </>
      );
    }

    if (interesseAtivo) {
      return (
        <>
          <p>
            Você já demonstrou interesse n{a} {nome}.
          </p>
          <div>
            <Tag variante="atencao">
              {statusDoInteresse[meuInteresse.statusAndamento]}
            </Tag>
          </div>
          <Botao
            variante="secundario"
            para="/meus-interesses"
            className="w-full"
          >
            Ver minhas candidaturas
          </Botao>

          {confirmandoDesistencia ? (
            <div className="rounded-[12px] border border-borda-sutil bg-fundo-pagina p-4">
              <p className="font-titulo font-semibold text-texto-principal">
                Desistir da adoção?
              </p>
              <p className="mt-1">
                Seu interesse é apagado e o Protetor deixa de ver seus contatos.
                Se mudar de ideia, dá pra demonstrar interesse de novo.
              </p>
              {erroDesistencia && (
                <p role="alert" className="mt-2 text-status-erro-texto">
                  {erroDesistencia}
                </p>
              )}
              <div className="mt-3 flex flex-wrap gap-2">
                <Botao onClick={desistir} disabled={desistindo}>
                  {desistindo ? "Desistindo..." : "Confirmar desistência"}
                </Botao>
                <Botao
                  variante="secundario"
                  onClick={() => setConfirmandoDesistencia(false)}
                  disabled={desistindo}
                >
                  Voltar
                </Botao>
              </div>
            </div>
          ) : (
            <button
              type="button"
              onClick={() => setConfirmandoDesistencia(true)}
              className="self-start font-titulo font-semibold text-campo text-status-erro-texto underline"
            >
              Desistir da adoção
            </button>
          )}
        </>
      );
    }

    // Visitante também vê o botão: a rota do interesse pede login e depois volta pra cá
    if (!usuario || podeDemonstrarInteresse) {
      return (
        <>
          <p>
            Ao demonstrar interesse, seus dados e os do Protetor ficam visíveis
            para os dois lados. Qualquer um pode iniciar a conversa.
          </p>
          <Botao para={`/animais/${id}/interesse`} className="w-full">
            Quero conhecer {nome}
          </Botao>
          {!usuario && (
            <p className="text-legenda text-texto-terciario">
              Pra continuar, você vai entrar ou criar sua conta.
            </p>
          )}
        </>
      );
    }

    if (usuario.tipoConta === "ABRIGO") {
      return (
        <p>
          Contas de abrigo não demonstram interesse. Pra adotar, use uma conta
          pessoal (CPF).
        </p>
      );
    }

    // Usuario de outro estado (RF14)
    return (
      <p>
        A adoção pelo Adota Aqui acontece dentro do mesmo estado. {nome} está em{" "}
        {protetor.cidade}/{protetor.estado}.
      </p>
    );
  }

  return (
    <section className="rounded-[16px] border border-borda-sutil bg-fundo-superficie p-5">
      <h2 className="font-titulo text-overline uppercase text-texto-terciario">
        Quer conhecer {a} {nome}?
      </h2>
      <div className="mt-3 flex flex-col gap-3 text-compacto text-texto-secundario">
        {conteudo()}
      </div>

      <hr className="my-4 border-borda-sutil" />

      <div className="flex items-center gap-3">
        <span
          aria-hidden="true"
          className="flex size-10 shrink-0 items-center justify-center rounded-full bg-marca-roxo-suave font-titulo font-semibold text-campo text-marca-roxo"
        >
          {iniciais(protetor.nome)}
        </span>
        <div>
          <p className="font-titulo font-semibold text-texto-principal">
            {protetor.nome}
          </p>
          <p className="text-legenda text-texto-terciario">
            Protetor · {protetor.cidade}/{protetor.estado}
          </p>
        </div>
      </div>
    </section>
  );
}

// Os cartões brancos com título pequeno em maiúsculas (Características, Vacinação, História)
function Secao({ titulo, children }) {
  return (
    <section className="rounded-[16px] border border-borda-sutil bg-fundo-superficie p-5">
      <h2 className="font-titulo text-overline uppercase text-texto-terciario">
        {titulo}
      </h2>
      <div className="mt-3.5">{children}</div>
    </section>
  );
}
