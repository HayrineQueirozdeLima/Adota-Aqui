import { useEffect, useMemo, useRef, useState } from "react";
import { Link, useLocation } from "react-router-dom";
import Botao from "../../components/Botao/Botao";
import CardFeira from "../../components/CardFeira/CardFeira";
import Carregando from "../../components/Carregando/Carregando";
import SetaSelecao from "../../components/SetaSelecao/SetaSelecao";
import { useAuth } from "../../contexts/AuthContext";
import { useTituloDaPagina } from "../../hooks/useTituloDaPagina";
import { useValorAtrasado } from "../../hooks/useValorAtrasado";
import { apagarFeira, filtrosDeFeiraVazios, listarFeiras } from "../../services/feiras";
import { buscarPerfil } from "../../services/perfil";
import { estados } from "../../utils/rotulos";

// Tempo sem mexer na cidade antes de buscar (o mesmo da vitrine)
const ESPERA_ANTES_DE_BUSCAR_MS = 300;

const estiloDoCampo =
  "w-full rounded-full border border-borda-sutil bg-fundo-superficie px-[18px] py-2.5 text-campo text-texto-principal md:w-[260px]";

// Feiras de adoção, em /feiras. Aberta pra qualquer pessoa, com as feiras que ainda vão acontecer.
// Quem está logado já vê as do próprio estado (dá pra trocar). Só abrigo divulga feira
export default function Feiras() {
  const { usuario, token, sair } = useAuth();
  const { state } = useLocation();
  const tipoConta = usuario?.tipoConta;
  const [filtros, setFiltros] = useState(filtrosDeFeiraVazios);
  // Logado, espera o estado do perfil antes da primeira busca, pra não buscar duas vezes
  const [prontoPraBuscar, setProntoPraBuscar] = useState(!tipoConta);
  // Só a cidade, que é digitada, espera a pessoa parar. O estado busca na hora
  const cidadeDaBusca = useValorAtrasado(filtros.cidade, ESPERA_ANTES_DE_BUSCAR_MS);
  const filtrosDaBusca = useMemo(
    () => ({ estado: filtros.estado, cidade: cidadeDaBusca }),
    [filtros.estado, cidadeDaBusca],
  );
  const [feiras, setFeiras] = useState([]);
  const [total, setTotal] = useState(0);
  const [pagina, setPagina] = useState(0);
  // "carregando" | "pronto" | "erro"
  const [situacao, setSituacao] = useState("carregando");
  const [tentativa, setTentativa] = useState(0);
  const [carregandoMais, setCarregandoMais] = useState(false);
  const [erroMais, setErroMais] = useState(false);
  const [aviso, setAviso] = useState(state?.aviso ?? "");
  const buscaAtual = useRef(0);
  useTituloDaPagina("Feiras de adoção");

  // O estado do perfil vira o filtro inicial. Se o perfil não vier, a lista abre com todos os estados
  useEffect(() => {
    if (!tipoConta) return undefined;
    let cancelado = false;
    buscarPerfil(tipoConta, token)
      .then((perfil) => {
        if (cancelado) return;
        const estado = perfil?.endereco?.estado;
        if (estados[estado]) setFiltros((atuais) => ({ ...atuais, estado }));
      })
      .catch((erro) => {
        if (!cancelado && erro.status === 401) sair();
      })
      .finally(() => {
        if (!cancelado) setProntoPraBuscar(true);
      });
    return () => {
      cancelado = true;
    };
  }, [tipoConta, token, sair]);

  useEffect(() => {
    if (!prontoPraBuscar) return undefined;
    let cancelado = false;
    buscaAtual.current += 1;
    setSituacao("carregando");
    listarFeiras(filtrosDaBusca)
      .then((resultado) => {
        if (cancelado) return;
        setFeiras(resultado.itens);
        setTotal(resultado.totalItens);
        setPagina(0);
        setErroMais(false);
        setSituacao("pronto");
      })
      .catch(() => {
        if (!cancelado) setSituacao("erro");
      });
    return () => {
      cancelado = true;
    };
  }, [filtrosDaBusca, prontoPraBuscar, tentativa]);

  function mudar(campo, valor) {
    setFiltros({ ...filtros, [campo]: valor });
  }

  function limpar() {
    setFiltros({ ...filtrosDeFeiraVazios });
  }

  function verMais() {
    const busca = buscaAtual.current;
    const proxima = pagina + 1;
    setCarregandoMais(true);
    setErroMais(false);
    listarFeiras(filtrosDaBusca, proxima)
      .then((resultado) => {
        if (busca !== buscaAtual.current) return;
        const vistas = new Set(feiras.map((feira) => feira.id));
        setFeiras([...feiras, ...resultado.itens.filter((feira) => !vistas.has(feira.id))]);
        setTotal(resultado.totalItens);
        setPagina(proxima);
      })
      .catch(() => {
        if (busca === buscaAtual.current) setErroMais(true);
      })
      .finally(() => setCarregandoMais(false));
  }

  // O card espera a API responder. Se der erro, a mensagem aparece no próprio card
  async function apagar(feira) {
    try {
      await apagarFeira(feira.id, token);
    } catch (erro) {
      if (erro.status === 401) sair();
      throw erro;
    }
    setFeiras((atuais) => atuais.filter((outra) => outra.id !== feira.id));
    setTotal((atual) => atual - 1);
    setAviso(`A feira "${feira.titulo}" foi apagada.`);
  }

  const temFiltro = Object.values(filtros).some(Boolean);
  const ehAbrigo = tipoConta === "ABRIGO";

  let quantas = "";
  if (situacao === "pronto") {
    if (total === 0) quantas = "Nenhuma feira encontrada";
    else if (total === 1) quantas = "1 feira encontrada";
    else quantas = `${total} feiras encontradas`;
  }

  function mostrarResultado() {
    if (situacao === "carregando") {
      return <Carregando texto="Carregando as feiras..." />;
    }

    if (situacao === "erro") {
      return (
        <div
          role="alert"
          className="rounded-[16px] border border-borda-sutil bg-fundo-superficie p-8 text-center"
        >
          <p className="font-titulo text-item font-semibold text-texto-principal">
            Não foi possível carregar as feiras.
          </p>
          <p className="mt-1 text-compacto text-texto-secundario">
            Confira sua conexão e tente de novo. Se o site ficou um tempo
            parado, o primeiro acesso pode levar até um minuto.
          </p>
          <Botao
            variante="secundario"
            onClick={() => setTentativa((atual) => atual + 1)}
            className="mt-4"
          >
            Tentar de novo
          </Botao>
        </div>
      );
    }

    if (feiras.length === 0) {
      const lugar = filtros.estado ? ` em ${estados[filtros.estado]}` : "";
      return (
        <div className="rounded-[16px] border border-borda-sutil bg-fundo-superficie p-8 text-center">
          <p className="font-titulo text-item font-semibold text-texto-principal">
            {filtros.cidade
              ? "Nenhuma feira marcada nessa cidade por enquanto."
              : `Nenhuma feira marcada${lugar} por enquanto.`}
          </p>
          <p className="mt-1 text-compacto text-texto-secundario">
            {ehAbrigo
              ? "Divulgue a próxima feira do seu abrigo e ela aparece aqui."
              : "Os abrigos divulgam as feiras aqui. Enquanto isso, conheça os animais pelo site."}
          </p>
          <div className="mt-4 flex flex-wrap justify-center gap-2">
            {temFiltro && (
              <Botao variante="secundario" onClick={limpar}>
                Ver feiras de todo o Brasil
              </Botao>
            )}
            {!ehAbrigo && (
              <Botao variante="neutro" para="/animais">
                Ver animais para adoção
              </Botao>
            )}
          </div>
        </div>
      );
    }

    return (
      <>
        <div className="grid gap-[22px] lg:grid-cols-2 lg:items-start">
          {feiras.map((feira) => (
            <CardFeira key={feira.id} feira={feira} aoApagar={apagar} />
          ))}
        </div>

        {feiras.length < total && (
          <div className="flex flex-col items-center gap-3 pt-2">
            <p className="text-compacto text-texto-secundario">
              Mostrando {feiras.length} de {total}
            </p>
            {erroMais && (
              <p role="alert" className="text-center text-compacto text-status-erro-texto">
                Não foi possível carregar mais. Tente de novo.
              </p>
            )}
            <Botao variante="secundario" onClick={verMais} disabled={carregandoMais}>
              {carregandoMais ? "Carregando..." : "Ver mais feiras"}
            </Botao>
          </div>
        )}
      </>
    );
  }

  return (
    <main className="mx-auto flex w-full max-w-[1440px] flex-col gap-6 px-5 pb-12 pt-6 md:px-14 md:pt-8">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="font-titulo text-secao font-semibold text-texto-principal md:text-display">
            Feiras de adoção
          </h1>
          <p className="mt-2 max-w-[720px] text-corpo text-texto-secundario">
            Os abrigos levam os animais pra um lugar aberto, e quem quer adotar
            conhece cada um pessoalmente. Veja as próximas feiras e anote na
            agenda.
          </p>
          {!usuario && (
            <p className="mt-2 max-w-[720px] text-compacto text-texto-secundario">
              Cuida de um abrigo?{" "}
              <Link to="/login" className="text-marca-roxo underline">
                Entre com a conta do abrigo
              </Link>{" "}
              pra divulgar as suas feiras.
            </p>
          )}
        </div>
        {ehAbrigo && <Botao para="/feiras/nova">Divulgar uma feira</Botao>}
      </div>

      {aviso && (
        <p
          role="status"
          className="rounded-[10px] bg-status-disponivel-fundo px-4 py-3 text-compacto text-status-disponivel-texto"
        >
          {aviso}
        </p>
      )}

      <div className="flex flex-wrap items-center gap-2.5">
        <div className="relative inline-flex">
          <select
            aria-label="Estado"
            value={filtros.estado}
            onChange={(evento) => mudar("estado", evento.target.value)}
            className={`appearance-none rounded-full border py-2 pl-4 pr-10 font-titulo text-campo font-semibold focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-marca-roxo ${
              filtros.estado
                ? "border-texto-principal bg-texto-principal text-fundo-superficie"
                : "border-borda-sutil bg-fundo-superficie text-texto-principal"
            }`}
          >
            <option value="">Todos os estados</option>
            {Object.entries(estados).map(([sigla, nome]) => (
              <option key={sigla} value={sigla}>
                {nome}
              </option>
            ))}
          </select>
          <SetaSelecao
            className={`right-4 ${filtros.estado ? "text-fundo-superficie" : "text-texto-principal"}`}
          />
        </div>
        <input
          type="search"
          aria-label="Cidade"
          placeholder="Cidade"
          maxLength={80}
          value={filtros.cidade}
          onChange={(evento) => mudar("cidade", evento.target.value)}
          className={estiloDoCampo}
        />
        {temFiltro && (
          <button
            type="button"
            onClick={limpar}
            className="px-2 font-titulo text-campo font-semibold text-marca-roxo underline"
          >
            Limpar filtros
          </button>
        )}
      </div>

      <p role="status" className="sr-only">
        {quantas}
      </p>

      {mostrarResultado()}
    </main>
  );
}
