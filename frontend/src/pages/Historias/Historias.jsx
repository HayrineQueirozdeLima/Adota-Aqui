import { useEffect, useRef, useState } from "react";
import Botao from "../../components/Botao/Botao";
import CardDepoimento from "../../components/CardDepoimento/CardDepoimento";
import Carregando from "../../components/Carregando/Carregando";
import { useTituloDaPagina } from "../../hooks/useTituloDaPagina";
import { listarDepoimentos } from "../../services/depoimentos";

// Mural de histórias de adoção (RF11, ERS 6.3), em /historias. Aberto pra qualquer pessoa.
// As histórias vêm de 12 em 12, das mais novas pras mais antigas, com o "Ver mais histórias" embaixo
export default function Historias() {
  const [historias, setHistorias] = useState([]);
  const [total, setTotal] = useState(0);
  const [pagina, setPagina] = useState(0);
  // "carregando" | "pronto" | "erro"
  const [situacao, setSituacao] = useState("carregando");
  const [tentativa, setTentativa] = useState(0);
  const [carregandoMais, setCarregandoMais] = useState(false);
  const [erroMais, setErroMais] = useState(false);
  const [focarNaHistoria, setFocarNaHistoria] = useState(null);
  const grade = useRef(null);
  useTituloDaPagina("Histórias de adoção");

  useEffect(() => {
    let cancelado = false;
    listarDepoimentos()
      .then((resultado) => {
        if (cancelado) return;
        setHistorias(resultado.itens);
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
  }, [tentativa]);

  // Depois do "Ver mais histórias", o foco vai pra primeira história nova
  useEffect(() => {
    if (focarNaHistoria === null) return;
    grade.current?.children[focarNaHistoria]?.focus();
    setFocarNaHistoria(null);
  }, [focarNaHistoria]);

  function tentarDeNovo() {
    setSituacao("carregando");
    setTentativa((atual) => atual + 1);
  }

  function verMais() {
    const proxima = pagina + 1;
    setCarregandoMais(true);
    setErroMais(false);
    listarDepoimentos(proxima)
      .then((resultado) => {
        // Uma história nova publicada no meio empurra a lista: a que já apareceu não entra de novo
        const vistas = new Set(historias.map((historia) => historia.id));
        const novas = resultado.itens.filter((historia) => !vistas.has(historia.id));
        setHistorias([...historias, ...novas]);
        setTotal(resultado.totalItens);
        setPagina(proxima);
        if (novas.length > 0) setFocarNaHistoria(historias.length);
      })
      .catch(() => setErroMais(true))
      .finally(() => setCarregandoMais(false));
  }

  return (
    <main className="mx-auto flex w-full max-w-[1440px] flex-col gap-6 px-5 pb-12 pt-6 md:px-14 md:pt-8">
      <div>
        <h1 className="font-titulo text-secao font-semibold text-texto-principal md:text-display">
          Histórias de adoção
        </h1>
        <p className="mt-2 max-w-[720px] text-corpo text-texto-secundario">
          Quem adotou pelo Adota Aqui conta aqui como está a vida com o novo
          amigo. Adotou pelo site? Você pode contar a sua em Minhas
          candidaturas.
        </p>
      </div>

      {situacao === "carregando" && (
        <Carregando texto="Carregando histórias..." />
      )}

      {situacao === "erro" && (
        <div
          role="alert"
          className="rounded-[16px] border border-borda-sutil bg-fundo-superficie p-8 text-center"
        >
          <p className="font-titulo text-item font-semibold text-texto-principal">
            Não foi possível carregar as histórias.
          </p>
          <p className="mt-1 text-compacto text-texto-secundario">
            Confira sua conexão e tente de novo.
          </p>
          <Botao variante="secundario" onClick={tentarDeNovo} className="mt-4">
            Tentar de novo
          </Botao>
        </div>
      )}

      {situacao === "pronto" && historias.length === 0 && (
        <div className="rounded-[16px] border border-borda-sutil bg-fundo-superficie p-8 text-center">
          <p className="font-titulo text-item font-semibold text-texto-principal">
            Ainda não tem nenhuma história por aqui.
          </p>
          <p className="mt-1 text-compacto text-texto-secundario">
            Quando alguém adotar pelo site e contar como foi, a história
            aparece aqui.
          </p>
          <Botao para="/animais" className="mt-4">
            Ver animais disponíveis
          </Botao>
        </div>
      )}

      {situacao === "pronto" && historias.length > 0 && (
        <>
          <p role="status" className="sr-only">
            {total === 1 ? "1 história" : `${total} histórias`}
          </p>
          <div
            ref={grade}
            className="grid gap-[22px] md:grid-cols-2 lg:grid-cols-3"
          >
            {historias.map((historia) => (
              <CardDepoimento key={historia.id} depoimento={historia} />
            ))}
          </div>
          {historias.length < total && (
            <div className="flex flex-col items-center gap-3 pt-2">
              <p className="text-compacto text-texto-secundario">
                Mostrando {historias.length} de {total} histórias
              </p>
              {erroMais && (
                <p
                  role="alert"
                  className="text-center text-compacto text-status-erro-texto"
                >
                  Não foi possível carregar mais histórias. Tente de novo.
                </p>
              )}
              <Botao
                variante="secundario"
                onClick={verMais}
                disabled={carregandoMais}
              >
                {carregandoMais ? "Carregando..." : "Ver mais histórias"}
              </Botao>
            </div>
          )}
        </>
      )}
    </main>
  );
}
