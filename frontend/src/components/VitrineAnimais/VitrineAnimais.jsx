import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import CardAnimal from "../CardAnimal/CardAnimal";
import FiltrosAnimais from "../FiltrosAnimais/FiltrosAnimais";
import { filtrosVazios, listarAnimais } from "../../services/animais";

// Filtros + grade de cards
// fica na /animais e também aparece na Home do site
export default function VitrineAnimais() {
  const [filtros, setFiltros] = useState(filtrosVazios);
  const [animais, setAnimais] = useState([]);
  const [carregando, setCarregando] = useState(true);
  const [erro, setErro] = useState(false);

  // Busca a lista de novo toda vez que os filtros mudam
  useEffect(() => {
    let cancelado = false;

    listarAnimais(filtros)
      .then((lista) => {
        if (!cancelado) setAnimais(lista);
      })
      .catch(() => {
        if (!cancelado) setErro(true);
      })
      .finally(() => {
        if (!cancelado) setCarregando(false);
      });

    // Se o filtro mudar antes da resposta chegar, essa resposta velha é descartada
    return () => {
      cancelado = true;
    };
  }, [filtros]);

  function mudarFiltros(novos) {
    setCarregando(true);
    setErro(false);
    setFiltros(novos);
  }

  const temFiltro = Object.values(filtros).some(Boolean);

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
          <p className="text-texto-principal">
            {/* Quando o login entrar, o usuario sem filtro vê "Nenhum animal disponível no seu estado no momento." (UC06 FA01) */}
            {temFiltro
              ? "Nenhum resultado encontrado com essas informações."
              : "Nenhum animal disponível no momento."}
          </p>
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
      {/* Por enquanto todo mundo é visitante. Quando o AuthContext existir, o Usuario logado vê o estado dele aqui */}
      <p className="text-legenda text-texto-terciario">
        Exibindo animais de todos os estados brasileiros,{" "}
        <Link to="/login" className="text-marca-roxo underline">
          entre para filtrar pelo seu
        </Link>
        .
      </p>

      <FiltrosAnimais filtros={filtros} aoMudar={mudarFiltros} />

      {mostrarResultado()}
    </section>
  );
}
