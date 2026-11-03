import { render, screen } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import QuemSomos from "../src/pages/QuemSomos/QuemSomos";

// Quem somos (/quem-somos): a história do projeto, sem chamar a API

function abrir() {
  render(
    <MemoryRouter>
      <QuemSomos />
    </MemoryRouter>,
  );
}

afterEach(() => {
  document.title = "";
});

test("conta como surgiu o projeto, a ideia, a motivação e a proposta", () => {
  abrir();

  expect(
    screen.getByRole("heading", { level: 1, name: "Quem somos" }),
  ).toBeInTheDocument();
  const secoes = screen
    .getAllByRole("heading", { level: 2 })
    .map((titulo) => titulo.textContent);
  expect(secoes).toEqual([
    "Como surgiu o projeto",
    "De onde veio a ideia",
    "O que motiva a gente",
    "O que o Adota Aqui se propõe a fazer",
    "Quer fazer parte?",
  ]);
  expect(
    screen.getByText(/projeto final da Trilha Full Stack/),
  ).toBeInTheDocument();
  expect(
    screen.getByText(/A decisão é sempre de quem cuida do animal/),
  ).toBeInTheDocument();
  expect(document.title).toBe("Quem somos | Adota Aqui");
});

test("cada seção tem nome pro leitor de tela", () => {
  abrir();

  for (const nome of [
    "Como surgiu o projeto",
    "De onde veio a ideia",
    "O que motiva a gente",
    "O que o Adota Aqui se propõe a fazer",
    "Quer fazer parte?",
  ]) {
    expect(screen.getByRole("region", { name: nome })).toBeInTheDocument();
  }
});

test("termina levando pros animais, pros abrigos e protetores e pro cadastro de animal", () => {
  abrir();

  expect(
    screen.getByRole("link", { name: "Ver animais disponíveis" }),
  ).toHaveAttribute("href", "/animais");
  expect(
    screen.getByRole("link", { name: "Conhecer abrigos e protetores" }),
  ).toHaveAttribute("href", "/protetores");
  expect(
    screen.getByRole("link", { name: "Resgatei um animal" }),
  ).toHaveAttribute("href", "/meus-animais/novo");
});
