import { useEffect, useRef, useState } from "react";

// Um número que conta do zero até o valor quando aparece na tela (os números da Home e do observatório).
// O leitor de tela ouve só o valor final, nunca a contagem.
// Sem o observador de rolagem (navegador antigo, testes) ou pra quem pediu menos movimento, já mostra o valor
function podeAnimar() {
  return (
    typeof window !== "undefined" &&
    typeof IntersectionObserver !== "undefined" &&
    typeof window.matchMedia === "function" &&
    window.matchMedia("(prefers-reduced-motion: no-preference)").matches
  );
}

const DURACAO = 1200;

export default function NumeroQueSobe({ valor, formatar = String }) {
  const [anima] = useState(podeAnimar);
  const [atual, setAtual] = useState(anima ? 0 : valor);
  const elemento = useRef(null);
  // O número que está na tela agora: se o valor mudar, a contagem parte dele, e não do zero
  const mostrado = useRef(anima ? 0 : valor);

  useEffect(() => {
    if (!anima) {
      setAtual(valor);
      return undefined;
    }
    let quadro;
    const observador = new IntersectionObserver(
      ([entrada]) => {
        if (!entrada.isIntersecting) return;
        observador.disconnect();
        const inicio = performance.now();
        const de = mostrado.current;
        const passo = (agora) => {
          const andou = Math.min(1, (agora - inicio) / DURACAO);
          // começa rápido e vai freando perto do valor final
          mostrado.current = Math.round(de + (valor - de) * (1 - (1 - andou) ** 3));
          setAtual(mostrado.current);
          if (andou < 1) quadro = requestAnimationFrame(passo);
        };
        quadro = requestAnimationFrame(passo);
      },
      { threshold: 0.6 },
    );
    observador.observe(elemento.current);
    return () => {
      observador.disconnect();
      cancelAnimationFrame(quadro);
    };
  }, [anima, valor]);

  if (!anima) return formatar(valor);
  return (
    <span ref={elemento} className="tabular-nums">
      <span aria-hidden="true">{formatar(atual)}</span>
      <span className="sr-only">{formatar(valor)}</span>
    </span>
  );
}
