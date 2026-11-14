import { Link } from "react-router-dom";
import logo from "../../assets/logo-sobre-marca.svg";
import TrilhaDePatas from "../TrilhaDePatas/TrilhaDePatas";

// Moldura das telas de login e cadastro: painel roxo da marca + formulário (Figma).
// No computador o painel fica à esquerda e não rola junto com o formulário.
// No celular e no tablet ele vira uma faixa no topo, só com o logo e a frase.
// No fundo do painel, uma trilha de patas sobe de baixo, na esquerda, até em cima, na direita.
// Só no computador: no celular o painel vira uma faixa fina, e a trilha ficaria atrás da frase.

const caminhoDaTrilha = {
  largura: 560,
  altura: 900,
  inicio: { x: 40, y: 960 },
  controle: { x: 560, y: 560 },
  fim: { x: 420, y: -60 },
};

export default function LayoutAutenticacao({
  frase,
  itens = [],
  rodape,
  children,
}) {
  return (
    <div className="flex min-h-screen flex-col lg:flex-row">
      <aside className="relative flex flex-col gap-5 overflow-hidden bg-fundo-marca px-5 py-6 text-texto-sobre-marca md:px-10 md:py-8 lg:sticky lg:top-0 lg:h-screen lg:w-[38%] lg:max-w-[560px] lg:shrink-0 lg:p-14">
        <TrilhaDePatas
          caminho={caminhoDaTrilha}
          passos={11}
          tamanho={1.8}
          className="inset-0 hidden lg:block"
        />
        <Link
          to="/"
          aria-label="Adota Aqui, página inicial"
          className="relative w-fit rounded-sm focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-texto-sobre-marca"
        >
          <img src={logo} alt="" className="h-[34px] w-auto lg:h-[76px]" />
        </Link>

        <div className="relative lg:my-auto">
          <p className="font-titulo text-subtitulo font-semibold lg:text-display">
            {frase}
          </p>
          {itens.length > 0 && (
            <ul className="mt-7 hidden flex-col gap-3.5 lg:flex">
              {itens.map((item) => (
                <li key={item} className="flex items-start gap-3 text-corpo">
                  <span
                    aria-hidden="true"
                    className="mt-[9px] size-2 shrink-0 rounded-full bg-acao-terracota"
                  />
                  {item}
                </li>
              ))}
            </ul>
          )}
        </div>

        {rodape && (
          <p className="relative hidden text-legenda opacity-80 lg:block">{rodape}</p>
        )}
      </aside>

      <main className="flex flex-1 justify-center px-5 py-8 md:px-10 lg:items-center lg:px-[88px] lg:py-14">
        <div className="w-full max-w-[704px]">{children}</div>
      </main>
    </div>
  );
}
