import { Link } from "react-router-dom";
import Tag from "../Tag/Tag";
import { formatarData } from "../../utils/rotulos";

// Uma cor por assunto, com as variantes da Tag
export const corDaCategoria = {
  ADOCAO_RESPONSAVEL: "destaqueRoxo",
  PRIMEIROS_DIAS: "atencao",
  SAUDE: "disponivel",
  COMPORTAMENTO: "neutro",
  ALIMENTACAO: "atencao",
};

// Um artigo na lista: capa, assunto, título (o link pro artigo inteiro), o começo do texto e quem escreveu
export default function CardArtigo({ artigo }) {
  const { id, titulo, categoria, categoriaNome, resumo, fotoCapa, autor, publicadoEm } = artigo;

  return (
    <article className="flex flex-col overflow-hidden rounded-[16px] border border-borda-sutil bg-fundo-superficie">
      {/* A capa é opcional: sem ela, o card começa direto no assunto */}
      {fotoCapa && <img src={fotoCapa} alt="" className="aspect-[16/9] w-full object-cover" />}
      <div className="flex flex-1 flex-col gap-3 p-5">
        <div>
          <Tag variante={corDaCategoria[categoria]}>{categoriaNome}</Tag>
        </div>
        <h2 className="font-titulo text-card font-semibold text-texto-principal">
          <Link
            to={`/blog/${id}`}
            className="rounded-sm hover:text-marca-roxo hover:underline focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-marca-roxo"
          >
            {titulo}
          </Link>
        </h2>
        <p className="text-compacto text-texto-secundario">{resumo}</p>
        <p className="mt-auto border-t border-borda-sutil pt-3 text-legenda text-texto-secundario">
          Por <span className="font-semibold text-texto-principal">{autor.nome}</span>, de {autor.cidade}/
          {autor.estado}.{" "}
          <time dateTime={publicadoEm}>{formatarData(publicadoEm.slice(0, 10))}</time>
        </p>
      </div>
    </article>
  );
}
