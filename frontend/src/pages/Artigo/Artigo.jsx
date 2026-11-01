import { useEffect, useState } from "react";
import { Link, useLocation, useNavigate, useParams } from "react-router-dom";
import AvisoPagina from "../../components/AvisoPagina/AvisoPagina";
import Botao from "../../components/Botao/Botao";
import { corDaCategoria } from "../../components/CardArtigo/CardArtigo";
import Carregando from "../../components/Carregando/Carregando";
import Tag from "../../components/Tag/Tag";
import { useAuth } from "../../contexts/AuthContext";
import { useTituloDaPagina } from "../../hooks/useTituloDaPagina";
import { apagarArtigo, buscarArtigo } from "../../services/artigos";
import { formatarData } from "../../utils/rotulos";

// Um artigo inteiro, em /blog/:id. Quem escreveu vê "Editar artigo" e "Apagar artigo".
// O texto é mostrado como texto (o React não transforma em HTML), em parágrafos separados por linha em branco
export default function Artigo() {
  const { id } = useParams();
  const { state } = useLocation();
  const navegar = useNavigate();
  const { token, sair } = useAuth();
  const [artigo, setArtigo] = useState(null);
  // "carregando" | "pronto" | "nao-encontrado" | "erro"
  const [situacao, setSituacao] = useState("carregando");
  const [tentativa, setTentativa] = useState(0);
  const [confirmando, setConfirmando] = useState(false);
  const [apagando, setApagando] = useState(false);
  const [erroApagar, setErroApagar] = useState("");

  let titulo = null;
  if (artigo) titulo = artigo.titulo;
  if (situacao === "nao-encontrado") titulo = "Artigo não encontrado";
  useTituloDaPagina(titulo);

  useEffect(() => {
    let cancelado = false;
    buscarArtigo(id, token)
      .then((resposta) => {
        if (cancelado) return;
        setArtigo(resposta);
        setSituacao("pronto");
      })
      .catch((erro) => {
        if (cancelado) return;
        if (erro.status === 401 && token) {
          sair();
          return;
        }
        setSituacao(erro.status === 404 || erro.status === 400 ? "nao-encontrado" : "erro");
      });
    return () => {
      cancelado = true;
    };
  }, [id, token, sair, tentativa]);

  async function apagar() {
    setApagando(true);
    setErroApagar("");
    try {
      await apagarArtigo(id, token);
      navegar("/blog", { state: { aviso: `O artigo "${artigo.titulo}" foi apagado.` } });
    } catch (erro) {
      if (erro.status === 401) {
        sair();
        return;
      }
      setErroApagar(erro.message);
      setApagando(false);
    }
  }

  if (situacao === "carregando") {
    return (
      <main className="px-5 py-12">
        <Carregando texto="Carregando o artigo..." />
      </main>
    );
  }

  if (situacao === "nao-encontrado") {
    return (
      <AvisoPagina titulo="Artigo não encontrado">
        <p>Ele pode ter sido apagado por quem escreveu, ou o endereço está errado.</p>
        <Botao para="/blog" className="mt-5">
          Ver todos os artigos
        </Botao>
      </AvisoPagina>
    );
  }

  if (situacao === "erro") {
    return (
      <AvisoPagina titulo="Não foi possível carregar o artigo" alerta>
        <p>Confira sua conexão e tente de novo.</p>
        <Botao
          onClick={() => {
            setSituacao("carregando");
            setTentativa((atual) => atual + 1);
          }}
          className="mt-5"
        >
          Tentar de novo
        </Botao>
      </AvisoPagina>
    );
  }

  const { categoria, categoriaNome, conteudo, fotoCapa, autor, publicadoEm, atualizadoEm, ehMeu } = artigo;
  const paragrafos = conteudo.split(/\n\s*\n/);

  return (
    <main className="mx-auto flex w-full max-w-[760px] flex-col gap-6 px-5 pb-12 pt-6 md:pt-8">
      <Link
        to="/blog"
        className="self-start rounded-sm py-1 font-titulo text-botao font-semibold text-marca-roxo underline underline-offset-2 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-marca-roxo"
      >
        Voltar pro blog
      </Link>

      {state?.aviso && (
        <p
          role="status"
          className="rounded-[10px] bg-status-disponivel-fundo px-4 py-3 text-compacto text-status-disponivel-texto"
        >
          {state.aviso}
        </p>
      )}

      <article className="flex flex-col gap-5">
        <div className="flex flex-col gap-3">
          <div>
            <Tag variante={corDaCategoria[categoria]}>{categoriaNome}</Tag>
          </div>
          <h1 className="font-titulo text-secao font-semibold text-texto-principal md:text-display">
            {artigo.titulo}
          </h1>
          <p className="text-compacto text-texto-secundario">
            Por <span className="font-semibold text-texto-principal">{autor.nome}</span>
            {autor.tipo === "ABRIGO" && " (abrigo)"}, de {autor.cidade}/{autor.estado}. Publicado em{" "}
            {formatarData(publicadoEm.slice(0, 10))}
            {atualizadoEm && ` e atualizado em ${formatarData(atualizadoEm.slice(0, 10))}`}.
          </p>
        </div>

        {fotoCapa && <img src={fotoCapa} alt="" className="aspect-[16/9] w-full rounded-[16px] object-cover" />}

        <div className="flex flex-col gap-4 text-corpo text-texto-principal">
          {paragrafos.map((paragrafo, posicao) => (
            <p key={posicao} className="whitespace-pre-line">
              {paragrafo.trim()}
            </p>
          ))}
        </div>
      </article>

      {ehMeu && (
        <div className="border-t border-borda-sutil pt-5">
          <div className="flex flex-col gap-2 sm:flex-row">
            <Botao variante="secundario" para={`/blog/${id}/editar`}>
              Editar artigo
            </Botao>
            <Botao
              id="apagar-artigo"
              variante="perigo"
              aria-expanded={confirmando}
              aria-controls="confirmar-apagar-artigo"
              onClick={() => {
                setConfirmando((atual) => !atual);
                setErroApagar("");
              }}
              disabled={apagando}
            >
              Apagar artigo
            </Botao>
          </div>
          {confirmando && (
            <div
              id="confirmar-apagar-artigo"
              className="mt-4 rounded-[12px] border border-borda-sutil bg-fundo-superficie p-4"
            >
              <p className="font-titulo font-semibold text-texto-principal">Apagar este artigo de vez?</p>
              <p className="mt-1 text-compacto text-texto-secundario">
                Ele sai do blog na hora, junto com a foto de capa.
              </p>
              {erroApagar && (
                <p role="alert" className="mt-2 text-compacto text-status-erro-texto">
                  {erroApagar}
                </p>
              )}
              <div className="mt-3 flex flex-col gap-2 md:flex-row">
                <Botao onClick={apagar} disabled={apagando}>
                  {apagando ? "Apagando..." : "Confirmar"}
                </Botao>
                <Botao
                  variante="secundario"
                  onClick={() => {
                    setConfirmando(false);
                    document.getElementById("apagar-artigo")?.focus();
                  }}
                  disabled={apagando}
                >
                  Voltar
                </Botao>
              </div>
            </div>
          )}
        </div>
      )}
    </main>
  );
}
