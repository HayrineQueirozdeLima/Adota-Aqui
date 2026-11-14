import { FormaDaPata } from "../Pata/Pata";
import { pegadasNaCurva } from "../../utils/curva";

// Trilha de pegadas laranja no fundo de uma faixa roxa, como se um bichinho atravessasse a faixa.
// É enfeite: fica atrás do conteúdo, o leitor de tela pula e o mouse passa direto.
// A animação (uma pegada aparecendo depois da outra, sem parar) fica no index.css, e quem pediu
// menos movimento no sistema vê a trilha parada e mais clarinha.
// O caminho vem nas medidas do viewBox. O "slice" corta as sobras em vez de achatar as patas.
// className diz onde a trilha fica dentro da faixa (por padrão, ocupa a faixa inteira)
export default function TrilhaDePatas({
  caminho,
  passos = 12,
  tamanho = 1.6,
  className = "inset-0",
}) {
  const { largura, altura, ...curva } = caminho;
  const posicoes = Array.from({ length: passos }, (_, posicao) => (posicao + 0.5) / passos);
  const pegadas = pegadasNaCurva(curva, posicoes, 9 * tamanho);

  return (
    <div aria-hidden="true" className={`pointer-events-none absolute overflow-hidden ${className}`}>
      <svg
        viewBox={`0 0 ${largura} ${altura}`}
        preserveAspectRatio="xMidYMid slice"
        className="h-full w-full"
      >
        {pegadas.map((pegada, posicao) => (
          <g
            key={posicao}
            className="trilha-pegada"
            style={{ "--atraso": `${(posicao * 0.45).toFixed(2)}s` }}
          >
            <g
              className="fill-acao-terracota"
              opacity="0.45"
              transform={`translate(${pegada.x.toFixed(1)} ${pegada.y.toFixed(1)}) rotate(${pegada.giro.toFixed(1)}) scale(${tamanho}) translate(-12 -12)`}
            >
              <FormaDaPata />
            </g>
          </g>
        ))}
      </svg>
    </div>
  );
}
