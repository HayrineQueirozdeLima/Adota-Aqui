import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { MemoryRouter, useLocation } from "react-router-dom";
import { AuthProvider } from "../src/contexts/AuthContext";
import Clinicas from "../src/pages/Clinicas/Clinicas";
import { resposta, simularApi } from "./utils/apiFalsa";

// Clínicas veterinárias perto de você (/clinicas). O mapa é do Google:
// aqui o teste confere de onde a página tira o lugar e o endereço que ela monta pro mapa

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

// Mostra o endereço da página, pra conferir o que foi pra URL
function Endereco() {
  const { pathname, search } = useLocation();
  return <p data-testid="endereco">{pathname + search}</p>;
}

function abrir(endereco = "/clinicas") {
  render(
    <MemoryRouter initialEntries={[endereco]}>
      <AuthProvider>
        <Clinicas />
        <Endereco />
      </AuthProvider>
    </MemoryRouter>,
  );
}

// O jsdom não tem localização. Cada teste que precisa dela escolhe a resposta do navegador
function simularLocalizacao(responder) {
  Object.defineProperty(navigator, "geolocation", {
    configurable: true,
    value: { getCurrentPosition: jest.fn(responder) },
  });
}

const mapa = () => screen.queryByTitle(/^Mapa:/);
const buscaDoMapa = () => new URL(mapa().src).searchParams.get("q");

beforeEach(() => {
  simularApi();
});

afterEach(() => {
  localStorage.clear();
  delete navigator.geolocation;
  document.title = "";
});

test("sem lugar escolhido, mostra onde o mapa vai aparecer", () => {
  abrir();

  expect(
    screen.getByRole("heading", {
      level: 1,
      name: "Clínicas veterinárias perto de você",
    }),
  ).toBeInTheDocument();
  expect(document.title).toBe("Clínicas veterinárias | Adota Aqui");
  expect(screen.getByText("O mapa aparece aqui")).toBeInTheDocument();
  expect(mapa()).not.toBeInTheDocument();
  expect(
    screen.getByText(/não indica nem avalia clínicas/),
  ).toBeInTheDocument();
  // Navegador sem localização: o botão nem aparece
  expect(
    screen.queryByRole("button", { name: "Usar minha localização" }),
  ).not.toBeInTheDocument();
  // Visitante: não busca perfil nenhum
  expect(fetch).not.toHaveBeenCalled();
});

test("pela cidade digitada, mostra o mapa e guarda a cidade na URL", () => {
  abrir();

  fireEvent.change(screen.getByLabelText("Cidade"), {
    target: { value: "  Porto Velho " },
  });
  fireEvent.change(screen.getByLabelText("Estado"), {
    target: { value: "RO" },
  });
  fireEvent.click(screen.getByRole("button", { name: "Ver clínicas" }));

  // O foco vai pro título do mapa, que diz o lugar novo
  expect(
    screen.getByRole("heading", {
      level: 2,
      name: "Clínicas veterinárias perto de Porto Velho/RO",
    }),
  ).toHaveFocus();
  expect(buscaDoMapa()).toBe("clínica veterinária em Porto Velho RO");
  expect(screen.getByTestId("endereco")).toHaveTextContent(
    "/clinicas?cidade=Porto+Velho&estado=RO",
  );

  const noGoogle = screen.getByRole("link", {
    name: "Abrir no Google Maps (abre em outra aba)",
  });
  expect(noGoogle).toHaveAttribute("target", "_blank");
  expect(new URL(noGoogle.href).searchParams.get("query")).toBe(
    "clínica veterinária em Porto Velho RO",
  );
});

test("sem cidade ou sem estado, avisa e leva o foco pro campo", () => {
  abrir();

  fireEvent.click(screen.getByRole("button", { name: "Ver clínicas" }));

  expect(screen.getByText("Digite a cidade")).toBeInTheDocument();
  expect(screen.getByText("Escolha o estado")).toBeInTheDocument();
  expect(screen.getByLabelText("Cidade")).toHaveFocus();
  expect(mapa()).not.toBeInTheDocument();

  // Corrigiu o campo, a mensagem dele some
  fireEvent.change(screen.getByLabelText("Cidade"), {
    target: { value: "Recife" },
  });
  expect(screen.queryByText("Digite a cidade")).not.toBeInTheDocument();
  expect(screen.getByText("Escolha o estado")).toBeInTheDocument();
});

