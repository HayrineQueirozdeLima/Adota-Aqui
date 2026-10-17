import { useCallback, useEffect, useState } from "react";

// Mesma chave e mesma classe que o script do index.html usa ao abrir o site
const CHAVE = "adotaaqui.tema";
const CLASSE_ESCURO = "tema-escuro";

// Se a pessoa já escolheu, vale a escolha dela. Se não, segue o tema do celular ou do computador
function temaInicial() {
  try {
    const salvo = localStorage.getItem(CHAVE);
    if (salvo === "claro" || salvo === "escuro") return salvo;
  } catch {
    // navegador sem localStorage (modo privado de alguns celulares): segue o sistema
  }
  const sistemaEscuro =
    typeof window.matchMedia === "function" &&
    window.matchMedia("(prefers-color-scheme: dark)").matches;
  return sistemaEscuro ? "escuro" : "claro";
}

// Tema claro ou escuro: devolve o tema atual e a função que troca
export function useTema() {
  const [tema, setTema] = useState(temaInicial);

  useEffect(() => {
    document.documentElement.classList.toggle(CLASSE_ESCURO, tema === "escuro");
  }, [tema]);

  const alternar = useCallback(() => {
    const novo = tema === "escuro" ? "claro" : "escuro";
    setTema(novo);
    try {
      localStorage.setItem(CHAVE, novo);
    } catch {
      // sem localStorage, a troca vale só até fechar a página
    }
  }, [tema]);

  return { tema, alternar };
}
