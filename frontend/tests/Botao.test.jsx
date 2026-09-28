import { render, screen } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import Botao from "../src/components/Botao/Botao";

test("mostra o texto que recebeu", () => {
  render(<Botao>Quero conhecer Mel</Botao>);
  expect(
    screen.getByRole("button", { name: "Quero conhecer Mel" }),
  ).toBeInTheDocument();
});

test("vira um link quando recebe o destino", () => {
  render(
    <MemoryRouter>
      <Botao para="/login">Entrar</Botao>
    </MemoryRouter>,
  );
  expect(screen.getByRole("link", { name: "Entrar" })).toHaveAttribute(
    "href",
    "/login",
  );
});
