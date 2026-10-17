import { useTema } from "../../hooks/useTema";

// Botão de liga e desliga do tema escuro, no topo do site (fica em cima do roxo, por isso é branco).
// O aria-pressed faz o leitor de tela dizer se o tema escuro está ligado ou não
export default function BotaoTema() {
  const { tema, alternar } = useTema();
  const escuro = tema === "escuro";

  return (
    <button
      type="button"
      onClick={alternar}
      aria-label="Tema escuro"
      aria-pressed={escuro}
      title={escuro ? "Usar o tema claro" : "Usar o tema escuro"}
      className="inline-flex size-11 shrink-0 items-center justify-center rounded-full text-texto-sobre-marca hover:opacity-80 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-texto-sobre-marca"
    >
      {escuro ? <IconeSol /> : <IconeLua />}
    </button>
  );
}

function IconeLua() {
  return (
    <svg aria-hidden="true" viewBox="0 0 24 24" className="size-[22px]" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M21 12.8A9 9 0 1 1 11.2 3a7 7 0 0 0 9.8 9.8z" />
    </svg>
  );
}

function IconeSol() {
  return (
    <svg aria-hidden="true" viewBox="0 0 24 24" className="size-[22px]" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="4.5" />
      <path d="M12 2v2M12 20v2M4.9 4.9l1.4 1.4M17.7 17.7l1.4 1.4M2 12h2M20 12h2M4.9 19.1l1.4-1.4M17.7 6.3l1.4-1.4" />
    </svg>
  );
}
