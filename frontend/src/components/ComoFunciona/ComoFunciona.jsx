import Tag from "../Tag/Tag";

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

// O id deixa o rodapé levar direto pra cá ("Como adotar")
export default function ComoFunciona() {
  return (
    <section id="como-funciona" aria-labelledby="como-funciona-titulo" className="scroll-mt-4 bg-fundo-marca">
      <div className="mx-auto max-w-[1440px] px-5 py-12 md:px-14 md:py-16">
        <h2 id="como-funciona-titulo" className="font-titulo text-secao font-semibold text-texto-sobre-marca md:text-[28px]">
          Como funciona a adoção
        </h2>
        <ol className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {passos.map((passo, posicao) => (
            <li key={passo.titulo} className="rounded-[16px] bg-fundo-superficie p-5">
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
