import { useEffect, useRef, useState } from "react";
import { Link } from "react-router-dom";
import Botao from "../Botao/Botao";
import CardAnimal from "../CardAnimal/CardAnimal";
import Carregando from "../Carregando/Carregando";
import FiltrosAnimais from "../FiltrosAnimais/FiltrosAnimais";
import { useAuth } from "../../contexts/AuthContext";
import { useValorAtrasado } from "../../hooks/useValorAtrasado";
import { filtrosVazios, listarAnimais } from "../../services/animais";
import fotoNenhumAnimal from "../../assets/fotos/nenhum-animal.webp";

// Tempo sem mexer nos filtros antes de buscar (evita uma busca por letra digitada na cidade)
const ESPERA_ANTES_DE_BUSCAR_MS = 300;

// Filtros + grade de cards
// fica na /animais e também aparece na Home do site
// aoCarregar (opcional) é chamado quando uma busca termina, com ou sem erro
// nivelDoTitulo vai pro nome do animal em cada card (ver CardAnimal)
export default function VitrineAnimais({ aoCarregar, nivelDoTitulo }) {
  const { usuario, token, sair } = useAuth();
  const [filtros, setFiltros] = useState(filtrosVazios);
  const [animais, setAnimais] = useState([]);
  const [carregando, setCarregando] = useState(true);
  const [erro, setErro] = useState(false);
  // Paginação: a API manda 12 por vez, e o "Ver mais animais" busca a próxima página
  const [total, setTotal] = useState(0);
  const [pagina, setPagina] = useState(0);
  const [carregandoMais, setCarregandoMais] = useState(false);
  const [erroMais, setErroMais] = useState(false);
  const [focarNoCard, setFocarNoCard] = useState(null);
  const grade = useRef(null);
  // Cada busca nova ganha um número. A resposta de um "Ver mais" que chegar depois
  // de a pessoa trocar o filtro é de outra busca, e fica de fora
  const buscaAtual = useRef(0);

  // Só o Usuario vê os animais do próprio estado (RF14). Visitante e Abrigo veem todos
  const filtraPeloEstado = usuario?.tipoConta === "USUARIO";

  // Os filtros "atrasados" só mudam quando a pessoa para de mexer por um instante
  const filtrosDaBusca = useValorAtrasado(filtros, ESPERA_ANTES_DE_BUSCAR_MS);

  // Busca de novo quando os filtros mudam ou quando alguém entra ou sai da conta
  useEffect(() => {
    let cancelado = false;
    buscaAtual.current += 1;

    listarAnimais(filtrosDaBusca, token)
      .then((resultado) => {
        if (cancelado) return;
        setAnimais(resultado.itens);
        setTotal(resultado.totalItens);
        setPagina(0);
        setErroMais(false);
        setCarregando(false);
      })
      .catch((erroDaApi) => {
        if (cancelado) return;
        // Token vencido ou inválido: a API responde 401 até nas rotas públicas (docs/api.md).
        // A sessão acabou: sai da conta, e a busca roda de novo sozinha, agora como visitante
        if (erroDaApi.status === 401 && token) {
          sair();
          return;
        }
        setErro(true);
        setCarregando(false);
      });

    // Se o filtro mudar antes da resposta chegar, essa resposta velha é descartada
    return () => {
      cancelado = true;
    };
  }, [filtrosDaBusca, token, sair]);

  useEffect(() => {
    if (!carregando) aoCarregar?.();
  }, [carregando, aoCarregar]);

  // Depois do "Ver mais", o foco vai pro primeiro animal novo. Sem isso, quem usa teclado
  // ficava sem foco quando o botão some na última página
  useEffect(() => {
    if (focarNoCard === null) return;
    grade.current?.children[focarNoCard]?.querySelector("a, button")?.focus();
    setFocarNoCard(null);
  }, [focarNoCard]);

  function verMais() {
    const busca = buscaAtual.current;
    const proxima = pagina + 1;
    setCarregandoMais(true);
    setErroMais(false);
    listarAnimais(filtrosDaBusca, token, proxima)
      .then((resultado) => {
        if (busca !== buscaAtual.current) return;
        // Se alguém cadastrou um animal enquanto a pessoa olhava, a lista anda uma casa
        // e um animal da página anterior pode vir de novo: ele não entra duas vezes
        const vistos = new Set(animais.map((animal) => animal.id));
        const novos = resultado.itens.filter((animal) => !vistos.has(animal.id));
        setAnimais([...animais, ...novos]);
        setTotal(resultado.totalItens);
        setPagina(proxima);
        if (novos.length > 0) setFocarNoCard(animais.length);
      })
      .catch((erroDaApi) => {
        if (busca !== buscaAtual.current) return;
        if (erroDaApi.status === 401 && token) {
          sair();
          return;
        }
        setErroMais(true);
      })
      .finally(() => setCarregandoMais(false));
  }

  function mudarFiltros(novos) {
    setCarregando(true);
    setErro(false);
    setFiltros(novos);
  }

  const temFiltro = Object.values(filtros).some(Boolean);

  // Pro leitor de tela: depois de cada busca, avisa quantos animais vieram
  let quantos = "";
  if (!carregando && !erro) {
    if (total === 0) quantos = "Nenhum animal encontrado";
    else if (total === 1) quantos = "1 animal encontrado";
    else quantos = `${total} animais encontrados`;
  }

  // UC06: FA02 quando tem filtro; FA01 ("no seu estado") quando é Usuario sem filtro
  function mensagemDeVazio() {
    if (temFiltro) return "Nenhum resultado encontrado com essas informações.";
    if (filtraPeloEstado)
      return "Nenhum animal disponível no seu estado no momento.";
    return "Nenhum animal disponível no momento.";
  }

  function avisoDoTopo() {
    if (!usuario) {
      return (
        <>
          Exibindo animais de todos os estados brasileiros,{" "}
          <Link to="/login" className="text-marca-roxo underline">
            entre para filtrar pelo seu
          </Link>
          .
        </>
      );
    }
    return filtraPeloEstado
      ? "Exibindo animais do seu estado."
      : "Exibindo animais de todos os estados brasileiros.";
  }

  function mostrarResultado() {
    if (carregando) {
      return <Carregando texto="Carregando animais..." />;
    }

    if (erro) {
      return (
        <div
          role="alert"
          className="rounded-[16px] border border-borda-sutil bg-fundo-superficie p-8 text-center"
        >
          <p className="font-titulo text-item font-semibold text-texto-principal">
            Não foi possível carregar os animais.
          </p>
          <p className="mt-1 text-compacto text-texto-secundario">
            Confira sua conexão e tente de novo. Se o site ficou um tempo
            parado, o primeiro acesso pode levar até um minuto.
          </p>
          <Botao
            variante="secundario"
            onClick={() => mudarFiltros({ ...filtros })}
            className="mt-4"
          >
            Tentar de novo
          </Botao>
        </div>
      );
    }

    if (animais.length === 0) {
      return (
        <div className="rounded-[16px] border border-borda-sutil bg-fundo-superficie p-8 text-center">
          <img
            src={fotoNenhumAnimal}
            alt=""
            className="mx-auto w-full max-w-[320px] rounded-[12px]"
          />
          <p className="mt-5 font-titulo text-item font-semibold text-texto-principal">
            {mensagemDeVazio()}
          </p>
          <p className="mt-1 text-compacto text-texto-secundario">
            {temFiltro
              ? "Tente tirar algum filtro ou buscar por outro nome."
              : "Novos animais aparecem aqui assim que os protetores cadastram."}
          </p>
          {temFiltro && (
            <Botao
              variante="secundario"
              onClick={() => mudarFiltros(filtrosVazios)}
              className="mt-4"
            >
              Ver todos os animais
            </Botao>
          )}
        </div>
      );
    }

    return (
      <>
        <div
          ref={grade}
          className="grid gap-[22px] md:grid-cols-2 lg:grid-cols-3"
        >
          {animais.map((animal) => (
            <CardAnimal
              key={animal.id}
              animal={animal}
              nivelDoTitulo={nivelDoTitulo}
            />
          ))}
        </div>

        {animais.length < total && (
          <div className="flex flex-col items-center gap-3 pt-2">
            <p className="text-compacto text-texto-secundario">
              Mostrando {animais.length} de {total} animais
            </p>
            {erroMais && (
              <p role="alert" className="text-center text-compacto text-status-erro-texto">
                Não foi possível carregar mais animais. Tente de novo.
              </p>
            )}
            <Botao
              variante="secundario"
              onClick={verMais}
              disabled={carregandoMais}
            >
              {carregandoMais ? "Carregando..." : "Ver mais animais"}
            </Botao>
          </div>
        )}
      </>
    );
  }

  return (
    <section className="flex flex-col gap-[18px]">
      <p className="text-legenda text-texto-terciario">{avisoDoTopo()}</p>

      <FiltrosAnimais filtros={filtros} aoMudar={mudarFiltros} />

      <p role="status" className="sr-only">
        {quantos}
      </p>

      {mostrarResultado()}
    </section>
  );
}
