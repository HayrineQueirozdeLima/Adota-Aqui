import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { AuthProvider } from "../src/contexts/AuthContext";
import { artigosExemplo } from "../src/mocks/artigos";
import Blog from "../src/pages/Blog/Blog";
import { paginaDe, resposta, simularApi } from "./utils/apiFalsa";

// Blog para tutores, em /blog: qualquer pessoa lê, protetor escreve

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

// "responder" recebe os parâmetros da busca. "meus" é a resposta do GET /api/artigos/meus
function simular({ responder, meus } = {}) {
  simularApi({
    outras: (metodo, caminho) => {
      if (caminho === "/api/artigos/meus" && meus) return resposta(200, meus);
      if (caminho === "/api/artigos" && responder) {
        const chamada = fetch.mock.calls.findLast(([url]) => new URL(url).pathname === "/api/artigos");
        return responder(new URL(chamada[0]).searchParams);
      }
      return undefined;
    },
  });
}

function abrir(estado) {
  render(
    <MemoryRouter initialEntries={[{ pathname: "/blog", state: estado }]}>
      <AuthProvider>
        <Blog />
      </AuthProvider>
    </MemoryRouter>,
  );
}

afterEach(() => {
  localStorage.clear();
  document.title = "";
});

test("mostra os artigos com o assunto, o começo do texto e quem escreveu, e o título leva pro artigo", async () => {
  simular();
  abrir();

  const titulo = await screen.findByRole("link", { name: "Os primeiros dias do gato em casa" });
  expect(titulo).toHaveAttribute("href", `/blog/${artigosExemplo[0].id}`);
  expect(screen.getByRole("heading", { level: 2, name: "Vacinas e vermífugo no primeiro ano" })).toBeInTheDocument();
  expect(screen.getByText(artigosExemplo[1].resumo)).toBeInTheDocument();
  expect(screen.getAllByText("Saúde e vacinas").length).toBeGreaterThan(0);
  expect(screen.getByText("2 artigos")).toHaveAttribute("role", "status");
  expect(screen.queryByRole("link", { name: "Escrever um artigo" })).not.toBeInTheDocument();
  expect(document.title).toBe("Blog para tutores | Adota Aqui");
});

test("explica pra que serve o blog e convida o visitante a entrar pra escrever", async () => {
  simular();
  abrir();

  expect(screen.getByRole("region", { name: "Pra que serve este blog" })).toHaveTextContent(
    "A ideia é a comunidade se ajudar.",
  );
  expect(screen.getByRole("link", { name: "Entre na sua conta" })).toHaveAttribute("href", "/login");
  await screen.findByText("2 artigos");
});

test("o assunto escolhido vai pra busca e, sem artigo dele, avisa", async () => {
  simular({
    responder: (parametros) =>
      parametros.get("categoria") === "ALIMENTACAO"
        ? resposta(200, paginaDe([]))
        : resposta(200, paginaDe(artigosExemplo)),
  });
  abrir();
  await screen.findByText("2 artigos");

  fireEvent.click(screen.getByRole("button", { name: "Alimentação" }));

  expect(await screen.findByText("Ainda não tem artigo sobre esse assunto.")).toBeInTheDocument();
  expect(screen.getByRole("button", { name: "Alimentação" })).toHaveAttribute("aria-pressed", "true");
});

test("sem nenhum artigo, avisa", async () => {
  simular({ responder: () => resposta(200, paginaDe([])) });
  abrir();

  expect(await screen.findByText("Ainda não tem nenhum artigo por aqui.")).toBeInTheDocument();
});

