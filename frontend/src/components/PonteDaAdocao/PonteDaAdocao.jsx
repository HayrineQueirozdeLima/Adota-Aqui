import { FormaDaPata } from "../Pata/Pata";
import { pegadasNaCurva } from "../../utils/curva";

// Desenho do topo do Quem somos: o Adota Aqui é "uma ponte entre quem protege e quem quer adotar".
// Um arco liga as duas pontas e as pegadas atravessam de um lado pro outro.
// A animação (o arco se desenhando e as patas aparecendo uma depois da outra) fica no index.css,
// e não roda pra quem pediu menos movimento no sistema

// Onde o arco começa, passa e termina, nas medidas do viewBox (560 x 210)
const INICIO = { x: 118, y: 150 };
const CONTROLE = { x: 280, y: 18 };
const FIM = { x: 442, y: 150 };

// Sete pegadas, alternando um pouco pra cada lado do arco, como quem anda (a conta fica no utils/curva.js)
const pegadas = pegadasNaCurva(
  { inicio: INICIO, controle: CONTROLE, fim: FIM },
  [0.1, 0.23, 0.36, 0.5, 0.64, 0.77, 0.9],
  11,
).map((pegada, posicao) => ({ ...pegada, atraso: 500 + posicao * 140 }));

export default function PonteDaAdocao() {
  return (
    <div className="relative">
      <svg aria-hidden="true" viewBox="0 0 560 210" className="w-full overflow-visible">
        <path
          className="ponte-arco stroke-marca-roxo"
          opacity="0.35"
          d={`M ${INICIO.x} ${INICIO.y} Q ${CONTROLE.x} ${CONTROLE.y} ${FIM.x} ${FIM.y}`}
          pathLength="1"
          fill="none"
          strokeWidth="2.5"
          strokeLinecap="round"
        />

        {pegadas.map((pegada) => (
          <g key={pegada.atraso} className="ponte-pegada" style={{ "--atraso": `${pegada.atraso}ms` }}>
            <g
              className="fill-acao-terracota"
              transform={`translate(${pegada.x} ${pegada.y}) rotate(${pegada.giro}) scale(1.3) translate(-12 -12)`}
            >
              <FormaDaPata />
            </g>
          </g>
        ))}

        {/* Quem protege: uma casinha, o abrigo ou o lar temporário */}
        <g transform="translate(70 150)">
          <circle r="46" className="fill-fundo-superficie" />
          <path
            d="M-17 1 0-14 17 1M-11-4v18h22V-4M-4 14V4h8v10"
            className="stroke-marca-roxo"
            fill="none"
            strokeWidth="2.6"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </g>

        {/* Quem quer adotar: um coração */}
        <g transform="translate(490 150)">
          <circle r="46" className="fill-fundo-superficie" />
          <path
            d="M0 15S-17 5-17-5c0-5.5 4-9 8.5-9 3.6 0 6.3 2.2 8.5 5 2.2-2.8 4.9-5 8.5-5 4.5 0 8.5 3.5 8.5 9C17 5 0 15 0 15Z"
            className="stroke-marca-roxo"
            fill="none"
            strokeWidth="2.6"
            strokeLinejoin="round"
          />
        </g>
      </svg>

      <div className="mt-2 flex justify-between font-titulo text-compacto font-semibold text-texto-principal sm:text-item">
        <span className="w-[25%] text-center sm:whitespace-nowrap">Quem protege</span>
        <span className="w-[25%] text-center sm:whitespace-nowrap">Quem quer adotar</span>
      </div>
    </div>
  );
}
