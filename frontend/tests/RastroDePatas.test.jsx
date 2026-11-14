import { render } from "@testing-library/react";
import RastroDePatas from "../src/components/RastroDePatas/RastroDePatas";

// Pegadas no caminho do mouse. O jsdom não tem matchMedia nem PointerEvent:
// o teste diz o que o navegador responde e monta o movimento na mão

function navegador({ temMouse = true, menosMovimento = false } = {}) {
  window.matchMedia = jest.fn(() => ({ matches: temMouse && !menosMovimento }));
}

function mover(x, y, pointerType = "mouse") {
  const evento = new MouseEvent("pointermove", { clientX: x, clientY: y });
  Object.defineProperty(evento, "pointerType", { value: pointerType });
  window.dispatchEvent(evento);
}

const pegadas = () => document.querySelectorAll(".rastro-pegada");

afterEach(() => {
  delete window.matchMedia;
});

test("o mouse andando deixa pegadas, uma a cada passo, que somem quando a animação acaba", () => {
  navegador();
  render(<RastroDePatas />);

  mover(0, 0);
  mover(20, 0); // ainda não deu um passo
  expect(pegadas()).toHaveLength(0);

  mover(60, 0);
  mover(120, 0);
  expect(pegadas()).toHaveLength(2);
  // Pata esquerda e pata direita: uma de cada lado do caminho
  const [primeira, segunda] = pegadas();
  // (o lugar é o canto da pegada de 22 px: o ponto menos 11)
  expect(primeira.style.getPropertyValue("--onde")).toBe("translate(49px, -19px) rotate(90deg)");
  expect(segunda.style.getPropertyValue("--onde")).toBe("translate(109px, -3px) rotate(90deg)");

  primeira.dispatchEvent(new Event("animationend"));
  expect(pegadas()).toHaveLength(1);
});

test("não deixa mais que 24 pegadas na tela", () => {
  navegador();
  render(<RastroDePatas />);
  for (let passo = 0; passo <= 40; passo += 1) mover(passo * 50, 0);
  expect(pegadas()).toHaveLength(24);
});

test("toque na tela não deixa pegada", () => {
  navegador();
  render(<RastroDePatas />);
  mover(0, 0, "touch");
  mover(200, 0, "touch");
  expect(pegadas()).toHaveLength(0);
});

test("quem pediu menos movimento, ou não tem mouse, não vê o rastro", () => {
  navegador({ menosMovimento: true });
  render(<RastroDePatas />);
  mover(0, 0);
  mover(200, 0);
  expect(pegadas()).toHaveLength(0);
});
