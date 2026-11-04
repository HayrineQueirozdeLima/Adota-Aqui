import { useEffect, useRef, useState } from "react";
import { Link } from "react-router-dom";
import Botao from "../../components/Botao/Botao";
import CardProtetor from "../../components/CardProtetor/CardProtetor";
import Carregando from "../../components/Carregando/Carregando";
import Chip from "../../components/Chip/Chip";
import { useAuth } from "../../contexts/AuthContext";
import { useTituloDaPagina } from "../../hooks/useTituloDaPagina";
import { useValorAtrasado } from "../../hooks/useValorAtrasado";
import {
  filtrosDeProtetorVazios,
  listarProtetores,
} from "../../services/protetores";
import { estados } from "../../utils/rotulos";

// Tempo sem mexer nos filtros antes de buscar (o mesmo da vitrine)
const ESPERA_ANTES_DE_BUSCAR_MS = 300;

const tipos = [
  { valor: "", nome: "Todos" },
  { valor: "ABRIGO", nome: "Abrigos" },
  { valor: "USUARIO", nome: "Protetores independentes" },
];

const estiloDoCampo =
  "w-full rounded-full border border-borda-sutil bg-fundo-superficie px-[18px] py-2.5 text-campo text-texto-principal md:w-[260px]";

// Abrigos e protetores independentes (link do rodapé), em /protetores. Aberta pra qualquer pessoa.
// Em ordem alfabética, de 12 em 12, com filtro por tipo, estado, cidade e nome
export default function Protetores() {
  const { usuario } = useAuth();
  const [filtros, setFiltros] = useState(filtrosDeProtetorVazios);
  const filtrosDaBusca = useValorAtrasado(filtros, ESPERA_ANTES_DE_BUSCAR_MS);
  const [protetores, setProtetores] = useState([]);
  const [total, setTotal] = useState(0);
  const [pagina, setPagina] = useState(0);
  // "carregando" | "pronto" | "erro"
  const [situacao, setSituacao] = useState("carregando");
  const [tentativa, setTentativa] = useState(0);
  const [carregandoMais, setCarregandoMais] = useState(false);
  const [erroMais, setErroMais] = useState(false);
  const [focarNoCard, setFocarNoCard] = useState(null);
  const grade = useRef(null);
  // Cada busca nova ganha um número. A resposta de um "Ver mais" que chegar depois
  // de a pessoa trocar o filtro é de outra busca, e fica de fora
  const buscaAtual = useRef(0);
  useTituloDaPagina("Abrigos e protetores");

  useEffect(() => {
    let cancelado = false;
    buscaAtual.current += 1;
    listarProtetores(filtrosDaBusca)
      .then((resultado) => {
        if (cancelado) return;
        setProtetores(resultado.itens);
        setTotal(resultado.totalItens);
        setPagina(0);
        setErroMais(false);
        setSituacao("pronto");
      })
      .catch(() => {
        if (!cancelado) setSituacao("erro");
      });
    // Se o filtro mudar antes da resposta chegar, essa resposta velha é descartada
    return () => {
      cancelado = true;
    };
  }, [filtrosDaBusca, tentativa]);

  // Depois do "Ver mais", o foco vai pro primeiro card novo
  useEffect(() => {
    if (focarNoCard === null) return;
    grade.current?.children[focarNoCard]?.focus();
    setFocarNoCard(null);
  }, [focarNoCard]);

  function mudar(campo, valor) {
    setSituacao("carregando");
    setFiltros({ ...filtros, [campo]: valor });
  }

  // Um objeto novo, pra busca rodar de novo mesmo que os filtros já estivessem vazios
  function limpar() {
    setSituacao("carregando");
    setFiltros({ ...filtrosDeProtetorVazios });
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
    listarProtetores(filtrosDaBusca, proxima)
      .then((resultado) => {
        if (busca !== buscaAtual.current) return;
        // Alguém que se cadastrou no meio empurra a lista: quem já apareceu não entra de novo
        const vistos = new Set(protetores.map((protetor) => protetor.id));
        const novos = resultado.itens.filter(
          (protetor) => !vistos.has(protetor.id),
        );
        setProtetores([...protetores, ...novos]);
        setTotal(resultado.totalItens);
        setPagina(proxima);
        if (novos.length > 0) setFocarNoCard(protetores.length);
      })
      .catch(() => {
        if (busca === buscaAtual.current) setErroMais(true);
      })
      .finally(() => setCarregandoMais(false));
  }

  const temFiltro = Object.values(filtros).some(Boolean);

  // Pro leitor de tela: depois de cada busca, avisa quantos vieram
  let quantos = "";
  if (situacao === "pronto") {
    if (total === 0) quantos = "Nenhum abrigo ou protetor encontrado";
    else if (total === 1) quantos = "1 abrigo ou protetor encontrado";
    else quantos = `${total} abrigos e protetores encontrados`;
  }

  function convite() {
    if (!usuario) {
      return (
        <>
          Cuida de um abrigo ou resgatou um animal?{" "}
          <Link to="/cadastro" className="text-marca-roxo underline">
            Crie sua conta
          </Link>{" "}
          e cadastre os animais que procuram um lar.
        </>
      );
    }
    if (usuario.tipoConta === "USUARIO") {
      return (
        <>
          Resgatou um animal?{" "}
          <Link to="/meus-animais/novo" className="text-marca-roxo underline">
            Cadastre ele
          </Link>{" "}
          e você passa a aparecer aqui como protetor independente.
        </>
      );
    }
    return null;
  }

  function mostrarResultado() {
    if (situacao === "carregando") {
      return <Carregando texto="Carregando abrigos e protetores..." />;
    }

    if (situacao === "erro") {
      return (
        <div
          role="alert"
          className="rounded-[16px] border border-borda-sutil bg-fundo-superficie p-8 text-center"
        >
          <p className="font-titulo text-item font-semibold text-texto-principal">
            Não foi possível carregar os abrigos e protetores.
          </p>
          <p className="mt-1 text-compacto text-texto-secundario">
            Confira sua conexão e tente de novo. Se o site ficou um tempo
            parado, o primeiro acesso pode levar até um minuto.
          </p>
          <Botao variante="secundario" onClick={tentarDeNovo} className="mt-4">
            Tentar de novo
          </Botao>
        </div>
      );
    }

    if (protetores.length === 0) {
      return (
        <div className="rounded-[16px] border border-borda-sutil bg-fundo-superficie p-8 text-center">
          <p className="font-titulo text-item font-semibold text-texto-principal">
            {temFiltro
              ? "Nenhum resultado encontrado com essas informações."
              : "Ainda não tem nenhum abrigo ou protetor por aqui."}
          </p>
          <p className="mt-1 text-compacto text-texto-secundario">
            {temFiltro
              ? "Tente tirar algum filtro ou buscar por outro nome."
              : "Assim que alguém cadastrar um abrigo ou um animal, aparece aqui."}
          </p>
          {temFiltro && (
            <Botao variante="secundario" onClick={limpar} className="mt-4">
              Ver todos
            </Botao>
          )}
        </div>
      );
    }

    return (
      <>
        <div
          ref={grade}
          className="grid grid-cols-[repeat(auto-fill,minmax(16.25rem,1fr))] gap-[22px]"
        >
          {protetores.map((protetor) => (
            <CardProtetor key={protetor.id} protetor={protetor} />
          ))}
        </div>

        {protetores.length < total && (
          <div className="flex flex-col items-center gap-3 pt-2">
            <p className="text-compacto text-texto-secundario">
              Mostrando {protetores.length} de {total}
            </p>
            {erroMais && (
              <p
                role="alert"
                className="text-center text-compacto text-status-erro-texto"
              >
                Não foi possível carregar mais. Tente de novo.
              </p>
            )}
            <Botao
              variante="secundario"
              onClick={verMais}
              disabled={carregandoMais}
            >
              {carregandoMais ? "Carregando..." : "Ver mais"}
            </Botao>
          </div>
        )}
      </>
    );
  }

  return (
    <main className="mx-auto flex w-full max-w-[1440px] flex-col gap-6 px-5 pb-12 pt-6 md:px-14 md:pt-8">
      <div>
        <h1 className="font-titulo text-secao font-semibold text-texto-principal md:text-display">
          Abrigos e protetores
        </h1>
        <p className="mt-2 max-w-[720px] text-corpo text-texto-secundario">
          Quem cuida dos animais do Adota Aqui: abrigos, ONGs e pessoas que
          resgataram um animal por conta própria e procuram um lar pra ele, os
          protetores independentes.
        </p>
        {convite() && (
          <p className="mt-2 max-w-[720px] text-compacto text-texto-secundario">
            {convite()}
          </p>
        )}
      </div>

      <div className="flex flex-wrap items-center gap-2.5">
        <input
          type="search"
          aria-label="Buscar pelo nome"
          placeholder="Nome do abrigo ou do protetor"
          maxLength={80}
          value={filtros.busca}
          onChange={(evento) => mudar("busca", evento.target.value)}
          className={estiloDoCampo}
        />
        <input
          type="search"
          aria-label="Cidade"
          placeholder="Cidade"
          maxLength={80}
          value={filtros.cidade}
          onChange={(evento) => mudar("cidade", evento.target.value)}
          className={estiloDoCampo}
        />
        <select
          aria-label="Estado"
          value={filtros.estado}
          onChange={(evento) => mudar("estado", evento.target.value)}
          className={`rounded-full border px-4 py-2 font-titulo text-campo font-semibold focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-marca-roxo ${
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

        {tipos.map((tipo) => (
          <Chip
            key={tipo.nome}
            ativo={filtros.tipo === tipo.valor}
            onClick={() => mudar("tipo", tipo.valor)}
          >
            {tipo.nome}
          </Chip>
        ))}

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
        {quantos}
      </p>

      {mostrarResultado()}
    </main>
  );
}
