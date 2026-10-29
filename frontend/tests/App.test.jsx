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
    screen.getByRole("heading", {
      level: 1,
      name: "Todo animal merece um lar de verdade.",
    }),
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
  expect(document.title).toBe("Página não encontrada | Adota Aqui");
  expect(
    screen.getByRole("link", { name: "Ver animais disponíveis" }),
  ).toHaveAttribute("href", "/animais");
  expect(
    screen.getByRole("link", { name: "Ir para a página inicial" }),
  ).toHaveAttribute("href", "/");
});

// O título da aba muda com a página (hooks/useTituloDaPagina)
test("cada página põe o nome dela no título da aba", async () => {
  const { unmount } = render(
    <MemoryRouter initialEntries={["/animais"]}>
      <App />
    </MemoryRouter>,
  );
  await screen.findAllByRole("link", { name: /^Quero conhecer/ });
  expect(document.title).toBe("Animais para adoção | Adota Aqui");
  unmount();

  render(
    <MemoryRouter initialEntries={["/login"]}>
      <App />
    </MemoryRouter>,
  );
  expect(document.title).toBe("Entrar | Adota Aqui");
});

// Na /animais o nome de cada animal é h2, logo abaixo do h1 da página. Na Home ele é h3, abaixo do h2 da vitrine.
// Espera pelo h2 da Mel: o rodapé já tem um h2 ("Plataforma") antes da vitrine carregar
test("na lista de animais, os títulos seguem a ordem: h1 da página e h2 em cada animal", async () => {
  render(
    <MemoryRouter initialEntries={["/animais"]}>
      <App />
    </MemoryRouter>,
  );
  expect(
    await screen.findByRole("heading", { level: 2, name: "Mel" }),
  ).toBeInTheDocument();
  expect(
    screen.queryAllByRole("heading", { level: 3, name: "Mel" }),
  ).toHaveLength(0);
});
