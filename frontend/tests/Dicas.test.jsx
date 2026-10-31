import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { AuthProvider } from "../src/contexts/AuthContext";
import { dicasExemplo } from "../src/mocks/dicas";
import Dicas from "../src/pages/Dicas/Dicas";
import { paginaDe, resposta, simularApi } from "./utils/apiFalsa";

// Blog de dicas, em /dicas: qualquer pessoa lê, protetor escreve

const CHAVE = "adotaaqui.sessao";

function entrar(tipoConta = "USUARIO") {
  localStorage.setItem(
    CHAVE,
    JSON.stringify({
      token: "token-de-teste",
      tipoConta,
      id: "u1",
      nome: "Maria Pinheiro",
      expiraEm: "2999-01-01T00:00:00Z",
    }),
  );
}

// "responder" recebe os parâmetros da busca. "minhas" é a resposta do GET /api/dicas/minhas
function simular({ responder, minhas } = {}) {
  simularApi({
    outras: (metodo, caminho) => {
      if (caminho === "/api/dicas/minhas" && minhas) return resposta(200, minhas);
      if (caminho === "/api/dicas" && responder) {
        const chamada = fetch.mock.calls.findLast(([url]) => new URL(url).pathname === "/api/dicas");
        return responder(new URL(chamada[0]).searchParams);
      }
      return undefined;
    },
  });
}

function abrir(estado) {
  render(
    <MemoryRouter initialEntries={[{ pathname: "/dicas", state: estado }]}>
      <AuthProvider>
        <Dicas />
      </AuthProvider>
    </MemoryRouter>,
  );
}

afterEach(() => {
  localStorage.clear();
  document.title = "";
});

test("mostra as dicas com o assunto, o começo do texto e quem escreveu, e o título leva pra dica", async () => {
  simular();
  abrir();

  const titulo = await screen.findByRole("link", { name: "Os primeiros dias do gato em casa" });
  expect(titulo).toHaveAttribute("href", `/dicas/${dicasExemplo[0].id}`);
  expect(screen.getByRole("heading", { level: 2, name: "Vacinas e vermífugo no primeiro ano" })).toBeInTheDocument();
  expect(screen.getByText(dicasExemplo[1].resumo)).toBeInTheDocument();
  expect(screen.getAllByText("Saúde e vacinas").length).toBeGreaterThan(0);
  expect(screen.getByText("2 dicas")).toHaveAttribute("role", "status");
  expect(screen.queryByRole("link", { name: "Escrever uma dica" })).not.toBeInTheDocument();
  expect(document.title).toBe("Dicas pra adotar e cuidar | Adota Aqui");
});

test("o assunto escolhido vai pra busca e, sem dica dele, avisa", async () => {
  simular({
    responder: (parametros) =>
      parametros.get("categoria") === "ALIMENTACAO"
        ? resposta(200, paginaDe([]))
        : resposta(200, paginaDe(dicasExemplo)),
  });
  abrir();
  await screen.findByText("2 dicas");

  fireEvent.click(screen.getByRole("button", { name: "Alimentação" }));

  expect(await screen.findByText("Ainda não tem dica sobre esse assunto.")).toBeInTheDocument();
  expect(screen.getByRole("button", { name: "Alimentação" })).toHaveAttribute("aria-pressed", "true");
});

test("sem nenhuma dica, avisa", async () => {
  simular({ responder: () => resposta(200, paginaDe([])) });
  abrir();

  expect(await screen.findByText("Ainda não tem nenhuma dica por aqui.")).toBeInTheDocument();
});

test("protetor vê o Escrever uma dica e as dicas que ele mesmo escreveu", async () => {
  entrar();
  simular({ minhas: { podePublicar: true, dicas: [dicasExemplo[1]] } });
  abrir();

  expect(await screen.findByRole("link", { name: "Escrever uma dica" })).toHaveAttribute("href", "/dicas/nova");
  fireEvent.click(await screen.findByRole("button", { name: "Escritas por mim" }));

  expect(await screen.findByText("1 dica")).toBeInTheDocument();
  expect(screen.getByRole("link", { name: "Vacinas e vermífugo no primeiro ano" })).toBeInTheDocument();
  expect(screen.queryByRole("link", { name: "Os primeiros dias do gato em casa" })).not.toBeInTheDocument();
});

test("conta que ainda não cadastrou animal não vê o Escrever uma dica", async () => {
  entrar();
  simular();
  abrir();

  await screen.findByText("2 dicas");
  await waitFor(() => expect(fetch).toHaveBeenCalledWith(expect.stringContaining("/api/dicas/minhas"), expect.anything()));
  expect(screen.queryByRole("link", { name: "Escrever uma dica" })).not.toBeInTheDocument();
  expect(screen.queryByRole("button", { name: "Escritas por mim" })).not.toBeInTheDocument();
});

test("mostra o aviso que veio de outra tela", async () => {
  simular();
  abrir({ aviso: 'A dica "Teste" foi apagada.' });

  expect(screen.getByText('A dica "Teste" foi apagada.')).toHaveAttribute("role", "status");
  await screen.findByText("2 dicas");
});

test("se a API falhar, avisa e deixa tentar de novo", async () => {
  let tentativas = 0;
  simular({
    responder: () => {
      tentativas += 1;
      return tentativas === 1
        ? resposta(500, { status: 500, mensagem: "Erro interno" })
        : resposta(200, paginaDe(dicasExemplo));
    },
  });
  abrir();

  expect(await screen.findByRole("alert")).toHaveTextContent("Não foi possível carregar as dicas.");
  fireEvent.click(screen.getByRole("button", { name: "Tentar de novo" }));
  expect(await screen.findByText("2 dicas")).toBeInTheDocument();
});

test("o Ver mais dicas traz a próxima página e leva o foco pro título da primeira dica nova", async () => {
  const terceira = { ...dicasExemplo[1], id: "d3", titulo: "Como apresentar o cão ao gato" };
  simular({
    responder: (parametros) =>
      parametros.get("pagina") === "1"
        ? resposta(200, paginaDe([dicasExemplo[1], terceira], { pagina: 1, tamanho: 2, totalItens: 3 }))
        : resposta(200, paginaDe(dicasExemplo, { tamanho: 2, totalItens: 3 })),
  });
  abrir();

  expect(await screen.findByText("Mostrando 2 de 3 dicas")).toBeInTheDocument();
  fireEvent.click(screen.getByRole("button", { name: "Ver mais dicas" }));

  const nova = await screen.findByRole("link", { name: "Como apresentar o cão ao gato" });
  await waitFor(() => expect(document.activeElement).toBe(nova));
  // a dica repetida da página anterior não entra duas vezes
  expect(screen.getAllByRole("link", { name: "Vacinas e vermífugo no primeiro ano" })).toHaveLength(1);
  expect(screen.queryByRole("button", { name: "Ver mais dicas" })).not.toBeInTheDocument();
});

test("se a próxima página falhar, avisa e mantém o botão", async () => {
  simular({
    responder: (parametros) =>
      parametros.get("pagina") === "1"
        ? resposta(500, { status: 500, mensagem: "Erro interno" })
        : resposta(200, paginaDe(dicasExemplo, { tamanho: 2, totalItens: 3 })),
  });
  abrir();

  fireEvent.click(await screen.findByRole("button", { name: "Ver mais dicas" }));

  expect(await screen.findByRole("alert")).toHaveTextContent("Não foi possível carregar mais dicas.");
  expect(screen.getByRole("button", { name: "Ver mais dicas" })).toBeEnabled();
});
