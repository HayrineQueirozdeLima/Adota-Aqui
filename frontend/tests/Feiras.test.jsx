import { fireEvent, render, screen, waitFor, within } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { AuthProvider } from "../src/contexts/AuthContext";
import { feirasExemplo } from "../src/mocks/feiras";
import Feiras from "../src/pages/Feiras/Feiras";
import { paginaDe, resposta, simularApi } from "./utils/apiFalsa";

// Feiras de adoção (/feiras). A API é quem filtra e põe em ordem:
// aqui o teste confere os parâmetros, o que aparece na tela e o que só o abrigo vê

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

// responder recebe os parâmetros da busca ({ estado: "RO" }) e devolve a resposta.
// apagar recebe o id da feira e devolve a resposta do DELETE
function simularFeiras(responder = () => resposta(200, paginaDe(feirasExemplo)), apagar) {
  simularApi({
    outras: (metodo, caminho) => {
      if (caminho === "/api/feiras" && metodo === "GET") {
        const url = new URL(fetch.mock.calls.at(-1)[0]);
        return responder(Object.fromEntries(url.searchParams));
      }
      const feira = caminho.match(/^\/api\/feiras\/([^/]+)$/);
      if (feira && metodo === "DELETE") return apagar(feira[1]);
      return undefined;
    },
  });
}

const buscas = () =>
  fetch.mock.calls
    .map(([url]) => new URL(url))
    .filter((url) => url.pathname === "/api/feiras")
    .map((url) => Object.fromEntries(url.searchParams));

function abrir(estado) {
  render(
    <MemoryRouter initialEntries={[{ pathname: "/feiras", state: estado }]}>
      <AuthProvider>
        <Feiras />
      </AuthProvider>
    </MemoryRouter>,
  );
}

async function titulosNaTela() {
  const titulos = await screen.findAllByRole("heading", { level: 2 });
  return titulos.map((titulo) => titulo.textContent);
}

afterEach(() => {
  localStorage.clear();
  document.title = "";
});

test("visitante vê as próximas feiras de todo o Brasil, com como chegar e a agenda", async () => {
  simularFeiras();
  abrir();

  expect(await titulosNaTela()).toEqual([
    "Feira de adoção do Parque da Cidade",
    "Feirinha de gatos",
  ]);
  expect(document.title).toBe("Feiras de adoção | Adota Aqui");
  expect(buscas()).toEqual([{}]);

  const parque = screen.getAllByRole("article")[0];
  expect(within(parque).getByText("Sábado, 16 de março, das 9h às 13h")).toBeInTheDocument();
  expect(
    within(parque).getByText("Parque da Cidade, Avenida Jorge Teixeira, 1000, Embratel, Porto Velho/RO"),
  ).toBeInTheDocument();
  expect(within(parque).getByText("Organizada por Instituto Quatro Patas")).toBeInTheDocument();
  expect(
    within(parque).getByRole("link", { name: "Como chegar (abre em outra aba)" }),
  ).toHaveAttribute("target", "_blank");
  expect(
    within(parque).getByRole("link", { name: "Adicionar à agenda (abre em outra aba)" }).href,
  ).toContain("calendar.google.com");

  // Só o abrigo divulga e só quem divulgou mexe na feira
  expect(screen.queryByRole("link", { name: "Divulgar uma feira" })).not.toBeInTheDocument();
  expect(screen.queryByRole("button", { name: "Apagar" })).not.toBeInTheDocument();
  expect(screen.getByRole("link", { name: "Entre com a conta do abrigo" })).toHaveAttribute("href", "/login");
  expect(screen.getByText("2 feiras encontradas")).toBeInTheDocument();
});

test("quem está logado já vê as feiras do próprio estado, numa busca só", async () => {
  entrarComo("USUARIO");
  simularFeiras();
  abrir();

  await titulosNaTela();
  expect(screen.getByLabelText("Estado")).toHaveValue("RO");
  expect(buscas()).toEqual([{ estado: "RO" }]);
});

