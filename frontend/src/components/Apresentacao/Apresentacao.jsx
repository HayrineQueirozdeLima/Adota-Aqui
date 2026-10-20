import Botao from "../Botao/Botao";
import fotoCelular from "../../assets/fotos/apresentacao-celular-750.webp";
import fotoLarga960 from "../../assets/fotos/apresentacao-larga-960.webp";
import fotoLarga1600 from "../../assets/fotos/apresentacao-larga-1600.webp";

// Topo da Home (Figma: Home, Desktop, Tablet e Celular) com a faixa da guarda responsável logo abaixo.
// As cores que mudam com o tamanho da tela e com o tema estão no index.css (.apresentacao)
export default function Apresentacao() {
  return (
    <>
      <section
        aria-labelledby="apresentacao-titulo"
        className="apresentacao relative isolate overflow-hidden bg-[var(--apresentacao-fundo)]"
      >
        {/* No celular vai a foto em pé, com os animais embaixo; do tablet pra cima, a foto deitada */}
        <picture>
          <source
            media="(min-width: 768px)"
            srcSet={`${fotoLarga960} 960w, ${fotoLarga1600} 1600w`}
            sizes="100vw"
          />
          <img
            src={fotoCelular}
            alt=""
            className="absolute inset-0 -z-20 size-full object-cover object-bottom md:object-left"
          />
        </picture>
        <div aria-hidden="true" className="absolute inset-0 -z-10 bg-[var(--apresentacao-veu)]" />

        <div className="mx-auto flex min-h-[560px] max-w-[1440px] flex-col items-center px-5 pb-12 pt-10 text-center md:min-h-[460px] md:items-end md:justify-center md:px-14 md:py-16 md:text-right lg:min-h-[520px]">
          <div className="max-w-[560px]">
            <h1
              id="apresentacao-titulo"
              className="font-titulo text-[34px] font-semibold leading-[1.1] tracking-[-0.02em] text-[var(--apresentacao-titulo)] md:text-[46px] lg:text-[54px]"
            >
              Todo animal <span className="text-[var(--apresentacao-destaque)]">merece</span> um lar de verdade.
            </h1>
            <p className="mt-4 text-corpo text-[var(--apresentacao-texto)] md:text-[17px]">
              Resgatou um animal, possui um abrigo, ou quer somar alegria em casa adotando um pet? Nós te ajudamos!
            </p>
            {/* O contorno do segundo botão é branco em cima da foto escura e roxo em cima da foto clara */}
            <div className="mt-7 flex flex-col gap-3 [--texto-sobre-marca:var(--apresentacao-contorno)] md:flex-row md:justify-end">
              <Botao para="/animais">Ver animais disponíveis</Botao>
              <Botao variante="contorno" para="/meus-animais/novo">
                Resgatei um animal
              </Botao>
            </div>
          </div>
        </div>
      </section>

      <p className="bg-acao-terracota px-5 py-4 text-center text-compacto text-acao-terracota-texto md:px-14">
        <strong className="font-semibold">Guarda responsável é obrigatória.</strong> Maus-tratos e abandono são
        crimes no Brasil (Leis nº 9.605/1998 e nº 14.064/2020), com pena agravada para cães e gatos. Todo candidato
        a tutor lê e aceita isso antes de registrar interesse.
      </p>
    </>
  );
}
