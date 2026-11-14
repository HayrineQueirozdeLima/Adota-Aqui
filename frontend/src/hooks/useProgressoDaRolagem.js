import { useEffect } from "react";

// Quanto a pessoa já leu de um bloco, de 0 a 1, guardado na variável --progresso do bloco.
// A trilha da história no Quem somos usa isso pra ir ficando laranja conforme a leitura:
// a medida é a da linha pontilhada, marcada com data-linha-da-trilha (ou do bloco inteiro, se não tiver;
// a linha laranja não serve de régua porque ela mesma encolhe e cresce com o --progresso),
// e cada pata (data-marco) ganha data-alcancado quando a linha laranja chega nela.
// A leitura conta a partir de uma linha imaginária a 60% da altura da tela, que é onde o olho costuma estar.
// Só liga quando o site pode animar (classe "animar" no <html>, ver index.html)
export function useProgressoDaRolagem(referencia) {
  useEffect(() => {
    const bloco = referencia.current;
    if (!bloco || !document.documentElement.classList.contains("animar")) return undefined;

    let quadro = 0;
    function medir() {
      quadro = 0;
      const leitura = window.innerHeight * 0.6;
      const linha = bloco.querySelector("[data-linha-da-trilha]") ?? bloco;
      const { top, height } = linha.getBoundingClientRect();
      const progresso = height > 0 ? Math.min(1, Math.max(0, (leitura - top) / height)) : 0;
      bloco.style.setProperty("--progresso", progresso.toFixed(3));
      // A pata acende quando a leitura passa do meio dela. A posição vem do offsetTop, e não da caixa na tela,
      // porque a parte da história ainda pode estar subindo (revelar-ao-rolar) e a caixa estaria deslocada
      const topoDoBloco = bloco.getBoundingClientRect().top;
      for (const marco of bloco.querySelectorAll("[data-marco]")) {
        let distancia = marco.offsetHeight / 2;
        for (let no = marco; no && no !== bloco; no = no.offsetParent) distancia += no.offsetTop;
        marco.toggleAttribute("data-alcancado", topoDoBloco + distancia <= leitura);
      }
    }
    // A rolagem dispara muitas vezes por segundo: mede no máximo uma vez por quadro da tela
    function aoRolar() {
      if (!quadro) quadro = requestAnimationFrame(medir);
    }

    medir();
    window.addEventListener("scroll", aoRolar, { passive: true });
    window.addEventListener("resize", aoRolar);
    // Quando uma foto acima termina de carregar, a página cresce e a trilha muda de lugar sem rolagem nenhuma
    const tamanhoDaPagina = typeof ResizeObserver === "undefined" ? null : new ResizeObserver(aoRolar);
    tamanhoDaPagina?.observe(document.body);
    return () => {
      window.removeEventListener("scroll", aoRolar);
      window.removeEventListener("resize", aoRolar);
      tamanhoDaPagina?.disconnect();
      cancelAnimationFrame(quadro);
    };
  }, [referencia]);
}
