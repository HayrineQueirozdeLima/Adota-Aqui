import { render, screen } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import App from "../src/App";

// O MemoryRouter é um roteador "de mentira": a gente escolhe em qual URL o teste começa
test("abre a Home no endereço /", async () => {
  render(
    <MemoryRouter initialEntries={["/"]}>
      <App />
    </MemoryRouter>,
  );
  expect(screen.getByText("Adota Aqui")).toBeInTheDocument();
  // A Home carrega a vitrine: espera os cards pra não terminar o teste no meio da busca
  await screen.findAllByRole("heading", { level: 3 });
});

test("mostra a página de não encontrada em um endereço que não existe", () => {
  render(
    <MemoryRouter initialEntries={["/endereco-que-nao-existe"]}>
      <App />
    </MemoryRouter>,
  );
  expect(screen.getByText("Página não encontrada")).toBeInTheDocument();
});
