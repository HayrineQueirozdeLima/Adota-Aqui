import { render, screen } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import Navbar from "../src/components/Navbar/Navbar";

const marina = { nome: "Marina Prado", tipoConta: "USUARIO" };
const abrigo = { nome: "Instituto Quatro Patas", tipoConta: "ABRIGO" };

function renderizar(usuario, endereco = "/") {
  render(
    <MemoryRouter initialEntries={[endereco]}>
      <Navbar usuario={usuario} />
    </MemoryRouter>,
  );
}

test("visitante vê Cadastrar e Entrar", () => {
  renderizar(null);
  expect(screen.getByRole("link", { name: "Cadastrar" })).toHaveAttribute(
    "href",
    "/cadastro",
  );
  expect(screen.getByRole("link", { name: "Entrar" })).toHaveAttribute(
    "href",
    "/login",
  );
});

test("usuario logado vê as iniciais e o menu completo", () => {
  renderizar(marina);
  expect(screen.getByText("MP")).toBeInTheDocument();
  expect(
    screen.getByRole("link", { name: "Minhas candidaturas" }),
  ).toBeInTheDocument();
});

test("abrigo não vê Minhas candidaturas", () => {
  renderizar(abrigo);
  expect(
    screen.queryByRole("link", { name: "Minhas candidaturas" }),
  ).not.toBeInTheDocument();
});

test("marca o item da página atual", () => {
  renderizar(marina, "/meus-animais");
  expect(screen.getByRole("link", { name: "Meus animais" })).toHaveAttribute(
    "aria-current",
    "page",
  );
});
