import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import CardDepoimento from "../CardDepoimento/CardDepoimento";
import Revelar from "../Revelar/Revelar";
import { listarDepoimentos } from "../../services/depoimentos";

// As 3 histórias de adoção mais novas, na Home, com o link pro mural.
// Sem nenhuma história, ou se a API falhar, a seção nem aparece: ela é um extra da página
export default function HistoriasRecentes() {
  const [historias, setHistorias] = useState([]);

  useEffect(() => {
    let cancelado = false;
    listarDepoimentos(0, 3)
      .then((resultado) => {
        if (!cancelado) setHistorias(resultado.itens);
      })
      .catch(() => {});
    return () => {
      cancelado = true;
    };
  }, []);

  if (historias.length === 0) return null;

  return (
    <section
      aria-labelledby="historias-titulo"
      className="mx-auto w-full max-w-[1440px] px-5 pb-12 md:px-14"
    >
      <div className="flex flex-wrap items-end justify-between gap-3">
        <h2
          id="historias-titulo"
          className="font-titulo text-secao font-semibold text-texto-principal md:text-[28px]"
        >
          Histórias de quem adotou
        </h2>
        <Link
          to="/historias"
          className="rounded-sm py-1 font-titulo text-botao font-semibold text-marca-roxo underline underline-offset-2 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-marca-roxo"
        >
          Ver todas as histórias
        </Link>
      </div>
      <div className="mt-5 grid gap-[22px] md:grid-cols-2 lg:grid-cols-3">
        {historias.map((historia, posicao) => (
          <Revelar key={historia.id} ordem={posicao % 3}>
            <CardDepoimento depoimento={historia} nivelDoTitulo={3} />
          </Revelar>
        ))}
      </div>
    </section>
  );
}
