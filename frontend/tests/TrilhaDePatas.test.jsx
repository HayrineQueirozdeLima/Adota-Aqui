import { render } from "@testing-library/react";
import TrilhaDePatas from "../src/components/TrilhaDePatas/TrilhaDePatas";

// Trilha de patas no fundo das faixas roxas: enfeite, escondido do leitor de tela

const caminho = {
  largura: 1000,
  altura: 150,
  inicio: { x: 0, y: 100 },
  controle: { x: 500, y: 100 },
  fim: { x: 1000, y: 20 },
};

test("desenha uma pegada por passo, cada uma com o próprio atraso, e o leitor de tela pula", () => {
  const { container } = render(<TrilhaDePatas caminho={caminho} passos={5} className="right-0 top-0" />);

  const trilha = container.firstChild;
  expect(trilha).toHaveAttribute("aria-hidden", "true");
  expect(trilha).toHaveClass("pointer-events-none", "right-0", "top-0");
  expect(trilha.querySelector("svg")).toHaveAttribute("viewBox", "0 0 1000 150");

  const pegadas = trilha.querySelectorAll(".trilha-pegada");
  expect(pegadas).toHaveLength(5);
  expect(pegadas[0].style.getPropertyValue("--atraso")).toBe("0.00s");
  expect(pegadas[4].style.getPropertyValue("--atraso")).toBe("1.80s");
});
