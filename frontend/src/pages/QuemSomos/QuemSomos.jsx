// Fotos de banco de imagens gratuito, escolhidas pela equipe só pra esta página
import fotoCarinho from "../../assets/fotos/quem-somos-carinho.webp";
import fotoGatoEmCasa from "../../assets/fotos/quem-somos-gato-em-casa.webp";
import fotoGatinhoNoColo from "../../assets/fotos/quem-somos-gatinho-no-colo.webp";
import Botao from "../../components/Botao/Botao";
import Pata from "../../components/Pata/Pata";
import PonteDaAdocao from "../../components/PonteDaAdocao/PonteDaAdocao";
import { useTituloDaPagina } from "../../hooks/useTituloDaPagina";

// Quem somos (/quem-somos): como o projeto surgiu, de onde veio a ideia, a motivação e o que ele se propõe a fazer.
// Por enquanto sem o nome de quem desenvolveu. Os textos ficam todos aqui em cima, pra ficar fácil de mudar
const historia = [
  {
    id: "como-surgiu",
    titulo: "Como surgiu o projeto",
    paragrafos: [
      "O Adota Aqui nasceu em 2026, como projeto final da Trilha Full Stack da +praTi e Codifica, uma formação em desenvolvimento de software.",
      "A proposta do curso era criar em equipe, em cerca de dois meses, um sistema completo: do planejamento ao site no ar. A equipe decidiu usar esse desafio pra resolver um problema real, que muita gente conhece de perto: encontrar um lar pros animais que precisam de um.",
    ],
  },
  {
    id: "a-ideia",
    titulo: "De onde veio a ideia",
    paragrafos: [
      "A ideia veio de uma observação simples. Quem quer adotar encontra os animais espalhados em posts, grupos de mensagens e cartazes, e nem sempre sabe por onde começar. E quem resgata um animal da rua por conta própria muitas vezes não tem onde mostrar ele pra quem procura um companheiro.",
      "Olhando as plataformas de adoção que já existem, a equipe quis criar uma em que abrigos, ONGs e pessoas que resgataram um animal sozinhas tivessem o mesmo espaço, e em que quem quer adotar encontrasse os animais do próprio estado.",
    ],
  },
  {
    id: "motivacao",
    titulo: "O que motiva a gente",
    paragrafos: [
      "Todo animal merece um lar de verdade. Cada adoção muda a vida de um animal e ainda libera espaço e cuidado pra outro que continua esperando.",
      "E adoção boa é adoção responsável. Maus-tratos e abandono são crimes no Brasil (Leis nº 9.605/1998 e nº 14.064/2020), por isso todo candidato a tutor lê e aceita o termo de guarda responsável antes de demonstrar interesse.",
    ],
  },
];

// A que o Adota Aqui se propõe, na prática. Cada item tem um título curto pra dar pra ler de passagem
const proposta = [
  {
    titulo: "Todos num lugar só",
    texto:
      "Reunir num lugar só os animais de abrigos, ONGs e protetores independentes de todo o Brasil, com fotos, vacinas, porte, energia e como cada um convive com crianças, cães e gatos.",
    icone: "pata",
  },
  {
    titulo: "Perto de você",
    texto:
      "Mostrar pra cada pessoa os animais do estado dela, pra que o encontro aconteça de verdade.",
    icone: "local",
  },
  {
    titulo: "Triagem rápida",
    texto:
      "Fazer uma triagem rápida, pra que o protetor conheça a rotina de quem quer adotar.",
    icone: "prancheta",
  },
  {
    titulo: "Contato dos dois lados",
    texto:
      "Liberar o contato dos dois lados assim que alguém demonstra interesse, pra que qualquer um possa puxar a conversa.",
    icone: "conversa",
  },
  {
    titulo: "Espaço pra comunidade",
    texto:
      "Abrir espaço pra comunidade: as histórias de quem adotou e o blog com o que os protetores aprenderam na prática.",
    icone: "coracao",
  },
];

