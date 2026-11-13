import Avatar from "../Avatar/Avatar";
import Botao from "../Botao/Botao";
import Tag from "../Tag/Tag";
import {
  sexos,
  convivencias,
  resumoDoAnimal,
  rotuloCastrado,
  rotuloEnergia,
  corDaConvivencia,
  localDoAnimal,
  tempoEsperando,
} from "../../utils/rotulos";

// card da listagem de animais (Home e /animais)
// recebe um animal no formato do GET /api/animais (docs/api.md)
// nivelDoTitulo: o nome do animal é h3 na Home (embaixo do h2 da vitrine) e h2 na /animais (embaixo do h1)
export default function CardAnimal({ animal, nivelDoTitulo = 3 }) {
  const Titulo = `h${nivelDoTitulo}`;
  const { id, nome, sexo, castrado, energia, convivencia, fotoCapa, protetor } =
    animal;
  // "Esperando há 3 meses", pra quem está no site há pelo menos 1 mês
  const esperando = tempoEsperando(animal.cadastradoEm);

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
      {/* Foto quadrada, pra não cortar o animal quando o card fica largo.
          Enquanto não tiver foto, fica o fundo roxo-suave com o aviso "Sem foto" */}
      <div className="relative flex aspect-square items-center justify-center bg-marca-roxo-suave">
        {esperando && (
          <span className="absolute left-3 top-3 rounded-full bg-fundo-superficie px-3 py-1.5 font-titulo text-legenda font-semibold text-marca-roxo shadow-sm">
            {esperando}
          </span>
        )}
        {fotoCapa ? (
          <img
            src={fotoCapa}
            alt={`Foto de ${nome}`}
            className="h-full w-full object-cover"
          />
        ) : (
          <span className="text-legenda text-texto-secundario">Sem foto</span>
        )}
      </div>

      <div className="flex flex-1 flex-col justify-between px-[18px] pb-[18px] pt-4">
        <div className="flex flex-col gap-[11px]">
          <div className="flex items-center justify-between">
            <Titulo className="font-titulo font-semibold text-card text-texto-principal">
              {nome}
            </Titulo>
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
            <Avatar
              nome={protetor.nome}
              fotoUrl={protetor.fotoUrl}
              className="size-8 bg-marca-roxo-suave text-campo text-marca-roxo"
            />
            <div>
              <p className="font-titulo font-semibold text-campo text-texto-principal">
                {protetor.nome}
              </p>
              {/* Onde o animal está, que nem sempre é o endereço do protetor */}
              <p className="text-legenda text-texto-terciario">
                {localDoAnimal(animal)}
              </p>
            </div>
          </div>
        </div>

        <div className="flex justify-end pt-3.5">
          {/* Nome comprido não estoura o card: o texto corta com reticências (o nome inteiro está no título) */}
          <Botao para={`/animais/${id}`} className="max-w-full">
            <span className="min-w-0 truncate">Quero conhecer {nome}</span>
          </Botao>
        </div>
      </div>
    </article>
  );
}
