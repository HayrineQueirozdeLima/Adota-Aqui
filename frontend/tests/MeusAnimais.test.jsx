import { fireEvent, render, screen, within } from "@testing-library/react";
import { MemoryRouter, Route, Routes } from "react-router-dom";
import { AuthProvider } from "../src/contexts/AuthContext";
import { animaisExemplo } from "../src/mocks/animais";
import MeusAnimais from "../src/pages/MeusAnimais/MeusAnimais";
import { resposta, simularApi } from "./utils/apiFalsa";

const CHAVE = "adotaaqui.sessao";
const [mel, tobias, amora] = animaisExemplo;
const meus = [mel, tobias, { ...amora, statusAdocao: "ADOTADO" }];

function entrar() {
  localStorage.setItem(
    CHAVE,
    JSON.stringify({
      token: "token-de-teste",
      tipoConta: "USUARIO",
      id: "1",
      nome: "Ana",
      expiraEm: "2999-01-01T00:00:00Z",
    }),
  );
}

function simular(respostaMeus) {
  simularApi({
    outras: (metodo, caminho) =>
      caminho === "/api/animais/meus" ? respostaMeus : undefined,
  });
}

function abrir(estado) {
  render(
    <MemoryRouter
      initialEntries={[{ pathname: "/meus-animais", state: estado }]}
    >
      <AuthProvider>
        <Routes>
          <Route path="/meus-animais" element={<MeusAnimais />} />
        </Routes>
      </AuthProvider>
    </MemoryRouter>,
  );
}

beforeEach(() => {
  entrar();
  simular(resposta(200, meus));
});

afterEach(() => {
  localStorage.clear();
  sessionStorage.clear();
});

test("lista os animais da conta, com o token, e conta por status", async () => {
  abrir();

  expect(
    await screen.findByRole("heading", { name: "Mel" }),
  ).toBeInTheDocument();
  expect(screen.getByRole("heading", { name: "Amora" })).toBeInTheDocument();
  expect(screen.getByRole("button", { name: "Todos 3" })).toHaveAttribute(
    "aria-pressed",
    "true",
  );
  expect(
    screen.getByRole("button", { name: "Disponível 2" }),
  ).toBeInTheDocument();
  expect(screen.getByRole("button", { name: "Adotado 1" })).toBeInTheDocument();
  const [[url, opcoes]] = fetch.mock.calls;
  expect(url).toBe("http://api.teste/api/animais/meus");
  expect(opcoes.headers.Authorization).toBe("Bearer token-de-teste");
});

test("disponível tem Editar e Ver interesses; adotado tem Editar status", async () => {
  abrir();
  await screen.findByRole("heading", { name: "Mel" });

  expect(screen.getByRole("link", { name: "Editar Mel" })).toHaveAttribute(
    "href",
    `/meus-animais/${mel.id}/editar`,
  );
  expect(
    screen.getByRole("link", { name: "Editar status de Amora" }),
  ).toHaveAttribute("href", `/meus-animais/${amora.id}/editar`);
  // "Ver interesses" abre o painel já filtrado pelo animal
  expect(screen.getByRole("link", { name: "Ver interesses em Mel" })).toHaveAttribute(
    "href",
    `/interesses-recebidos?animal=${mel.id}`,
  );
  expect(screen.getByRole("link", { name: "Ver interesses em Tobias" })).toBeInTheDocument();
  expect(screen.queryByRole("link", { name: "Ver interesses em Amora" })).not.toBeInTheDocument();
});

test("o filtro mostra só os adotados", async () => {
  abrir();
  await screen.findByRole("heading", { name: "Mel" });

  fireEvent.click(screen.getByRole("button", { name: "Adotado 1" }));

  const itens = screen.getAllByRole("listitem");
  expect(itens).toHaveLength(1);
  expect(within(itens[0]).getByText("Adotado")).toBeInTheDocument();
});

test("mostra o aviso mandado pela tela anterior", async () => {
  abrir({ aviso: "Mingau foi publicado e já aparece na vitrine." });

  expect(
    await screen.findByText("Mingau foi publicado e já aparece na vitrine."),
  ).toBeInTheDocument();
});

test("sem animais, convida a cadastrar o primeiro", async () => {
  simular(resposta(200, []));
  abrir();

  expect(
    await screen.findByText("Você ainda não cadastrou nenhum animal."),
  ).toBeInTheDocument();
  expect(
    screen.getByRole("link", { name: "Cadastrar o primeiro" }),
  ).toHaveAttribute("href", "/meus-animais/novo");
});

test("avisa quando não consegue carregar", async () => {
  simular(resposta(500, { status: 500, mensagem: "Erro interno" }));
  abrir();

  expect(await screen.findByRole("alert")).toHaveTextContent(
    "Não foi possível carregar seus animais",
  );
});
