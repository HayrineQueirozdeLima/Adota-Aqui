import Botao from "../Botao/Botao";

// Chamada pra página Quem somos, no fim da Home
export default function ConhecaOProjeto() {
  return (
    <section
      aria-labelledby="conheca-titulo"
      className="mx-auto w-full max-w-[1440px] px-5 py-12 md:px-14 md:py-16"
    >
      <div className="revelar-ao-rolar flex flex-col gap-6 rounded-[20px] border border-borda-sutil bg-fundo-superficie p-6 md:flex-row md:items-center md:justify-between md:p-10">
        <div className="max-w-[640px]">
          <p className="font-titulo text-overline font-semibold uppercase text-texto-terciario">
            Quem somos
          </p>
          <h2
            id="conheca-titulo"
            className="mt-2 font-titulo text-secao font-semibold text-texto-principal md:text-[28px]"
          >
            Conheça o Adota Aqui
          </h2>
          <p className="mt-3 text-corpo text-texto-secundario">
            Um projeto feito pra aproximar quem cuida de animais de quem quer
            adotar. Saiba como ele surgiu, o que motiva a gente e o que a
            plataforma se propõe a fazer.
          </p>
        </div>
        <Botao variante="secundario" para="/quem-somos" className="md:shrink-0">
          Conhecer o projeto
        </Botao>
      </div>
    </section>
  );
}
