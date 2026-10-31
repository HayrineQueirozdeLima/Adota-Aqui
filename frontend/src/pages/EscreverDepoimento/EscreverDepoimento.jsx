import { useEffect, useRef, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import AvisoPagina from "../../components/AvisoPagina/AvisoPagina";
import Botao from "../../components/Botao/Botao";
import CampoTextoLongo from "../../components/CampoTextoLongo/CampoTextoLongo";
import Carregando from "../../components/Carregando/Carregando";
import EnvioFotoUnica from "../../components/EnvioFotoUnica/EnvioFotoUnica";
import { useAuth } from "../../contexts/AuthContext";
import { useFocoNoPrimeiroErro } from "../../hooks/useFocoNoPrimeiroErro";
import { useTituloDaPagina } from "../../hooks/useTituloDaPagina";
import { escreverDepoimento } from "../../services/depoimentos";
import { listarMeusInteresses } from "../../services/interesses";
import { formatarData } from "../../utils/rotulos";

const MAXIMO = 1000;

// Contar como foi a adoção (RF11, UC09), em /meus-interesses/:id/depoimento. Só pessoa física chega aqui.
// A tela busca a candidatura em Minhas candidaturas pra saber o animal e se ainda dá pra escrever:
// a adoção tem que estar aprovada, ser a atual e estar no prazo de 30 dias, e só vale um depoimento por adoção
export default function EscreverDepoimento() {
  const { id } = useParams();
  const navegar = useNavigate();
  const { token, sair } = useAuth();
  const [candidatura, setCandidatura] = useState(null);
  // "carregando" | "pronto" | "indisponivel" | "erro"
  const [situacao, setSituacao] = useState("carregando");
  const [tentativa, setTentativa] = useState(0);
  const [texto, setTexto] = useState("");
  const [foto, setFoto] = useState(null);
  const [autoriza, setAutoriza] = useState(false);
  const [erros, setErros] = useState({});
  const [erroGeral, setErroGeral] = useState("");
  const [enviando, setEnviando] = useState(false);
  const [tentativasDeEnvio, setTentativasDeEnvio] = useState(0);
  const formulario = useRef(null);
  useFocoNoPrimeiroErro(formulario, tentativasDeEnvio);

  const nome = candidatura?.animal.nome;
  let titulo = "Contar como foi a adoção";
  if (nome) titulo = `Contar como foi a adoção de ${nome}`;
  if (situacao === "indisponivel") titulo = "História indisponível";
  useTituloDaPagina(titulo);

  useEffect(() => {
    let cancelado = false;
    listarMeusInteresses(token)
      .then((lista) => {
        if (cancelado) return;
        const encontrada = lista.find((item) => item.id === id);
        if (!encontrada || !encontrada.podeContarAdocao) {
          setSituacao("indisponivel");
          return;
        }
        setCandidatura(encontrada);
        setSituacao("pronto");
      })
      .catch((erroDaApi) => {
        if (cancelado) return;
        if (erroDaApi.status === 401) {
          sair();
          return;
        }
        setSituacao("erro");
      });
    return () => {
      cancelado = true;
    };
  }, [id, token, sair, tentativa]);

  function tentarDeNovo() {
    setSituacao("carregando");
    setTentativa((atual) => atual + 1);
  }

  function validar() {
    const encontrados = {};
    if (texto.trim().length < 10)
      encontrados.texto = "Escreva pelo menos 10 caracteres.";
    if (!autoriza)
      encontrados.autoriza =
        "Marque a autorização pra publicar a sua história no mural.";
    return encontrados;
  }

  async function enviar(evento) {
    evento.preventDefault();
    setErroGeral("");
    const encontrados = validar();
    setErros(encontrados);
    if (Object.keys(encontrados).length > 0) {
      setTentativasDeEnvio((atual) => atual + 1);
      return;
    }
    setEnviando(true);
    try {
      await escreverDepoimento(
        id,
        { texto: texto.trim(), fotoUrl: foto, autorizaPublicacao: true },
        token,
      );
      navegar("/meus-interesses", {
        state: { aviso: `Sua história com ${nome} foi publicada no mural.` },
      });
    } catch (erroDaApi) {
      if (erroDaApi.status === 401) {
        sair();
        return;
      }
      const campos = erroDaApi.campos ?? {};
      if (campos.texto || campos.autorizaPublicacao) {
        setErros({ texto: campos.texto, autoriza: campos.autorizaPublicacao });
        setTentativasDeEnvio((atual) => atual + 1);
      } else {
        setErroGeral(erroDaApi.message);
      }
      setEnviando(false);
    }
  }

  if (situacao === "carregando") {
    return (
      <main className="px-5 py-12">
        <Carregando texto="Carregando..." />
      </main>
    );
  }

  if (situacao === "erro") {
    return (
      <AvisoPagina titulo="Não foi possível carregar a adoção" alerta>
        <p>Confira sua conexão e tente de novo.</p>
        <Botao onClick={tentarDeNovo} className="mt-5">
          Tentar de novo
        </Botao>
      </AvisoPagina>
    );
  }

  if (situacao === "indisponivel") {
    return (
      <AvisoPagina titulo="Essa história não pode ser contada agora">
        <p>
          Dá pra contar como foi depois que a adoção é aprovada, uma vez por
          adoção e até 30 dias depois da aprovação.
        </p>
        <Botao para="/meus-interesses" className="mt-5">
          Ver minhas candidaturas
        </Botao>
      </AvisoPagina>
    );
  }

  return (
    <main className="mx-auto flex w-full max-w-[760px] flex-col gap-6 px-5 pb-12 pt-6 md:pt-8">
      <div>
        <h1 className="font-titulo text-secao font-semibold text-texto-principal">
          Como está sendo a vida com {nome}?
        </h1>
        <p className="mt-2 text-corpo text-texto-secundario">
          Sua história aparece no mural de histórias de adoção, com o seu
          primeiro nome e o seu estado. Ela ajuda outras pessoas a se animarem
          a adotar também.
        </p>
        {candidatura.prazoDepoimento && (
          <p className="mt-2 text-compacto text-texto-secundario">
            Dá pra contar até {formatarData(candidatura.prazoDepoimento)}.
          </p>
        )}
      </div>

      <form
        ref={formulario}
        onSubmit={enviar}
        noValidate
        className="flex flex-col gap-6 rounded-[18px] border border-borda-sutil bg-fundo-superficie p-5 md:p-7"
      >
        <CampoTextoLongo
          rotulo="Sua história"
          value={texto}
          onChange={(evento) => {
            setTexto(evento.target.value);
            // a mensagem de erro some assim que a pessoa mexe no campo
            setErros((atuais) => ({ ...atuais, texto: undefined }));
          }}
          maximo={MAXIMO}
          erro={erros.texto}
          dica="Como foi a chegada, como está a rotina, o que mudou na casa."
        />

        <EnvioFotoUnica
          rotulo="Uma foto de vocês (opcional)"
          foto={foto}
          aoMudar={setFoto}
          descricao={`Foto de ${nome}`}
        />

        <div>
          <label className="flex items-start gap-2.5 font-titulo font-semibold text-campo text-texto-principal">
            <input
              type="checkbox"
              checked={autoriza}
              onChange={(evento) => {
                setAutoriza(evento.target.checked);
                setErros((atuais) => ({ ...atuais, autoriza: undefined }));
              }}
              aria-invalid={erros.autoriza ? true : undefined}
              aria-describedby="autoriza-ajuda"
              className="mt-0.5 size-[18px] shrink-0 accent-marca-roxo"
            />
            Autorizo publicar no mural o meu texto, a foto, o meu primeiro nome
            e o meu estado.
          </label>
          <p
            id="autoriza-ajuda"
            className={`mt-2 text-legenda ${erros.autoriza ? "text-status-erro-texto" : "text-texto-secundario"}`}
          >
            {erros.autoriza ??
              "Você pode apagar a história quando quiser, em Minhas candidaturas."}
          </p>
        </div>

        {erroGeral && (
          <p role="alert" className="text-compacto text-status-erro-texto">
            {erroGeral}
          </p>
        )}

        <div className="flex flex-col gap-2 sm:flex-row">
          <Botao type="submit" disabled={enviando}>
            {enviando ? "Publicando..." : "Publicar no mural"}
          </Botao>
          <Botao variante="secundario" para="/meus-interesses">
            Voltar
          </Botao>
        </div>
      </form>
    </main>
  );
}
