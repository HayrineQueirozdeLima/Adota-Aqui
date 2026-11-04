import {
  fireEvent,
  render,
  screen,
  waitFor,
  within,
} from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { AuthProvider } from "../src/contexts/AuthContext";
import { protetoresExemplo } from "../src/mocks/protetores";
import Protetores from "../src/pages/Protetores/Protetores";
import { paginaDe, resposta, simularApi } from "./utils/apiFalsa";

// Página de abrigos e protetores (link do rodapé), em /protetores. Aberta pra qualquer pessoa.
// A API é quem filtra e põe em ordem: aqui o teste confere os parâmetros e o que aparece na tela

const CHAVE = "adotaaqui.sessao";

function entrarComo(tipoConta) {
  localStorage.setItem(
    CHAVE,
    JSON.stringify({
      token: "token-de-teste",
      tipoConta,
      id: "1",
      nome: "Marina Prado",
      expiraEm: "2999-01-01T00:00:00Z",
    }),
  );
}

// responder recebe os parâmetros da busca ({ tipo: "ABRIGO" }) e devolve a resposta
function simularProtetores(responder) {
  simularApi({
    outras: (metodo, caminho) => {
      if (caminho !== "/api/protetores") return undefined;
      const url = new URL(fetch.mock.calls.at(-1)[0]);
      return responder(Object.fromEntries(url.searchParams));
    },
  });
}

function abrir() {
  render(
    <MemoryRouter>
      <AuthProvider>
        <Protetores />
      </AuthProvider>
    </MemoryRouter>,
  );
}

const buscas = () =>
  fetch.mock.calls
    .map(([url]) => new URL(url))
    .filter((url) => url.pathname === "/api/protetores")
    .map((url) => Object.fromEntries(url.searchParams));

async function nomesNaTela() {
  const titulos = await screen.findAllByRole("heading", { level: 2 });
  return titulos.map((titulo) => titulo.textContent);
}

beforeEach(() => {
  simularApi();
});

afterEach(() => {
  localStorage.clear();
  sessionStorage.clear();
  document.title = "";
});

test("mostra cada abrigo e protetor com o tipo, a cidade e as contagens, na ordem da API", async () => {
  abrir();

  expect(await nomesNaTela()).toEqual([
    "Instituto Quatro Patas",
    "Maria Pinheiro",
    "Recanto dos Bigodes",
  ]);
  const abrigo = screen
    .getByRole("heading", { level: 2, name: "Instituto Quatro Patas" })
    .closest("article");
  expect(within(abrigo).getByText("Abrigo")).toBeInTheDocument();
  expect(within(abrigo).getByText("Porto Velho/RO")).toBeInTheDocument();
  expect(within(abrigo).getByText("5 animais para adoção")).toBeInTheDocument();
  expect(within(abrigo).getByText("3 adoções pelo site")).toBeInTheDocument();

  const pessoa = screen
    .getByRole("heading", { level: 2, name: "Maria Pinheiro" })
    .closest("article");
  expect(within(pessoa).getByText("Protetor independente")).toBeInTheDocument();
  expect(within(pessoa).getByText("1 animal para adoção")).toBeInTheDocument();
  expect(within(pessoa).getByText("1 adoção pelo site")).toBeInTheDocument();

  const semAnimais = screen
    .getByRole("heading", { level: 2, name: "Recanto dos Bigodes" })
    .closest("article");
  expect(
    within(semAnimais).getByText("Nenhum animal para adoção agora"),
  ).toBeInTheDocument();
  expect(
    within(semAnimais).getByText("Nenhuma adoção pelo site ainda"),
  ).toBeInTheDocument();

  expect(
    screen.getByText("3 abrigos e protetores encontrados"),
  ).toHaveAttribute("role", "status");
  expect(document.title).toBe("Abrigos e protetores | Adota Aqui");
  // Na primeira busca não vai filtro nenhum
  expect(buscas()).toEqual([{}]);
});

test("o Ver animais abre a vitrine buscando pelo nome do protetor, e só aparece pra quem tem animal", async () => {
  abrir();
  await nomesNaTela();

  expect(
    screen.getByRole("link", { name: "Ver animais de Instituto Quatro Patas" }),
  ).toHaveAttribute("href", "/animais?busca=Instituto%20Quatro%20Patas");
  expect(
    screen.getByRole("link", { name: "Ver animais de Maria Pinheiro" }),
  ).toHaveAttribute("href", "/animais?busca=Maria%20Pinheiro");
  expect(
    screen.queryByRole("link", { name: "Ver animais de Recanto dos Bigodes" }),
  ).not.toBeInTheDocument();
});

test("manda o tipo, o estado, a cidade e o nome como parâmetros", async () => {
  abrir();
  await nomesNaTela();

  fireEvent.click(screen.getByRole("button", { name: "Abrigos" }));
  fireEvent.change(screen.getByLabelText("Estado"), {
    target: { value: "RO" },
  });
  fireEvent.change(screen.getByLabelText("Cidade"), {
    target: { value: "porto velho" },
  });
  fireEvent.change(screen.getByLabelText("Buscar pelo nome"), {
    target: { value: "quatro" },
  });

  await waitFor(() =>
    expect(buscas().at(-1)).toEqual({
      tipo: "ABRIGO",
      estado: "RO",
      cidade: "porto velho",
      busca: "quatro",
    }),
  );
  // a primeira busca (ao abrir) + uma só pras quatro mudanças seguidas
  expect(buscas()).toHaveLength(2);
  expect(screen.getByRole("button", { name: "Abrigos" })).toHaveAttribute(
    "aria-pressed",
    "true",
  );
});

