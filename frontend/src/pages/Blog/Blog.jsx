import { useEffect, useRef, useState } from "react";
import { Link, useLocation } from "react-router-dom";
import Botao from "../../components/Botao/Botao";
import CardArtigo from "../../components/CardArtigo/CardArtigo";
import Carregando from "../../components/Carregando/Carregando";
import Chip from "../../components/Chip/Chip";
import { useAuth } from "../../contexts/AuthContext";
import { useTituloDaPagina } from "../../hooks/useTituloDaPagina";
import { listarArtigos, meusArtigos } from "../../services/artigos";
import { categoriasDeArtigo } from "../../utils/rotulos";

// "Escritos por mim" não é um assunto: mostra os artigos da conta logada
const MEUS = "MEUS";

const estiloDoLink =
  "rounded-sm font-semibold text-marca-roxo underline underline-offset-2 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-marca-roxo";

// Blog para tutores, em /blog: qualquer pessoa lê. Protetor (abrigo, ou pessoa que já cadastrou animal) vê
// o "Escrever um artigo". Os artigos vêm de 12 em 12, dos mais novos pros mais antigos
export default function Blog() {
  const { usuario, token, sair } = useAuth();
  const { state } = useLocation();
  const [filtro, setFiltro] = useState("");
  const [artigos, setArtigos] = useState([]);
  const [total, setTotal] = useState(0);
  const [pagina, setPagina] = useState(0);
  // "carregando" | "pronto" | "erro"
  const [situacao, setSituacao] = useState("carregando");
  const [tentativa, setTentativa] = useState(0);
  const [carregandoMais, setCarregandoMais] = useState(false);
  const [erroMais, setErroMais] = useState(false);
  const [meus, setMeus] = useState(null);
  const [focarNoArtigo, setFocarNoArtigo] = useState(null);
  const grade = useRef(null);
  // Cada busca nova ganha um número: o "Ver mais" que voltar depois de a pessoa trocar o assunto fica de fora
  const buscaAtual = useRef(0);
  useTituloDaPagina("Blog para tutores");

  // Logado: os artigos da conta e se ela pode publicar
  useEffect(() => {
    if (!token) {
      setMeus(null);
      return;
    }
    let cancelado = false;
    meusArtigos(token)
      .then((resposta) => {
        if (!cancelado) setMeus(resposta);
      })
      .catch((erro) => {
        if (!cancelado && erro.status === 401) sair();
      });
    return () => {
      cancelado = true;
    };
  }, [token, sair]);

  useEffect(() => {
    if (filtro === MEUS) return;
    let cancelado = false;
    buscaAtual.current += 1;
    listarArtigos({ categoria: filtro })
      .then((resultado) => {
        if (cancelado) return;
        setArtigos(resultado.itens);
        setTotal(resultado.totalItens);
        setPagina(0);
        setSituacao("pronto");
      })
      .catch(() => {
        if (!cancelado) setSituacao("erro");
      });
    return () => {
      cancelado = true;
    };
  }, [filtro, tentativa]);

  useEffect(() => {
    if (focarNoArtigo === null) return;
    grade.current?.children[focarNoArtigo]?.querySelector("a")?.focus();
    setFocarNoArtigo(null);
  }, [focarNoArtigo]);

  function escolher(valor) {
    setErroMais(false);
    if (valor !== MEUS) setSituacao("carregando");
    setFiltro(valor);
  }

  function tentarDeNovo() {
    setSituacao("carregando");
    setTentativa((atual) => atual + 1);
  }

  function verMais() {
    const busca = buscaAtual.current;
    const proxima = pagina + 1;
    setCarregandoMais(true);
    setErroMais(false);
    listarArtigos({ categoria: filtro, pagina: proxima })
      .then((resultado) => {
        if (busca !== buscaAtual.current) return;
        const vistos = new Set(artigos.map((artigo) => artigo.id));
        const novos = resultado.itens.filter(
          (artigo) => !vistos.has(artigo.id),
        );
        setArtigos([...artigos, ...novos]);
        setTotal(resultado.totalItens);
        setPagina(proxima);
        if (novos.length > 0) setFocarNoArtigo(artigos.length);
      })
      .catch(() => {
        if (busca === buscaAtual.current) setErroMais(true);
      })
      .finally(() => setCarregandoMais(false));
  }

  const podePublicar = Boolean(usuario && meus?.podePublicar);
  const mostrandoMeus = filtro === MEUS;
  const lista = mostrandoMeus ? (meus?.artigos ?? []) : artigos;
  const totalDaLista = mostrandoMeus ? lista.length : total;

  // Como começar a escrever, pra quem ainda não pode. Logado, espera saber se a conta pode publicar
  function convite() {
    if (!usuario) {
      return (
        <>
          Abrigo ou protetor?{" "}
          <Link to="/login" className={estiloDoLink}>
            Entre na sua conta
          </Link>{" "}
          pra escrever.
        </>
      );
    }
    if (meus && !meus.podePublicar) {
      return (
        <>
          Pra escrever, cadastre primeiro um animal que você resgatou.{" "}
          <Link to="/meus-animais/novo" className={estiloDoLink}>
            Cadastrar um animal
          </Link>
        </>
      );
    }
    return null;
  }

  function mensagemDeVazio() {
    if (mostrandoMeus) return "Você ainda não escreveu nenhum artigo.";
    if (filtro) return "Ainda não tem artigo sobre esse assunto.";
    return "Ainda não tem nenhum artigo por aqui.";
  }

  return (
    <main className="mx-auto flex w-full max-w-[1440px] flex-col gap-6 px-5 pb-12 pt-6 md:px-14 md:pt-8">
      <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
        <div>
          <h1 className="font-titulo text-secao font-semibold text-texto-principal md:text-display">
            Blog para tutores
          </h1>
          <p className="mt-2 max-w-[720px] text-corpo text-texto-secundario">
            Artigos de quem resgata, cuida e abriga animais, pra quem vai adotar
            e pra quem já adotou.
          </p>
        </div>
        {podePublicar && <Botao para="/blog/novo">Escrever um artigo</Botao>}
      </div>

      <section
        aria-labelledby="pra-que-serve"
        className="rounded-[16px] border border-borda-sutil bg-fundo-superficie p-5 md:p-6"
      >
        <h2
          id="pra-que-serve"
          className="font-titulo text-item font-semibold text-texto-principal"
        >
          Pra que serve este blog
        </h2>
        <div className="mt-2 flex max-w-[860px] flex-col gap-2 text-corpo text-texto-secundario">
          <p>
            A ideia é a comunidade se ajudar. Quem já resgatou, cuidou ou abriga
            animais aprendeu muita coisa na prática, e isso pode fazer diferença
            pra quem está pensando em adotar ou acabou de levar um animal pra
            casa.
          </p>
          <p>
            Aqui os abrigos e os protetores contam o que sabem sobre adoção
            responsável, os primeiros dias em casa, saúde, comportamento e
            alimentação.
          </p>
          {convite() && <p>{convite()}</p>}
        </div>
      </section>

      {state?.aviso && (
        <p
          role="status"
          className="rounded-[10px] bg-status-disponivel-fundo px-4 py-3 text-compacto text-status-disponivel-texto"
        >
          {state.aviso}
        </p>
      )}

      <div className="flex flex-wrap gap-2">
        <Chip ativo={filtro === ""} onClick={() => escolher("")}>
          Todos
        </Chip>
        {categoriasDeArtigo.map(({ valor, nome }) => (
          <Chip
            key={valor}
            ativo={filtro === valor}
            onClick={() => escolher(valor)}
          >
            {nome}
          </Chip>
        ))}
        {meus?.artigos.length > 0 && (
          <Chip ativo={mostrandoMeus} onClick={() => escolher(MEUS)}>
            Escritos por mim
          </Chip>
        )}
      </div>

      {!mostrandoMeus && situacao === "carregando" && (
        <Carregando texto="Carregando os artigos..." />
      )}

      {!mostrandoMeus && situacao === "erro" && (
        <div
          role="alert"
          className="rounded-[16px] border border-borda-sutil bg-fundo-superficie p-8 text-center"
        >
          <p className="font-titulo text-item font-semibold text-texto-principal">
            Não foi possível carregar os artigos.
          </p>
          <p className="mt-1 text-compacto text-texto-secundario">
            Confira sua conexão e tente de novo.
          </p>
          <Botao variante="secundario" onClick={tentarDeNovo} className="mt-4">
            Tentar de novo
          </Botao>
        </div>
      )}

      {(mostrandoMeus || situacao === "pronto") && (
        <>
          <p role="status" className="sr-only">
            {totalDaLista === 1 ? "1 artigo" : `${totalDaLista} artigos`}
          </p>
          {lista.length === 0 ? (
            <div className="rounded-[16px] border border-borda-sutil bg-fundo-superficie p-8 text-center">
              <p className="font-titulo text-item font-semibold text-texto-principal">
                {mensagemDeVazio()}
              </p>
              {podePublicar && (
                <Botao para="/blog/novo" className="mt-4">
                  Escrever um artigo
                </Botao>
              )}
            </div>
          ) : (
            <div
              ref={grade}
              className="grid gap-[22px] md:grid-cols-2 lg:grid-cols-3"
            >
              {lista.map((artigo) => (
                <CardArtigo key={artigo.id} artigo={artigo} />
              ))}
            </div>
          )}
          {!mostrandoMeus && artigos.length < total && (
            <div className="flex flex-col items-center gap-3 pt-2">
              <p className="text-compacto text-texto-secundario">
                Mostrando {artigos.length} de {total} artigos
              </p>
              {erroMais && (
                <p
                  role="alert"
                  className="text-center text-compacto text-status-erro-texto"
                >
                  Não foi possível carregar mais artigos. Tente de novo.
                </p>
              )}
              <Botao
                variante="secundario"
                onClick={verMais}
                disabled={carregandoMais}
              >
                {carregandoMais ? "Carregando..." : "Ver mais artigos"}
              </Botao>
            </div>
          )}
        </>
      )}
    </main>
  );
}
