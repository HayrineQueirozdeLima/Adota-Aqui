import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import CardFeira from "../CardFeira/CardFeira";
import { listarFeiras } from "../../services/feiras";

// As 2 próximas feiras de adoção do Brasil, na Home, com o link pra página de feiras.
// Sem nenhuma feira marcada, ou se a API falhar, a seção nem aparece: ela é um extra da página
export default function ProximasFeiras() {
  const [feiras, setFeiras] = useState([]);

  useEffect(() => {
    let cancelado = false;
    listarFeiras({}, 0, 2)
      .then((resultado) => {
        if (!cancelado) setFeiras(resultado.itens);
      })
      .catch(() => {});
    return () => {
      cancelado = true;
    };
  }, []);

  if (feiras.length === 0) return null;

  return (
    <section
      aria-labelledby="feiras-titulo"
      className="mx-auto w-full max-w-[1440px] px-5 pb-12 md:px-14"
    >
      <div className="flex flex-wrap items-end justify-between gap-3">
        <h2
          id="feiras-titulo"
          className="font-titulo text-secao font-semibold text-texto-principal md:text-[28px]"
        >
          Próximas feiras de adoção
        </h2>
        <Link
          to="/feiras"
          className="rounded-sm py-1 font-titulo text-botao font-semibold text-marca-roxo underline underline-offset-2 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-marca-roxo"
        >
          Ver todas as feiras
        </Link>
      </div>
      <div className="mt-5 grid gap-[22px] lg:grid-cols-2 lg:items-start">
        {feiras.map((feira) => (
          <CardFeira key={feira.id} feira={feira} nivelDoTitulo={3} />
        ))}
      </div>
    </section>
  );
}