test("o filtro de protetores independentes manda o tipo USUARIO, e Todos tira o filtro", async () => {
  abrir();
  await nomesNaTela();

  fireEvent.click(
    screen.getByRole("button", { name: "Protetores independentes" }),
  );
  await waitFor(() => expect(buscas().at(-1)).toEqual({ tipo: "USUARIO" }));

  fireEvent.click(screen.getByRole("button", { name: "Todos" }));
  await waitFor(() => expect(buscas()).toHaveLength(3));
  expect(buscas().at(-1)).toEqual({});
});

test("sem resultado com filtro, avisa e deixa ver todos de novo", async () => {
  simularProtetores((parametros) =>
    resposta(200, paginaDe(parametros.busca ? [] : protetoresExemplo)),
  );
  abrir();
  await nomesNaTela();

  fireEvent.change(screen.getByLabelText("Buscar pelo nome"), {
    target: { value: "ninguem" },
  });
  expect(
    await screen.findByText(
      "Nenhum resultado encontrado com essas informações.",
    ),
  ).toBeInTheDocument();
  expect(
    screen.getByText("Nenhum abrigo ou protetor encontrado"),
  ).toBeInTheDocument();

  fireEvent.click(screen.getByRole("button", { name: "Ver todos" }));
  expect(await nomesNaTela()).toHaveLength(3);
  expect(buscas().at(-1)).toEqual({});
  expect(screen.getByLabelText("Buscar pelo nome")).toHaveValue("");
});

test("sem ninguém cadastrado, explica que a lista começa vazia", async () => {
  simularProtetores(() => resposta(200, paginaDe([])));
  abrir();

  expect(
    await screen.findByText(
      "Ainda não tem nenhum abrigo ou protetor por aqui.",
    ),
  ).toBeInTheDocument();
  expect(
    screen.queryByRole("button", { name: "Ver todos" }),
  ).not.toBeInTheDocument();
});

test("avisa quando a API falha e deixa tentar de novo", async () => {
  let falhas = 1;
  simularProtetores(() => {
    if (falhas > 0) {
      falhas -= 1;
      return resposta(500, { status: 500, mensagem: "Erro interno" });
    }
    return resposta(200, paginaDe(protetoresExemplo));
  });
  abrir();

  expect(await screen.findByRole("alert")).toHaveTextContent(
    "Não foi possível carregar os abrigos e protetores.",
  );
  fireEvent.click(screen.getByRole("button", { name: "Tentar de novo" }));
  expect(await nomesNaTela()).toHaveLength(3);
});

test("o Ver mais traz a próxima página e leva o foco pro primeiro card novo", async () => {
  const proximos = [
    {
      ...protetoresExemplo[0],
      id: "b7c8d9e0-0000-4000-8000-000000000004",
      nome: "Santuário Rabo Feliz",
    },
  ];
  simularProtetores((parametros) =>
    parametros.pagina === "1"
      ? resposta(
          200,
          paginaDe(proximos, { pagina: 1, tamanho: 3, totalItens: 4 }),
        )
      : resposta(
          200,
          paginaDe(protetoresExemplo, { tamanho: 3, totalItens: 4 }),
        ),
  );
  abrir();
  await nomesNaTela();
  expect(screen.getByText("Mostrando 3 de 4")).toBeInTheDocument();

  fireEvent.click(screen.getByRole("button", { name: "Ver mais" }));

  const novo = await screen.findByRole("heading", {
    level: 2,
    name: "Santuário Rabo Feliz",
  });
  expect(buscas().at(-1)).toEqual({ pagina: "1" });
  expect(document.activeElement).toBe(novo.closest("article"));
  // Chegou no fim: o botão some
  expect(
    screen.queryByRole("button", { name: "Ver mais" }),
  ).not.toBeInTheDocument();
});

describe("convite pra aparecer na lista", () => {
  test("visitante é convidado a criar a conta", async () => {
    abrir();
    await nomesNaTela();

    expect(
      screen.getByRole("link", { name: "Crie sua conta" }),
    ).toHaveAttribute("href", "/cadastro");
  });

  test("pessoa logada é convidada a cadastrar o animal que resgatou", async () => {
    entrarComo("USUARIO");
    abrir();
    await nomesNaTela();

    expect(screen.getByRole("link", { name: "Cadastre ele" })).toHaveAttribute(
      "href",
      "/meus-animais/novo",
    );
    expect(
      screen.queryByRole("link", { name: "Crie sua conta" }),
    ).not.toBeInTheDocument();
  });

  test("abrigo logado já aparece na lista e não vê convite", async () => {
    entrarComo("ABRIGO");
    abrir();
    await nomesNaTela();

    expect(
      screen.queryByRole("link", { name: "Crie sua conta" }),
    ).not.toBeInTheDocument();
    expect(
      screen.queryByRole("link", { name: "Cadastre ele" }),
    ).not.toBeInTheDocument();
  });
});
