import { render, screen } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import App from "../src/App";
import { simularApi } from "./utils/apiFalsa";

// A Home tem a vitrine, que busca na API: os testes usam a API de mentira
beforeEach(() => {
  simularApi();
});

// O MemoryRouter é um roteador "de mentira": a gente escolhe em qual URL o teste começa
test("abre a Home no endereço /", async () => {
  render(
    <MemoryRouter initialEntries={["/"]}>
      <App />
    </MemoryRouter>,
  );
  expect(
    screen.getByRole("heading", { level: 1, name: "Todo animal merece um lar de verdade." }),
  ).toBeInTheDocument();
  // A Home carrega a vitrine: espera os cards pra não terminar o teste no meio da busca
  await screen.findAllByRole("link", { name: /^Quero conhecer/ });
});

test("mostra a página de não encontrada em um endereço que não existe", () => {
  render(
    <MemoryRouter initialEntries={["/endereco-que-nao-existe"]}>
      <App />
    </MemoryRouter>,
  );
  expect(screen.getByText("Página não encontrada")).toBeInTheDocument();
  expect(screen.getByRole("link", { name: "Ver animais disponíveis" })).toHaveAttribute("href", "/animais");
  expect(screen.getByRole("link", { name: "Ir para a página inicial" })).toHaveAttribute("href", "/");
});