// Ícones da proposta, no mesmo traço da seta das listas (stroke da cor do texto)
const desenhos = {
  local: (
    <>
      <path d="M12 21s-7-6.2-7-11.5a7 7 0 0 1 14 0C19 14.8 12 21 12 21Z" />
      <circle cx="12" cy="9.5" r="2.5" />
    </>
  ),
  prancheta: (
    <>
      <rect x="5" y="4.5" width="14" height="16.5" rx="2" />
      <path d="M9 4.5V3h6v1.5M8.5 12.5l2.3 2.3 4.7-4.8" />
    </>
  ),
  conversa: (
    <>
      <path d="M4 5h10a2 2 0 0 1 2 2v5a2 2 0 0 1-2 2H9l-3.5 3v-3H4a2 2 0 0 1-2-2V7a2 2 0 0 1 2-2Z" />
      <path d="M16 9h4a2 2 0 0 1 2 2v5a2 2 0 0 1-2 2h-1.5v3L15 18h-3a2 2 0 0 1-1.8-1.2" />
    </>
  ),
  coracao: (
    <path d="M12 20s-8-4.8-8-10.2C4 7 6 5 8.5 5c1.5 0 2.7.7 3.5 1.9C12.8 5.7 14 5 15.5 5 18 5 20 7 20 9.8 20 15.2 12 20 12 20Z" />
  ),
};

function IconeDaProposta({ nome }) {
  if (nome === "pata") return <Pata className="size-6" />;
  return (
    <svg
      aria-hidden="true"
      viewBox="0 0 24 24"
      className="size-6"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      {desenhos[nome]}
    </svg>
  );
}

const tituloDeSecao =
  "font-titulo text-item font-semibold text-texto-principal md:text-secao";

