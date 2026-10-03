import { fireEvent, render, screen } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import App from "../src/App";

const CHAVE = "adotaaqui.sessao";

function salvarSessao(armazenamento, mudancas = {}) {
  armazenamento.setItem(
    CHAVE,
    JSON.stringify({
      token: "token-de-teste",
      tipoConta: "USUARIO",
      id: "1",
      nome: "Marina Prado",
      expiraEm: "2999-01-01T00:00:00Z",
      ...mudancas,
    }),
  );
}

// A Home e a /animais carregam a vitrine: espera os cards aparecerem antes de terminar o teste
async function esperarVitrine() {
  await screen.findAllByRole("heading", { level: 3 });
}

function abrir(endereco) {
  render(
    <MemoryRouter initialEntries={[endereco]}>
      <App />
    </MemoryRouter>,
  );
}

afterEach(() => {
  localStorage.clear();
  sessionStorage.clear();
});

test("sem login, as telas de quem está logado mandam pro login", () => {
  abrir("/meus-animais");
  expect(
    screen.getByRole("heading", { name: "Entrar na sua conta" }),
  ).toBeInTheDocument();
});

test("a sessão salva continua valendo depois de recarregar a página", () => {
  salvarSessao(localStorage);
  abrir("/meus-animais");

  expect(
    screen.getByRole("heading", { name: "Meus Animais" }),
  ).toBeInTheDocument();
  expect(screen.getByText("MP")).toBeInTheDocument();
});

test("sessão com o token vencido é descartada", () => {
  salvarSessao(sessionStorage, { expiraEm: "2000-01-01T00:00:00Z" });
  abrir("/meus-animais");

  expect(
    screen.getByRole("heading", { name: "Entrar na sua conta" }),
  ).toBeInTheDocument();
  expect(sessionStorage.getItem(CHAVE)).toBeNull();
});

test("abrigo não entra nas telas que são só de pessoa física", async () => {
  salvarSessao(localStorage, {
    tipoConta: "ABRIGO",
    nome: "Instituto Quatro Patas",
  });
  abrir("/meus-interesses");

  expect(
    screen.getByRole("heading", { name: "Adota Aqui" }),
  ).toBeInTheDocument();
  await esperarVitrine();
});

test("quem já está logado e abre o login vai direto pra vitrine", async () => {
  salvarSessao(localStorage);
  abrir("/login");

  expect(
    screen.getByRole("heading", { name: "Animais para adoção" }),
  ).toBeInTheDocument();
  await esperarVitrine();
});

test("sair da conta apaga a sessão e volta pra Home", async () => {
  salvarSessao(localStorage);
  abrir("/perfil");
  fireEvent.click(screen.getByRole("button", { name: "Sair da conta" }));

  expect(
    screen.getByRole("heading", { name: "Adota Aqui" }),
  ).toBeInTheDocument();
  expect(localStorage.getItem(CHAVE)).toBeNull();
  expect(screen.getByRole("link", { name: "Entrar" })).toBeInTheDocument();
  await esperarVitrine();
});
