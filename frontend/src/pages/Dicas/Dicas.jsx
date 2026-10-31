import { useEffect, useRef, useState } from "react";
import { useLocation } from "react-router-dom";
import Botao from "../../components/Botao/Botao";
import CardDica from "../../components/CardDica/CardDica";
import Carregando from "../../components/Carregando/Carregando";
import Chip from "../../components/Chip/Chip";
import { useAuth } from "../../contexts/AuthContext";
import { useTituloDaPagina } from "../../hooks/useTituloDaPagina";
import { listarDicas, minhasDicas } from "../../services/dicas";
import { categoriasDeDica } from "../../utils/rotulos";

// "Escritas por mim" não é um assunto: mostra as dicas da conta logada
const MINHAS = "MINHAS";

// Blog de dicas, em /dicas: qualquer pessoa lê. Protetor (abrigo, ou pessoa que já cadastrou animal) vê
// o "Escrever uma dica". As dicas vêm de 12 em 12, das mais novas pras mais antigas
export default function Dicas() {
  const { usuario, token, sair } = useAuth();
  const { state } = useLocation();
  const [filtro, setFiltro] = useState("");
  const [dicas, setDicas] = useState([]);
  const [total, setTotal] = useState(0);
  const [pagina, setPagina] = useState(0);
  // "carregando" | "pronto" | "erro"
  const [situacao, setSituacao] = useState("carregando");
  const [tentativa, setTentativa] = useState(0);
  const [carregandoMais, setCarregandoMais] = useState(false);
  const [erroMais, setErroMais] = useState(false);
  const [minhas, setMinhas] = useState(null);
  const [focarNaDica, setFocarNaDica] = useState(null);
  const grade = useRef(null);
  // Cada busca nova ganha um número: o "Ver mais" que voltar depois de a pessoa trocar o assunto fica de fora
  const buscaAtual = useRef(0);
  useTituloDaPagina("Dicas pra adotar e cuidar");

  // Logado: as dicas da conta e se ela pode publicar
  useEffect(() => {
    if (!token) {
      setMinhas(null);
      return;
    }
    let cancelado = false;
    minhasDicas(token)
      .then((resposta) => {
        if (!cancelado) setMinhas(resposta);
      })
      .catch((erro) => {
        if (!cancelado && erro.status === 401) sair();
      });
    return () => {
      cancelado = true;
    };
  }, [token, sair]);

  useEffect(() => {
    if (filtro === MINHAS) return;
    let cancelado = false;
    buscaAtual.current += 1;
    listarDicas({ categoria: filtro })
      .then((resultado) => {
        if (cancelado) return;
        setDicas(resultado.itens);
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
    if (focarNaDica === null) return;
    grade.current?.children[focarNaDica]?.querySelector("a")?.focus();
    setFocarNaDica(null);
  }, [focarNaDica]);

  function escolher(valor) {
    setErroMais(false);
    if (valor !== MINHAS) setSituacao("carregando");
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
    listarDicas({ categoria: filtro, pagina: proxima })
      .then((resultado) => {
        if (busca !== buscaAtual.current) return;
        const vistas = new Set(dicas.map((dica) => dica.id));
        const novas = resultado.itens.filter((dica) => !vistas.has(dica.id));
        setDicas([...dicas, ...novas]);
        setTotal(resultado.totalItens);
        setPagina(proxima);
        if (novas.length > 0) setFocarNaDica(dicas.length);
      })
      .catch(() => {
        if (busca === buscaAtual.current) setErroMais(true);
      })
      .finally(() => setCarregandoMais(false));
  }

  const podePublicar = Boolean(usuario && minhas?.podePublicar);
  const mostrandoMinhas = filtro === MINHAS;
  const lista = mostrandoMinhas ? (minhas?.dicas ?? []) : dicas;
  const totalDaLista = mostrandoMinhas ? lista.length : total;

  function mensagemDeVazio() {
    if (mostrandoMinhas) return "Você ainda não escreveu nenhuma dica.";
    if (filtro) return "Ainda não tem dica sobre esse assunto.";
    return "Ainda não tem nenhuma dica por aqui.";
  }

  return (
    <main className="mx-auto flex w-full max-w-[1440px] flex-col gap-6 px-5 pb-12 pt-6 md:px-14 md:pt-8">
      <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
        <div>
          <h1 className="font-titulo text-secao font-semibold text-texto-principal md:text-display">
            Dicas pra adotar e cuidar
          </h1>
          <p className="mt-2 max-w-[720px] text-corpo text-texto-secundario">
            Escritas por abrigos e por quem já resgatou um animal: o que saber
            antes de adotar e como cuidar bem depois.
          </p>
        </div>
        {podePublicar && <Botao para="/dicas/nova">Escrever uma dica</Botao>}
      </div>

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
          Todas
        </Chip>
        {categoriasDeDica.map(({ valor, nome }) => (
          <Chip key={valor} ativo={filtro === valor} onClick={() => escolher(valor)}>
            {nome}
          </Chip>
        ))}
        {minhas?.dicas.length > 0 && (
          <Chip ativo={mostrandoMinhas} onClick={() => escolher(MINHAS)}>
            Escritas por mim
          </Chip>
        )}
      </div>

      {!mostrandoMinhas && situacao === "carregando" && (
        <Carregando texto="Carregando dicas..." />
      )}

      {!mostrandoMinhas && situacao === "erro" && (
        <div
          role="alert"
          className="rounded-[16px] border border-borda-sutil bg-fundo-superficie p-8 text-center"
        >
          <p className="font-titulo text-item font-semibold text-texto-principal">
            Não foi possível carregar as dicas.
          </p>
          <p className="mt-1 text-compacto text-texto-secundario">
            Confira sua conexão e tente de novo.
          </p>
          <Botao variante="secundario" onClick={tentarDeNovo} className="mt-4">
            Tentar de novo
          </Botao>
        </div>
      )}

      {(mostrandoMinhas || situacao === "pronto") && (
        <>
          <p role="status" className="sr-only">
            {totalDaLista === 1 ? "1 dica" : `${totalDaLista} dicas`}
          </p>
          {lista.length === 0 ? (
            <div className="rounded-[16px] border border-borda-sutil bg-fundo-superficie p-8 text-center">
              <p className="font-titulo text-item font-semibold text-texto-principal">
                {mensagemDeVazio()}
              </p>
              {podePublicar && (
                <Botao para="/dicas/nova" className="mt-4">
                  Escrever uma dica
                </Botao>
              )}
            </div>
          ) : (
            <div ref={grade} className="grid gap-[22px] md:grid-cols-2 lg:grid-cols-3">
              {lista.map((dica) => (
                <CardDica key={dica.id} dica={dica} />
              ))}
            </div>
          )}
          {!mostrandoMinhas && dicas.length < total && (
            <div className="flex flex-col items-center gap-3 pt-2">
              <p className="text-compacto text-texto-secundario">
                Mostrando {dicas.length} de {total} dicas
              </p>
              {erroMais && (
                <p role="alert" className="text-center text-compacto text-status-erro-texto">
                  Não foi possível carregar mais dicas. Tente de novo.
                </p>
              )}
              <Botao variante="secundario" onClick={verMais} disabled={carregandoMais}>
                {carregandoMais ? "Carregando..." : "Ver mais dicas"}
              </Botao>
            </div>
          )}
        </>
      )}
    </main>
  );
}
