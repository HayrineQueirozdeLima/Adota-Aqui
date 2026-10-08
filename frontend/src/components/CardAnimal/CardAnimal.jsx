import Botao from "../Botao/Botao";
import Tag from "../Tag/Tag";
import {
  sexos,
  convivencias,
  resumoDoAnimal,
  rotuloCastrado,
  rotuloEnergia,
  iniciais,
  corDaConvivencia,
} from "../../utils/rotulos";

// card da listagem de animais (Home e /animais)
// recebe um animal no formato do GET /api/animais (docs/api.md)
export default function CardAnimal({ animal }) {
  const {
    id,
    nome,
    sexo,
    castrado,
    energia,
    convivencia,
    fotoCapa,
    protetor,
  } = animal;

  // "Cão, sem raça definida, porte médio, 14 kg"
  const descricao = resumoDoAnimal(animal);

  // Características: sempre cinzas
  const caracteristicas = [
    sexos[sexo],
    castrado && rotuloCastrado(sexo),
  ].filter(Boolean);

  // Convivência: cada uma com a cor do seu estado
  const convivenciasDoAnimal = [
    { quem: "Criança", valor: convivencia.crianca },
    { quem: "Cão", valor: convivencia.cao },
    { quem: "Gato", valor: convivencia.gato },
  ];

  return (
    <article className="flex flex-col overflow-hidden rounded-[16px] border border-borda-sutil bg-fundo-superficie">
      {/* Foto. Enquanto não tiver foto, fica o fundo roxo-suave com o aviso "Sem foto" */}
      <div className="flex h-[210px] items-center justify-center bg-marca-roxo-suave">
        {fotoCapa ? (
          <img
            src={fotoCapa}
            alt={`Foto de ${nome}`}
            className="h-full w-full object-cover"
          />
        ) : (
          <span className="text-legenda text-texto-terciario">
            Sem foto
          </span>
        )}
      </div>

      <div className="flex flex-1 flex-col justify-between px-[18px] pb-[18px] pt-4">
        <div className="flex flex-col gap-[11px]">
          <div className="flex items-center justify-between">
            <h3 className="font-titulo font-semibold text-card text-texto-principal">
              {nome}
            </h3>
            <Tag variante="disponivel">Disponível</Tag>
          </div>

          <p className="text-legenda text-texto-terciario">{descricao}</p>

          <div className="flex flex-wrap gap-1.5">
            {caracteristicas.map((texto) => (
              <Tag key={texto}>{texto}</Tag>
            ))}
            {convivenciasDoAnimal.map(({ quem, valor }) => (
              <Tag key={quem} variante={corDaConvivencia[valor]}>
                {quem}: {convivencias[valor]}
              </Tag>
            ))}
            <Tag variante="atencao">{rotuloEnergia(energia, sexo)}</Tag>
          </div>

          <hr className="border-borda-sutil" />

          <div className="flex items-center gap-2.5">
            <span className="flex size-8 items-center justify-center rounded-full bg-marca-roxo-suave font-titulo font-semibold text-campo text-marca-roxo">
              {iniciais(protetor.nome)}
            </span>
            <div>
              <p className="font-titulo font-semibold text-campo text-texto-principal">
                {protetor.nome}
              </p>
              <p className="text-legenda text-texto-terciario">
                {protetor.cidade}/{protetor.estado}
              </p>
            </div>
          </div>
        </div>

        <div className="flex justify-end pt-3.5">
          <Botao para={`/animais/${id}`}>Quero conhecer {nome}</Botao>
        </div>
      </div>
    </article>
  );
}
