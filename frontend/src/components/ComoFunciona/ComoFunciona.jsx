import Tag from "../Tag/Tag";
import TrilhaDePatas from "../TrilhaDePatas/TrilhaDePatas";

// Os quatro passos da adoção, com os textos do Figma (Home, "Como funciona a adoção")
const passos = [
  {
    titulo: "Encontre o animal",
    texto:
      "Confira os animais disponíveis para adoção cadastrados no sistema. Veja espécie, raça, porte, nível de energia, convivência e histórico de vacinas.",
    cor: "destaqueRoxo",
  },
  {
    titulo: "Demonstre interesse",
    texto:
      "Aceite o termo de guarda responsável, responda uma triagem rápida para que o protetor entenda sua rotina e confirme o interesse.",
    cor: "erro",
  },
  {
    titulo: "Contato liberado",
    texto:
      "Ao confirmar, seus dados e os do protetor ficam visíveis para os dois lados. O protetor avalia o interesse, mas não é preciso esperá-lo para entrar em contato.",
    cor: "atencao",
  },
  {
    titulo: "Adoção realizada",
    texto:
      "Todo o restante do processo (conversa, visita etc.) acontece fora do sistema. Quando o protetor confirmar, você já poderá considerar o pet como seu novo amigo :)",
    cor: "disponivel",
  },
];

// A trilha anda no espaço que sobra em cima, do lado do título, subindo da esquerda pra direita.
// No celular os cartões ocupam a faixa toda, então a trilha só aparece do tablet pra cima
const caminhoDaTrilha = {
  largura: 1000,
  altura: 150,
  inicio: { x: -20, y: 100 },
  controle: { x: 520, y: 96 },
  fim: { x: 1030, y: 26 },
};

// O id deixa o rodapé levar direto pra cá ("Como adotar")
export default function ComoFunciona() {
  return (
    <section id="como-funciona" aria-labelledby="como-funciona-titulo" className="relative scroll-mt-4 overflow-hidden bg-fundo-marca">
      <TrilhaDePatas
        caminho={caminhoDaTrilha}
        passos={12}
        tamanho={1.3}
        className="right-0 top-0 hidden h-[150px] w-[68%] md:block"
      />
      <div className="relative mx-auto max-w-[1440px] px-5 py-12 md:px-14 md:py-16">
        <h2 id="como-funciona-titulo" className="font-titulo text-secao font-semibold text-texto-sobre-marca md:text-[28px]">
          Como funciona a adoção
        </h2>
        <ol className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {passos.map((passo, posicao) => (
            <li key={passo.titulo} className="revelar-ao-rolar rounded-[16px] bg-fundo-superficie p-5" style={{ "--ordem": posicao }}>
              <Tag variante={passo.cor}>Passo {String(posicao + 1).padStart(2, "0")}</Tag>
              <h3 className="mt-4 font-titulo text-item font-semibold text-texto-principal">{passo.titulo}</h3>
              <p className="mt-2 text-compacto text-texto-secundario">{passo.texto}</p>
            </li>
          ))}
        </ol>
      </div>
    </section>
  );
}