test("protetor vê o Escrever um artigo e os artigos que ele mesmo escreveu", async () => {
  entrar();
  simular({ meus: { podePublicar: true, artigos: [artigosExemplo[1]] } });
  abrir();

  expect(await screen.findByRole("link", { name: "Escrever um artigo" })).toHaveAttribute("href", "/blog/novo");
  fireEvent.click(await screen.findByRole("button", { name: "Escritos por mim" }));

  expect(await screen.findByText("1 artigo")).toBeInTheDocument();
  expect(screen.getByRole("link", { name: "Vacinas e vermífugo no primeiro ano" })).toBeInTheDocument();
  expect(screen.queryByRole("link", { name: "Cadastrar um animal" })).not.toBeInTheDocument();
  expect(screen.queryByRole("link", { name: "Os primeiros dias do gato em casa" })).not.toBeInTheDocument();
});

test("conta que ainda não cadastrou animal não vê o Escrever um artigo e é convidada a cadastrar", async () => {
  entrar();
  simular();
  abrir();

  expect(await screen.findByRole("link", { name: "Cadastrar um animal" })).toHaveAttribute(
    "href",
    "/meus-animais/novo",
  );
  await screen.findByText("2 artigos");
  expect(screen.queryByRole("link", { name: "Entre na sua conta" })).not.toBeInTheDocument();
  expect(screen.queryByRole("link", { name: "Escrever um artigo" })).not.toBeInTheDocument();
  expect(screen.queryByRole("button", { name: "Escritos por mim" })).not.toBeInTheDocument();
});

test("mostra o aviso que veio de outra tela", async () => {
  simular();
  abrir({ aviso: 'O artigo "Teste" foi apagado.' });

  expect(screen.getByText('O artigo "Teste" foi apagado.')).toHaveAttribute("role", "status");
  await screen.findByText("2 artigos");
});

test("se a API falhar, avisa e deixa tentar de novo", async () => {
  let tentativas = 0;
  simular({
    responder: () => {
      tentativas += 1;
      return tentativas === 1
        ? resposta(500, { status: 500, mensagem: "Erro interno" })
        : resposta(200, paginaDe(artigosExemplo));
    },
  });
  abrir();

  expect(await screen.findByRole("alert")).toHaveTextContent("Não foi possível carregar os artigos.");
  fireEvent.click(screen.getByRole("button", { name: "Tentar de novo" }));
  expect(await screen.findByText("2 artigos")).toBeInTheDocument();
});

test("o Ver mais artigos traz a próxima página e leva o foco pro título do primeiro artigo novo", async () => {
  const terceiro = { ...artigosExemplo[1], id: "d3", titulo: "Como apresentar o cão ao gato" };
  simular({
    responder: (parametros) =>
      parametros.get("pagina") === "1"
        ? resposta(200, paginaDe([artigosExemplo[1], terceiro], { pagina: 1, tamanho: 2, totalItens: 3 }))
        : resposta(200, paginaDe(artigosExemplo, { tamanho: 2, totalItens: 3 })),
  });
  abrir();

  expect(await screen.findByText("Mostrando 2 de 3 artigos")).toBeInTheDocument();
  fireEvent.click(screen.getByRole("button", { name: "Ver mais artigos" }));

  const novo = await screen.findByRole("link", { name: "Como apresentar o cão ao gato" });
  await waitFor(() => expect(document.activeElement).toBe(novo));
  // o artigo repetido da página anterior não entra duas vezes
  expect(screen.getAllByRole("link", { name: "Vacinas e vermífugo no primeiro ano" })).toHaveLength(1);
  expect(screen.queryByRole("button", { name: "Ver mais artigos" })).not.toBeInTheDocument();
});

test("se a próxima página falhar, avisa e mantém o botão", async () => {
  simular({
    responder: (parametros) =>
      parametros.get("pagina") === "1"
        ? resposta(500, { status: 500, mensagem: "Erro interno" })
        : resposta(200, paginaDe(artigosExemplo, { tamanho: 2, totalItens: 3 })),
  });
  abrir();

  fireEvent.click(await screen.findByRole("button", { name: "Ver mais artigos" }));

  expect(await screen.findByRole("alert")).toHaveTextContent("Não foi possível carregar mais artigos.");
  expect(screen.getByRole("button", { name: "Ver mais artigos" })).toBeEnabled();
});
