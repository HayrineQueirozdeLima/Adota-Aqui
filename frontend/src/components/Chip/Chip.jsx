// botão de filtro em formato de pílula
// ligado = escuro
// O aria-pressed conta pro leitor de tela se o filtro está ligado ou não
export default function Chip({ ativo = false, onClick, children }) {
  const cores = ativo
    ? "border-texto-principal bg-texto-principal text-fundo-superficie"
    : "border-borda-sutil bg-fundo-superficie text-texto-principal";

  return (
    <button
      type="button"
      aria-pressed={ativo}
      onClick={onClick}
      className={`rounded-full border px-[17px] py-2 font-titulo text-campo font-semibold focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-marca-roxo ${cores}`}
    >
      {children}
    </button>
  );
}
