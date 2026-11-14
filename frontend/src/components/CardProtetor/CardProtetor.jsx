import Avatar from "../Avatar/Avatar";
import Botao from "../Botao/Botao";
import Tag from "../Tag/Tag";
import { tiposDeProtetor } from "../../utils/rotulos";

// Card da página de abrigos e protetores (/protetores)
// recebe um item do GET /api/protetores (docs/api.md, seção 13)
// O tabIndex -1 deixa o "Ver mais" levar o foco pro primeiro card novo
export default function CardProtetor({ protetor }) {
  const { nome, tipo, cidade, estado, animaisDisponiveis, adocoes, fotoUrl } = protetor;

  return (
    <article
      tabIndex={-1}
      className="flex flex-col gap-4 rounded-[16px] border border-borda-sutil bg-fundo-superficie p-5 focus:outline-none focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-marca-roxo"
    >
      <div className="flex items-start gap-3">
        <Avatar nome={nome} fotoUrl={fotoUrl} className="size-11 bg-marca-roxo-suave text-campo text-marca-roxo" />
        <div className="min-w-0">
          <h2 className="break-words font-titulo text-item font-semibold text-texto-principal">
            {nome}
          </h2>
          <p className="text-legenda text-texto-terciario">
            {cidade}/{estado}
          </p>
        </div>
      </div>

      <div>
        <Tag variante={tipo === "ABRIGO" ? "destaqueRoxo" : "neutro"}>
          {tiposDeProtetor[tipo]}
        </Tag>
      </div>

      <ul className="flex flex-col gap-1 text-compacto text-texto-secundario">
        <li>
          {animaisDisponiveis === 0
            ? "Nenhum animal para adoção agora"
            : `${animaisDisponiveis} ${animaisDisponiveis === 1 ? "animal" : "animais"} para adoção`}
        </li>
        <li>
          {adocoes === 0
            ? "Nenhuma adoção pelo site ainda"
            : `${adocoes} ${adocoes === 1 ? "adoção" : "adoções"} pelo site`}
        </li>
      </ul>

      {/* A vitrine já procura pelo nome de quem cadastrou: o link abre ela com o nome preenchido.
          A busca da vitrine aceita até 80 letras, e um pedaço do nome já acha os animais */}
      {animaisDisponiveis > 0 && (
        <div className="mt-auto">
          <Botao
            variante="secundario"
            para={`/animais?busca=${encodeURIComponent(nome.slice(0, 80))}`}
          >
            Ver animais<span className="sr-only"> de {nome}</span>
          </Botao>
        </div>
      )}
    </article>
  );
}
