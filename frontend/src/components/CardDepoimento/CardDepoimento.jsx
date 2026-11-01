import { formatarData } from "../../utils/rotulos";

// Uma história no mural (RF11): a foto (a do depoimento ou, sem ela, a do animal),
// o nome do animal, o que a pessoa contou e quem contou. Do adotante, só o primeiro nome e o estado
// nivelDoTitulo: h2 na página de histórias, h3 na Home (embaixo do h2 da seção)
export default function CardDepoimento({ depoimento, nivelDoTitulo = 2 }) {
  const { texto, fotoUrl, dataHora, autor, estado, animal, protetor } =
    depoimento;
  const Titulo = `h${nivelDoTitulo}`;
  const foto = fotoUrl || animal.fotoCapa;

  return (
    <article
      tabIndex={-1}
      className="flex flex-col overflow-hidden rounded-[16px] border border-borda-sutil bg-fundo-superficie focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-marca-roxo"
    >
      {foto ? (
        <img
          src={foto}
          alt={`Foto de ${animal.nome}`}
          className="aspect-[4/3] w-full object-cover"
        />
      ) : (
        <div className="flex aspect-[4/3] w-full items-center justify-center bg-marca-roxo-suave text-legenda text-texto-secundario">
          Sem foto
        </div>
      )}
      <figure className="flex flex-1 flex-col gap-3 p-5">
        <Titulo className="font-titulo text-card font-semibold text-texto-principal">
          {animal.nome}
        </Titulo>
        <blockquote className="whitespace-pre-line text-compacto text-texto-secundario">
          {texto}
        </blockquote>
        <figcaption className="mt-auto border-t border-borda-sutil pt-3 text-legenda text-texto-secundario">
          <span className="font-semibold text-texto-principal">
            {autor}, de {estado}
          </span>
          . Adotou com {protetor}.{" "}
          <time dateTime={dataHora}>
            Contou em {formatarData(dataHora.slice(0, 10))}
          </time>
          .
        </figcaption>
      </figure>
    </article>
  );
}