test("filtra pela cidade depois que a pessoa para de digitar, e limpa os filtros", async () => {
  simularFeiras((parametros) =>
    resposta(200, paginaDe(parametros.cidade ? [feirasExemplo[1]] : feirasExemplo)),
  );
  abrir();
  await titulosNaTela();

  fireEvent.change(screen.getByLabelText("Cidade"), { target: { value: "santo" } });
  await waitFor(() => expect(buscas().at(-1)).toEqual({ cidade: "santo" }));
  expect(await titulosNaTela()).toEqual(["Feirinha de gatos"]);

  fireEvent.click(screen.getByRole("button", { name: "Limpar filtros" }));
  await waitFor(() => expect(buscas().at(-1)).toEqual({}));
  expect(screen.getByLabelText("Cidade")).toHaveValue("");
});

test("sem feira no estado escolhido, avisa e oferece ver as de todo o Brasil", async () => {
  simularFeiras((parametros) => resposta(200, paginaDe(parametros.estado ? [] : feirasExemplo)));
  abrir();
  await titulosNaTela();

  fireEvent.change(screen.getByLabelText("Estado"), { target: { value: "AC" } });

  expect(await screen.findByText("Nenhuma feira marcada em Acre por enquanto.")).toBeInTheDocument();
  fireEvent.click(screen.getByRole("button", { name: "Ver feiras de todo o Brasil" }));
  expect(await titulosNaTela()).toHaveLength(2);
});

test("se a API falhar, deixa tentar de novo", async () => {
  let falhar = true;
  simularFeiras(() => (falhar ? resposta(500, {}) : resposta(200, paginaDe(feirasExemplo))));
  abrir();

  expect(await screen.findByRole("alert")).toHaveTextContent("Não foi possível carregar as feiras.");
  falhar = false;
  fireEvent.click(screen.getByRole("button", { name: "Tentar de novo" }));
  expect(await titulosNaTela()).toHaveLength(2);
});

describe("abrigo", () => {
  const minha = { ...feirasExemplo[0], ehMinha: true };

  test("vê o botão de divulgar e pode apagar a própria feira, depois de confirmar", async () => {
    entrarComo("ABRIGO");
    let apagada = null;
    simularFeiras(
      () => resposta(200, paginaDe([minha, feirasExemplo[1]])),
      (id) => {
        apagada = id;
        return resposta(204, null);
      },
    );
    abrir();
    await titulosNaTela();

    expect(screen.getByRole("link", { name: "Divulgar uma feira" })).toHaveAttribute("href", "/feiras/nova");
    // Só a feira dele tem editar e apagar
    expect(screen.getAllByRole("button", { name: "Apagar" })).toHaveLength(1);
    expect(screen.getByRole("link", { name: "Editar" })).toHaveAttribute("href", "/feiras/f1/editar");

    fireEvent.click(screen.getByRole("button", { name: "Apagar" }));
    fireEvent.click(screen.getByRole("button", { name: "Não apagar" }));
    expect(apagada).toBeNull();

    fireEvent.click(screen.getByRole("button", { name: "Apagar" }));
    fireEvent.click(screen.getByRole("button", { name: "Sim, apagar" }));

    expect(
      await screen.findByText('A feira "Feira de adoção do Parque da Cidade" foi apagada.'),
    ).toBeInTheDocument();
    expect(apagada).toBe("f1");
    expect(await titulosNaTela()).toEqual(["Feirinha de gatos"]);
  });

  test("se não der pra apagar, a mensagem aparece no card", async () => {
    entrarComo("ABRIGO");
    simularFeiras(
      () => resposta(200, paginaDe([minha])),
      () => resposta(403, { mensagem: "Somente o abrigo que divulgou pode alterar ou apagar a feira" }),
    );
    abrir();
    await titulosNaTela();

    fireEvent.click(screen.getByRole("button", { name: "Apagar" }));
    fireEvent.click(screen.getByRole("button", { name: "Sim, apagar" }));

    expect(await screen.findByRole("alert")).toHaveTextContent(
      "Somente o abrigo que divulgou pode alterar ou apagar a feira",
    );
    expect(await titulosNaTela()).toHaveLength(1);
  });

  test("mostra o aviso que o formulário mandou", async () => {
    entrarComo("ABRIGO");
    simularFeiras();
    abrir({ aviso: "As alterações na feira foram salvas." });

    expect(screen.getByText("As alterações na feira foram salvas.")).toBeInTheDocument();
    await titulosNaTela();
  });
});
