import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import CardAnimal from "../CardAnimal/CardAnimal";
import FiltrosAnimais from "../FiltrosAnimais/FiltrosAnimais";
import { useAuth } from "../../contexts/AuthContext";
import { useValorAtrasado } from "../../hooks/useValorAtrasado";
import { filtrosVazios, listarAnimais } from "../../services/animais";

// Tempo sem mexer nos filtros antes de buscar (evita uma busca por letra digitada na cidade)
const ESPERA_ANTES_DE_BUSCAR_MS = 300;

// Filtros + grade de cards
// fica na /animais e também aparece na Home do site
export default function VitrineAnimais() {
  const { usuario, token, sair } = useAuth();
  const [filtros, setFiltros] = useState(filtrosVazios);
  const [animais, setAnimais] = useState([]);
  const [carregando, setCarregando] = useState(true);
  const [erro, setErro] = useState(false);

  // Só o Usuario vê os animais do próprio estado (RF14). Visitante e Abrigo veem todos
  const filtraPeloEstado = usuario?.tipoConta === "USUARIO";

  // Os filtros "atrasados" só mudam quando a pessoa para de mexer por um instante
  const filtrosDaBusca = useValorAtrasado(filtros, ESPERA_ANTES_DE_BUSCAR_MS);

  // Busca de novo quando os filtros mudam ou quando alguém entra ou sai da conta
  useEffect(() => {
    let cancelado = false;

    listarAnimais(filtrosDaBusca, token)
      .then((lista) => {
        if (cancelado) return;
        setAnimais(lista);
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

  function mudarFiltros(novos) {
    setCarregando(true);
    setErro(false);
    setFiltros(novos);
  }

  const temFiltro = Object.values(filtros).some(Boolean);

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
      return (
        <p
          role="status"
          className="py-10 text-center text-legenda text-texto-terciario"
        >
          Carregando animais...
        </p>
      );
    }

    if (erro) {
      return (
        <div
          role="alert"
          className="rounded-[16px] border border-borda-sutil bg-fundo-superficie p-8 text-center"
        >
          <p className="text-texto-principal">
            Não foi possível carregar os animais. Confira sua conexão e tente de
            novo.
          </p>
          <button
            type="button"
            onClick={() => mudarFiltros({ ...filtros })}
            className="mt-3 font-titulo font-semibold text-marca-roxo underline"
          >
            Tentar de novo
          </button>
        </div>
      );
    }

    if (animais.length === 0) {
      return (
        <div className="rounded-[16px] border border-borda-sutil bg-fundo-superficie p-8 text-center">
          <p className="text-texto-principal">{mensagemDeVazio()}</p>
          {temFiltro && (
            <button
              type="button"
              onClick={() => mudarFiltros(filtrosVazios)}
              className="mt-3 font-titulo font-semibold text-marca-roxo underline"
            >
              Ver todos os animais
            </button>
          )}
        </div>
      );
    }

    return (
      <div className="grid gap-[22px] md:grid-cols-2 lg:grid-cols-3">
        {animais.map((animal) => (
          <CardAnimal key={animal.id} animal={animal} />
        ))}
      </div>
    );
  }

  return (
    <section className="flex flex-col gap-[18px]">
      <p className="text-legenda text-texto-terciario">{avisoDoTopo()}</p>

      <FiltrosAnimais filtros={filtros} aoMudar={mudarFiltros} />

      {mostrarResultado()}
    </section>
  );
}
