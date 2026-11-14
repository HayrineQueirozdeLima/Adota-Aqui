import { useEffect, useRef } from "react";
import { FormaDaPata } from "../Pata/Pata";

// Quanto o mouse anda entre uma pegada e outra, em pixels
const DISTANCIA_ENTRE_PASSOS = 46;
// Quanto cada pegada fica pro lado do caminho (pata esquerda, pata direita)
const AFASTAMENTO = 8;
// Mais que isso na tela ao mesmo tempo, as mais velhas saem antes de sumir sozinhas
const MAXIMO_NA_TELA = 24;
// As classes ficam escritas aqui pro Tailwind achar (a pegada é criada fora do React)
const CLASSES_DA_PEGADA = "rastro-pegada text-acao-terracota";

// Pegadas laranja que ficam no caminho do mouse e somem em menos de 1 segundo.
// A setinha do mouse continua: a pegada vem atrás dela. Só aparece com mouse (no celular não tem)
// e pra quem não pediu menos movimento no sistema.
// As pegadas são criadas direto no DOM, e não pelo React, pra não redesenhar a página a cada movimento
export default function RastroDePatas() {
  const camada = useRef(null);

  useEffect(() => {
    const pode = window.matchMedia?.("(pointer: fine) and (prefers-reduced-motion: no-preference)");
    if (!pode?.matches || !camada.current) return undefined;
    const destino = camada.current;
    let ultimo = null;
    let lado = 1;

    function pisar(x, y, angulo) {
      const pegada = document.createElementNS("http://www.w3.org/2000/svg", "svg");
      pegada.setAttribute("viewBox", "0 0 24 24");
      pegada.setAttribute("class", CLASSES_DA_PEGADA);
      // Os dedos do desenho apontam pra cima: gira pra apontarem pra onde o mouse foi
      pegada.style.setProperty("--onde", `translate(${x - 11}px, ${y - 11}px) rotate(${angulo + 90}deg)`);
      pegada.innerHTML = '<use href="#forma-da-pata-do-rastro" fill="currentColor" />';
      pegada.addEventListener("animationend", () => pegada.remove());
      destino.appendChild(pegada);
      // A primeira filha é o desenho guardado (<svg> com o symbol), que nunca sai
      while (destino.children.length > MAXIMO_NA_TELA + 1) destino.children[1].remove();
    }

    function mover(evento) {
      if (evento.pointerType !== "mouse") return;
      const { clientX: x, clientY: y } = evento;
      if (!ultimo) {
        ultimo = { x, y };
        return;
      }
      const dx = x - ultimo.x;
      const dy = y - ultimo.y;
      if (Math.hypot(dx, dy) < DISTANCIA_ENTRE_PASSOS) return;
      const radianos = Math.atan2(dy, dx);
      lado = -lado;
      pisar(
        x + lado * AFASTAMENTO * -Math.sin(radianos),
        y + lado * AFASTAMENTO * Math.cos(radianos),
        (radianos * 180) / Math.PI,
      );
      ultimo = { x, y };
    }

    // O mouse saiu da janela: a próxima pegada recomeça de onde ele voltar
    function sair() {
      ultimo = null;
    }

    window.addEventListener("pointermove", mover, { passive: true });
    document.documentElement.addEventListener("pointerleave", sair);
    return () => {
      window.removeEventListener("pointermove", mover);
      document.documentElement.removeEventListener("pointerleave", sair);
    };
  }, []);

  return (
    <div
      ref={camada}
      aria-hidden="true"
      className="pointer-events-none fixed inset-0 z-50 overflow-hidden"
    >
      <svg width="0" height="0" className="absolute">
        <symbol id="forma-da-pata-do-rastro" viewBox="0 0 24 24">
          <FormaDaPata />
        </symbol>
      </svg>
    </div>
  );
}