// "revelar" faz a seção subir de leve quando entra na tela (index.css).
// Só em navegador que sabe fazer isso e pra quem não pediu menos movimento; nos outros a seção já aparece pronta
export default function QuemSomos() {
  useTituloDaPagina("Quem somos");

  return (
    <main className="pb-4">
      {/* Faixa lilás logo abaixo do topo roxo: o roxo da marca vai clareando até o fundo da página */}
      <div className="bg-marca-roxo-suave">
        <div className="mx-auto grid w-full max-w-[1440px] items-center gap-4 px-5 py-10 md:gap-8 md:px-14 md:py-14 lg:grid-cols-[minmax(0,1fr)_minmax(0,560px)] lg:gap-14">
          <div className="max-w-[640px]">
            <h1 className="font-titulo text-[40px] font-semibold leading-[1.05] tracking-[-0.03em] text-texto-principal md:text-[56px]">
              Quem somos
            </h1>
            <p className="mt-4 text-[17px] leading-[1.6] text-texto-secundario md:text-[19px]">
              O Adota Aqui é uma plataforma de adoção de cães e gatos, aberta a
              todo o Brasil, que aproxima quem cuida de animais à espera de um lar
              de quem quer adotar.
            </p>
          </div>
          <div className="mx-auto w-full max-w-[560px]">
            <PonteDaAdocao />
          </div>
        </div>
      </div>

      <div className="mx-auto mt-14 grid w-full max-w-[1440px] gap-10 px-5 md:mt-20 md:px-14 lg:grid-cols-[minmax(0,400px)_minmax(0,1fr)] lg:gap-16">
        {/* No celular e no tablet as duas fotos ficam lado a lado.
            No computador ficam uma em cima da outra, com o gato encaixado no canto da primeira */}
        <figure className="grid grid-cols-2 gap-3 lg:sticky lg:top-28 lg:block lg:self-start">
          <img
            src={fotoCarinho}
            alt=""
            className="aspect-[4/5] w-full rounded-[24px] object-cover object-[40%_center] md:aspect-[4/3] lg:aspect-[4/5]"
          />
          <img
            src={fotoGatoEmCasa}
            alt=""
            className="aspect-[4/5] w-full rounded-[24px] object-cover object-[45%_center] md:aspect-[4/3] lg:relative lg:-mt-28 lg:ml-auto lg:w-[62%] lg:ring-8 lg:ring-fundo-pagina"
          />
        </figure>

        {/* A trilha pontilhada liga as três partes da história */}
        <div className="relative max-w-[680px]">
          <span
            aria-hidden="true"
            className="absolute bottom-6 left-[17px] top-6 border-l-2 border-dashed border-borda-forte"
          />
          {historia.map((secao, posicao) => (
            <section
              key={secao.id}
              aria-labelledby={secao.id}
              className={`revelar relative pl-14 ${posicao > 0 ? "mt-10" : ""}`}
            >
              <span
                aria-hidden="true"
                className="absolute left-0 top-0 grid size-9 place-items-center rounded-full bg-fundo-pagina text-acao-terracota ring-2 ring-acao-terracota"
              >
                <Pata className="size-[18px]" />
              </span>
              <h2 id={secao.id} className={`${tituloDeSecao} pt-1`}>
                {secao.titulo}
              </h2>
              {secao.paragrafos.map((paragrafo) => (
                <p
                  key={paragrafo}
                  className="mt-3 text-corpo text-texto-secundario"
                >
                  {paragrafo}
                </p>
              ))}
            </section>
          ))}
        </div>
      </div>

      <section aria-labelledby="proposta" className="mt-16 bg-fundo-marca md:mt-24">
        <div className="mx-auto max-w-[1440px] px-5 py-12 md:px-14 md:py-16">
          <div className="max-w-[720px]">
            <h2
              id="proposta"
              className="font-titulo text-secao font-semibold text-texto-sobre-marca md:text-[28px]"
            >
              O que o Adota Aqui se propõe a fazer
            </h2>
            <p className="mt-3 text-corpo text-texto-sobre-marca opacity-90">
              O Adota Aqui é uma ponte entre quem protege e quem quer adotar. Na
              prática, ele existe pra:
            </p>
          </div>

          {/* São 5 cartões. No computador a grade tem 6 colunas e cada cartão ocupa 2:
              3 em cima e 2 embaixo, centralizados. No tablet, o último ocupa a linha toda */}
          <ul className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-6">
            {proposta.map((item, posicao) => (
              <li
                key={item.titulo}
                className={`revelar rounded-[16px] bg-fundo-superficie p-5 lg:col-span-2 ${posicao === 3 ? "lg:col-start-2" : ""} ${posicao === 4 ? "sm:col-span-2" : ""}`}
              >
                <span className="grid size-11 place-items-center rounded-full bg-marca-roxo-suave text-marca-roxo">
                  <IconeDaProposta nome={item.icone} />
                </span>
                <h3 className="mt-4 font-titulo text-item font-semibold text-texto-principal">
                  {item.titulo}
                </h3>
                <p className="mt-2 text-compacto text-texto-secundario">
                  {item.texto}
                </p>
              </li>
            ))}
          </ul>

          <p className="mt-8 max-w-[860px] rounded-[16px] border border-[rgb(255_255_255/0.25)] bg-[rgb(255_255_255/0.08)] px-5 py-4 text-compacto text-texto-sobre-marca">
            <strong className="font-semibold">
              A decisão é sempre de quem cuida do animal.
            </strong>{" "}
            A conversa, a visita e o sim final acontecem fora do site, entre o
            protetor e quem quer adotar. O Adota Aqui não vende animais e não
            cobra nada de ninguém.
          </p>
        </div>
      </section>

      <section
        aria-labelledby="participe"
        className="mx-auto max-w-[1440px] px-5 py-12 md:px-14 md:py-16"
      >
        <div className="revelar grid overflow-hidden rounded-[24px] border border-borda-sutil bg-fundo-superficie md:grid-cols-[minmax(0,1fr)_minmax(0,280px)] lg:grid-cols-[minmax(0,1fr)_minmax(0,400px)]">
          <div className="p-6 md:p-10">
            <h2 id="participe" className={tituloDeSecao}>
              Quer fazer parte?
            </h2>
            <p className="mt-3 max-w-[560px] text-corpo text-texto-secundario">
              Conheça os animais que esperam um lar, os abrigos e protetores que
              cuidam deles, ou cadastre um animal que você resgatou.
            </p>
            <div className="mt-6 flex flex-col gap-3 sm:flex-row sm:flex-wrap">
              <Botao para="/animais">Ver animais disponíveis</Botao>
              <Botao variante="secundario" para="/protetores">
                Conhecer abrigos e protetores
              </Botao>
              <Botao variante="secundario" para="/meus-animais/novo">
                Resgatei um animal
              </Botao>
            </div>
          </div>
          {/* O gatinho no colo, olhando pra quem chega.
              A foto preenche a coluna sem mandar na altura: quem manda é o texto do lado */}
          <div className="relative order-first h-[200px] md:order-none md:h-auto md:min-h-[260px]">
            <img
              src={fotoGatinhoNoColo}
              alt=""
              className="absolute inset-0 size-full object-cover object-[50%_15%]"
            />
          </div>
        </div>
      </section>
    </main>
  );
}
