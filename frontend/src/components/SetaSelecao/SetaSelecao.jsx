// Seta das listas de opções (<select>).
// A seta nativa do navegador fica colada na borda direita (retorno do tutor na reunião de 04/11).
// Com ela escondida (appearance-none), essa aqui entra no lugar, com espaço até a borda.
// É stroke="currentColor": pega a cor do texto, então funciona no tema claro, no escuro e no filtro marcado.
// O select precisa estar dentro de um elemento "relative" e ter espaço à direita (pr-10 ou mais)
export default function SetaSelecao({ className = "" }) {
  return (
    <svg
      aria-hidden="true"
      viewBox="0 0 16 16"
      className={`pointer-events-none absolute top-1/2 size-4 -translate-y-1/2 ${className}`}
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M4 6l4 4 4-4" />
    </svg>
  );
}
