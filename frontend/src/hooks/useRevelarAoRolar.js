import { useEffect } from "react";

// Os blocos com a classe "revelar-ao-rolar" sobem e aparecem de leve quando entram na tela.
// Quem esconde é o CSS (index.css), e só quando o <html> tem a classe "animar": o index.html põe essa classe
// antes do React desenhar, se o navegador sabe observar a rolagem e a pessoa não pediu menos movimento.
// Aqui a gente só marca o bloco com data-revelado quando ele aparece. É atributo e não classe porque o
// React reescreve o className quando ele muda, e o bloco sumiria de novo.
// Fica no Layout e vale pro site todo: blocos que chegam depois (a vitrine carregando, o "Ver mais")
// são achados pelo MutationObserver
export function useRevelarAoRolar() {
  useEffect(() => {
    const raiz = document.documentElement;
    if (!raiz.classList.contains("animar") || typeof IntersectionObserver === "undefined") return undefined;

    const observador = new IntersectionObserver(
      (entradas) => {
        for (const entrada of entradas) {
          if (!entrada.isIntersecting) continue;
          entrada.target.setAttribute("data-revelado", "");
          observador.unobserve(entrada.target);
        }
      },
      // Espera o bloco subir um pouco da borda de baixo antes de aparecer
      { rootMargin: "0px 0px -8% 0px", threshold: 0.1 },
    );

    function observar(no) {
      if (no.nodeType !== 1) return;
      if (no.matches(".revelar-ao-rolar:not([data-revelado])")) observador.observe(no);
      for (const bloco of no.querySelectorAll(".revelar-ao-rolar:not([data-revelado])")) observador.observe(bloco);
    }

    observar(document.body);
    const mudancas = new MutationObserver((lista) => {
      for (const mudanca of lista) mudanca.addedNodes.forEach(observar);
    });
    mudancas.observe(document.body, { childList: true, subtree: true });

    return () => {
      observador.disconnect();
      mudancas.disconnect();
    };
  }, []);
}
