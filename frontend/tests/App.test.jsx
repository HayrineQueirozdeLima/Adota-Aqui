import { render, screen, waitFor } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import App from "../src/App";
import { simularApi, ultimaBuscaDeAnimais } from "./utils/apiFalsa";

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

// "/blog/novo" e "/blog/:id" casam com o mesmo endereço: o roteador escolhe a rota com a parte fixa,
// que pede login. Se escolhesse a outra, a tela buscaria um artigo com o id "novo"
test("o /blog/novo é o formulário de escrever, que pede login, e não um artigo", async () => {
  render(
    <MemoryRouter initialEntries={["/blog/novo"]}>
      <App />
    </MemoryRouter>,
  );
  await waitFor(() => expect(document.title).toBe("Entrar | Adota Aqui"));
  expect(fetch).not.toHaveBeenCalledWith(expect.stringContaining("/api/artigos/novo"), expect.anything());
});

// O "Ver animais" da página de abrigos e protetores leva pra /animais?busca=nome do protetor
test("a /animais?busca= abre a vitrine já buscando por esse nome", async () => {
  render(
    <MemoryRouter initialEntries={["/animais?busca=Instituto%20Quatro%20Patas"]}>
      <App />
    </MemoryRouter>,
  );
  await screen.findByRole("heading", { level: 2, name: "Mel" });
  expect(screen.getByLabelText("Buscar por nome")).toHaveValue(
    "Instituto Quatro Patas",
  );
  expect(ultimaBuscaDeAnimais().parametros).toEqual({
    busca: "Instituto Quatro Patas",
  });
});

test("a página de abrigos e protetores abre no /protetores", async () => {
  render(
    <MemoryRouter initialEntries={["/protetores"]}>
      <App />
    </MemoryRouter>,
  );
  expect(
    await screen.findByRole("heading", {
      level: 2,
      name: "Instituto Quatro Patas",
    }),
  ).toBeInTheDocument();
  expect(document.title).toBe("Abrigos e protetores | Adota Aqui");
});

test("o Quem somos abre no /quem-somos", () => {
  render(
    <MemoryRouter initialEntries={["/quem-somos"]}>
      <App />
    </MemoryRouter>,
  );
  expect(
    screen.getByRole("heading", { level: 1, name: "Quem somos" }),
  ).toBeInTheDocument();
  expect(document.title).toBe("Quem somos | Adota Aqui");
});

test("as clínicas veterinárias abrem no /clinicas, já na cidade do link", () => {
  render(
    <MemoryRouter initialEntries={["/clinicas?cidade=Recife&estado=PE"]}>
      <App />
    </MemoryRouter>,
  );
  expect(
    screen.getByRole("heading", {
      level: 2,
      name: "Clínicas veterinárias perto de Recife/PE",
    }),
  ).toBeInTheDocument();
  expect(document.title).toBe("Clínicas veterinárias | Adota Aqui");
});

test("as feiras de adoção abrem no /feiras", async () => {
  render(
    <MemoryRouter initialEntries={["/feiras"]}>
      <App />
    </MemoryRouter>,
  );
  expect(
    screen.getByRole("heading", { level: 1, name: "Feiras de adoção" }),
  ).toBeInTheDocument();
  expect(document.title).toBe("Feiras de adoção | Adota Aqui");
  await screen.findByText("Nenhuma feira marcada por enquanto.");
});

test("divulgar feira é só do abrigo: pessoa física volta pras feiras e visitante vai pro login", async () => {
  localStorage.setItem(
    "adotaaqui.sessao",
    JSON.stringify({
      token: "token-de-teste",
      tipoConta: "USUARIO",
      id: "1",
      nome: "Marina Prado",
      expiraEm: "2999-01-01T00:00:00Z",
    }),
  );
  const { unmount } = render(
    <MemoryRouter initialEntries={["/feiras/nova"]}>
      <App />
    </MemoryRouter>,
  );
  expect(
    screen.getByRole("heading", { level: 1, name: "Feiras de adoção" }),
  ).toBeInTheDocument();
  await screen.findByText("Nenhuma feira marcada em Rondônia por enquanto.");
  unmount();
  localStorage.clear();

  render(
    <MemoryRouter initialEntries={["/feiras/nova"]}>
      <App />
    </MemoryRouter>,
  );
  expect(screen.getByRole("button", { name: "Entrar" })).toBeInTheDocument();
});

test("o observatório da adoção abre no /observatorio", async () => {
  render(
    <MemoryRouter initialEntries={["/observatorio"]}>
      <App />
    </MemoryRouter>,
  );
  expect(
    screen.getByRole("heading", { level: 1, name: "Observatório da adoção" }),
  ).toBeInTheDocument();
  expect(document.title).toBe("Observatório da adoção | Adota Aqui");
  await screen.findByText("38");
});
