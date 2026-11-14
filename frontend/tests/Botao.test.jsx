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

test("link pra fora do site abre em outra aba e avisa o leitor de tela", () => {
  render(<Botao href="https://www.google.com/maps">Abrir no Google Maps</Botao>);
  const link = screen.getByRole("link", {
    name: "Abrir no Google Maps (abre em outra aba)",
  });
  expect(link).toHaveAttribute("href", "https://www.google.com/maps");
  expect(link).toHaveAttribute("target", "_blank");
  expect(link).toHaveAttribute("rel", "noreferrer");
});
