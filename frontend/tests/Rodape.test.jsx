import { render, screen } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import Rodape from "../src/components/Rodape/Rodape";

function renderizar() {
  render(
    <MemoryRouter>
      <Rodape />
    </MemoryRouter>,
  );
}

test("os links da plataforma levam pras telas do site", () => {
  renderizar();

  const destinos = {
    "Explorar animais": "/animais",
    "Como adotar": "/#como-funciona",
    "Abrigos e protetores independentes": "/cadastro",
    "Cadastrar um animal": "/meus-animais/novo",
  };
  for (const [nome, destino] of Object.entries(destinos)) {
    expect(screen.getByRole("link", { name: nome })).toHaveAttribute("href", destino);
  }
});

test("os links do projeto abrem o GitHub em outra aba", () => {
  renderizar();

  const sobre = screen.getByRole("link", { name: /^Sobre o projeto/ });
  expect(sobre).toHaveAttribute("href", "https://github.com/HayrineQueirozdeLima/Adota-Aqui");
  expect(sobre).toHaveAttribute("target", "_blank");
  expect(sobre).toHaveAttribute("rel", "noopener noreferrer");
  expect(sobre).toHaveAccessibleName("Sobre o projeto (abre em outra aba)");
});
