import Botao from "../../components/Botao/Botao";
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

// A que o Adota Aqui se propõe, na prática
const proposta = [
  "Reunir num lugar só os animais de abrigos, ONGs e protetores independentes de todo o Brasil, com fotos, vacinas, porte, energia e como cada um convive com crianças, cães e gatos.",
  "Mostrar pra cada pessoa os animais do estado dela, pra que o encontro aconteça de verdade.",
  "Fazer uma triagem rápida, pra que o protetor conheça a rotina de quem quer adotar.",
  "Liberar o contato dos dois lados assim que alguém demonstra interesse, pra que qualquer um possa puxar a conversa.",
  "Abrir espaço pra comunidade: as histórias de quem adotou e o blog com o que os protetores aprenderam na prática.",
];

const tituloDeSecao =
  "font-titulo text-item font-semibold text-texto-principal md:text-secao";

export default function QuemSomos() {
  useTituloDaPagina("Quem somos");

  return (
    <main className="mx-auto w-full max-w-[1440px] px-5 pb-12 pt-6 md:px-14 md:pt-8">
      <div className="max-w-[760px]">
        <h1 className="font-titulo text-secao font-semibold text-texto-principal md:text-display">
          Quem somos
        </h1>
        <p className="mt-3 text-corpo text-texto-secundario md:text-[17px]">
          O Adota Aqui é uma plataforma de adoção de cães e gatos, aberta a todo
          o Brasil, que aproxima quem cuida de animais à espera de um lar de
          quem quer adotar.
        </p>

        {historia.map((secao) => (
          <section key={secao.id} aria-labelledby={secao.id} className="mt-10">
            <h2 id={secao.id} className={tituloDeSecao}>
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

        <section
          aria-labelledby="proposta"
          className="mt-10 rounded-[16px] border border-borda-sutil bg-fundo-superficie p-5 md:p-7"
        >
          <h2 id="proposta" className={tituloDeSecao}>
            O que o Adota Aqui se propõe a fazer
          </h2>
          <p className="mt-3 text-corpo text-texto-secundario">
            O Adota Aqui é uma ponte entre quem protege e quem quer adotar. Na
            prática, ele existe pra:
          </p>
          <ul className="mt-4 flex flex-col gap-3">
            {proposta.map((item) => (
              <li
                key={item}
                className="flex gap-3 text-corpo text-texto-secundario"
              >
                <span
                  aria-hidden="true"
                  className="mt-[9px] size-2 shrink-0 rounded-full bg-acao-terracota"
                />
                <span>{item}</span>
              </li>
            ))}
          </ul>
          <p className="mt-5 rounded-[12px] bg-marca-roxo-suave px-4 py-3 text-compacto text-texto-secundario">
            <strong className="font-semibold text-texto-principal">
              A decisão é sempre de quem cuida do animal.
            </strong>{" "}
            A conversa, a visita e o sim final acontecem fora do site, entre o
            protetor e quem quer adotar. O Adota Aqui não vende animais e não
            cobra nada de ninguém.
          </p>
        </section>

        <section aria-labelledby="participe" className="mt-10">
          <h2 id="participe" className={tituloDeSecao}>
            Quer fazer parte?
          </h2>
          <p className="mt-3 text-corpo text-texto-secundario">
            Conheça os animais que esperam um lar, os abrigos e protetores que
            cuidam deles, ou cadastre um animal que você resgatou.
          </p>
          <div className="mt-5 flex flex-col gap-3 sm:flex-row sm:flex-wrap">
            <Botao para="/animais">Ver animais disponíveis</Botao>
            <Botao variante="secundario" para="/protetores">
              Conhecer abrigos e protetores
            </Botao>
            <Botao variante="secundario" para="/meus-animais/novo">
              Resgatei um animal
            </Botao>
          </div>
        </section>
      </div>
    </main>
  );
}