test("o atendimento 24 horas muda a busca do mapa", () => {
  abrir("/clinicas?cidade=Recife&estado=PE");

  fireEvent.click(screen.getByRole("button", { name: "Atendimento 24 horas" }));

  expect(
    screen.getByRole("button", { name: "Atendimento 24 horas" }),
  ).toHaveAttribute("aria-pressed", "true");
  expect(
    screen.getByRole("heading", {
      level: 2,
      name: "Atendimento 24 horas perto de Recife/PE",
    }),
  ).toBeInTheDocument();
  expect(buscaDoMapa()).toBe("clínica veterinária 24 horas em Recife PE");
});

test("chegando do perfil do animal, já abre na cidade dele", () => {
  entrarComo("USUARIO");
  abrir("/clinicas?cidade=Campinas&estado=sp");

  expect(buscaDoMapa()).toBe("clínica veterinária em Campinas SP");
  expect(screen.getByLabelText("Cidade")).toHaveValue("Campinas");
  expect(screen.getByLabelText("Estado")).toHaveValue("SP");
  // A cidade da URL vale mais que a do perfil, então o perfil nem é buscado
  expect(fetch).not.toHaveBeenCalled();
});

test("estado que não existe na URL é ignorado", () => {
  abrir("/clinicas?cidade=Campinas&estado=XX");

  expect(screen.getByText("O mapa aparece aqui")).toBeInTheDocument();
});

test("quem está logado já vê as clínicas da cidade do perfil", async () => {
  entrarComo("ABRIGO");
  abrir();

  expect(
    await screen.findByRole("heading", {
      level: 2,
      name: "Clínicas veterinárias perto de Santo André/SP",
    }),
  ).toBeInTheDocument();
  expect(screen.getByLabelText("Cidade")).toHaveValue("Santo André");
  const [url, opcoes] = fetch.mock.calls[0];
  expect(new URL(url).pathname).toBe("/api/abrigos/me");
  expect(opcoes.headers.Authorization).toBe("Bearer token-de-teste");
});

test("sessão vencida ao buscar o perfil sai da conta e a página continua", async () => {
  entrarComo("USUARIO");
  simularApi({
    outras: (metodo, caminho) =>
      caminho === "/api/usuarios/me" ? resposta(401, {}) : undefined,
  });
  abrir();

  await waitFor(() => expect(localStorage.getItem(CHAVE)).toBeNull());
  expect(screen.getByText("O mapa aparece aqui")).toBeInTheDocument();
});

test("pela localização, mostra as clínicas perto e não põe o ponto na URL", () => {
  simularLocalizacao((deuCerto) =>
    deuCerto({ coords: { latitude: -23.550512, longitude: -46.633308 } }),
  );
  abrir("/clinicas?cidade=Recife&estado=PE");

  // Apagou a cidade e tentou buscar: a mensagem some quando a localização dá certo
  fireEvent.change(screen.getByLabelText("Cidade"), { target: { value: "" } });
  fireEvent.click(screen.getByRole("button", { name: "Ver clínicas" }));
  expect(screen.getByText("Digite a cidade")).toBeInTheDocument();

  fireEvent.click(screen.getByRole("button", { name: "Usar minha localização" }));
  expect(screen.queryByText("Digite a cidade")).not.toBeInTheDocument();

  expect(
    screen.getByRole("heading", {
      level: 2,
      name: "Clínicas veterinárias perto de você",
    }),
  ).toBeInTheDocument();
  expect(buscaDoMapa()).toBe("clínica veterinária perto de -23.551,-46.633");
  expect(screen.getByTestId("endereco")).toHaveTextContent(/^\/clinicas$/);
});

test("localização negada: explica e deixa digitar a cidade", () => {
  simularLocalizacao((deuCerto, deuErrado) => deuErrado({ code: 1 }));
  abrir();

  fireEvent.click(screen.getByRole("button", { name: "Usar minha localização" }));

  expect(screen.getByRole("alert")).toHaveTextContent(
    "O navegador não deixou usar sua localização",
  );
  expect(screen.getByText("O mapa aparece aqui")).toBeInTheDocument();
  expect(
    screen.getByRole("button", { name: "Usar minha localização" }),
  ).toBeEnabled();
});

test("localização que demora demais ou falha: pede pra tentar de novo", () => {
  simularLocalizacao((deuCerto, deuErrado) => deuErrado({ code: 3 }));
  abrir();

  fireEvent.click(screen.getByRole("button", { name: "Usar minha localização" }));

  expect(screen.getByRole("alert")).toHaveTextContent(
    "Não foi possível descobrir sua localização agora",
  );
});
