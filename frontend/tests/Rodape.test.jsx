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
    "Quem somos": "/quem-somos",
    "Explorar animais": "/animais",
    "Como adotar": "/#como-funciona",
    "Histórias de adoção": "/historias",
    "Blog para tutores": "/blog",
    "Abrigos e protetores independentes": "/protetores",
    "Feiras de adoção": "/feiras",
    "Clínicas veterinárias": "/clinicas",
    "Observatório da adoção": "/observatorio",
    "Cadastrar um animal": "/meus-animais/novo",
  };
  for (const [nome, destino] of Object.entries(destinos)) {
    expect(screen.getByRole("link", { name: nome })).toHaveAttribute(
      "href",
      destino,
    );
  }
});
