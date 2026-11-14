import { estados } from "../../utils/rotulos";
import { descreverValor, grade } from "../../utils/observatorio";

// Os 5 tons do roxo, do mais claro (pouco) ao mais escuro (muito), com o texto que dá contraste em cada um.
// As cores estão no index.css (--mapa-1 a --mapa-5) e mudam no tema escuro.
// O tom 0 é "nenhum ainda": sem cor, só o contorno tracejado
const tons = [
  "border border-dashed border-borda-forte bg-transparent text-texto-terciario",
  "border border-borda-sutil bg-[var(--mapa-1)] text-[var(--mapa-texto-1)]",
  "border border-transparent bg-[var(--mapa-2)] text-[var(--mapa-texto-2)]",
  "border border-transparent bg-[var(--mapa-3)] text-[var(--mapa-texto-3)]",
  "border border-transparent bg-[var(--mapa-4)] text-[var(--mapa-texto-4)]",
  "border border-transparent bg-[var(--mapa-5)] text-[var(--mapa-texto-5)]",
];

// O Brasil em mosaico: um quadrado por estado, no lugar aproximado dele, com a sigla e o valor.
// Cada quadrado é um botão: escolher um estado mostra os números dele do lado (quem decide é a página).
// tomDe(valor) diz o tom de cada valor, e formatar(valor) o que aparece escrito no quadrado
export default function MapaDoBrasil({ valores, medida, tomDe, formatar, selecionado, aoSelecionar }) {
  return (
    <div
      role="group"
      aria-label={`Mapa do Brasil: ${medida.nome.toLowerCase()} por estado`}
      className="grid grid-cols-6 gap-1.5 sm:gap-2"
    >
      {Object.entries(grade).map(([sigla, [coluna, linha]]) => {
        const valor = valores[sigla] ?? 0;
        const escolhido = selecionado === sigla;
        return (
          <button
            key={sigla}
            type="button"
            aria-pressed={escolhido}
            aria-label={`${estados[sigla]}: ${descreverValor(medida, valor)}`}
            onClick={() => aoSelecionar(escolhido ? null : sigla)}
            style={{ gridColumn: coluna + 1, gridRow: linha + 1 }}
            className={`flex aspect-square flex-col items-center justify-center rounded-[10px] font-titulo transition-transform hover:scale-[1.06] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-marca-roxo motion-reduce:transition-none motion-reduce:hover:scale-100 ${tons[tomDe(valor)]} ${
              escolhido ? "ring-[3px] ring-acao-terracota ring-offset-2 ring-offset-fundo-pagina" : ""
            }`}
          >
            <span className="text-campo font-semibold leading-none sm:text-item">{sigla}</span>
            <span className="mt-1 text-[11px] leading-none sm:text-legenda">{formatar(valor)}</span>
          </button>
        );
      })}
    </div>
  );
}

// A legenda: os 5 tons de "menos" a "mais", e o "nenhum ainda" quando a medida pode ter zero
export function LegendaDoMapa({ comNenhum }) {
  return (
    <div className="flex flex-wrap items-center gap-x-4 gap-y-2 text-legenda text-texto-secundario">
      <span className="flex items-center gap-1.5">
        menos
        {tons.slice(1).map((classes) => (
          <span key={classes} aria-hidden="true" className={`inline-block size-4 rounded-[4px] ${classes}`} />
        ))}
        mais
      </span>
      {comNenhum && (
        <span className="flex items-center gap-1.5">
          <span aria-hidden="true" className={`inline-block size-4 rounded-[4px] ${tons[0]}`} />
          nenhum ainda
        </span>
      )}
    </div>
  );
}
