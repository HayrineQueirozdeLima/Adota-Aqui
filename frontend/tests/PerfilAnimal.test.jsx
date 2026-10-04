import { fireEvent, render, screen } from "@testing-library/react";
import { MemoryRouter, Route, Routes } from "react-router-dom";
import { AuthProvider } from "../src/contexts/AuthContext";
import { perfilExemplo } from "../src/mocks/animais";
import PerfilAnimal from "../src/pages/PerfilAnimal/PerfilAnimal";
import { resposta, simularApi } from "./utils/apiFalsa";

// A API diz o que a pessoa pode fazer (ehMeu, podeDemonstrarInteresse, meuInteresse).
// O teste confere que a tela mostra a ação certa pra cada caso e que monta a ficha a partir da resposta.

const CHAVE = "adotaaqui.sessao";
const ID = perfilExemplo.id;

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

// Simula o perfil com algumas mudanças em cima do exemplo
function perfilCom(mudancas) {
  simularApi({
    responderAnimal: (id) =>
      resposta(200, { ...perfilExemplo, id, ...mudancas }),
  });
}

function abrir(id = ID) {
  render(
    <MemoryRouter initialEntries={[`/animais/${id}`]}>
      <AuthProvider>
        <Routes>
          <Route path="/animais/:id" element={<PerfilAnimal />} />
        </Routes>
      </AuthProvider>
    </MemoryRouter>,
  );
}

async function esperarFicha() {
  await screen.findByRole("heading", { level: 1, name: "Mel" });
}

beforeEach(() => {
  simularApi();
});

afterEach(() => {
  localStorage.clear();
  sessionStorage.clear();
});

describe("ficha do animal", () => {
  test("monta a ficha com os dados da API", async () => {
    abrir();
    await esperarFicha();

    expect(fetch).toHaveBeenCalledWith(
      `http://api.teste/api/animais/${ID}`,
      expect.anything(),
    );
    expect(screen.getByText("Disponível")).toBeInTheDocument();
    expect(screen.getByText("Sem raça definida")).toBeInTheDocument();
    expect(screen.getByText("14 kg")).toBeInTheDocument();
    expect(screen.getByText("Castrada")).toBeInTheDocument();
    expect(screen.getByText("Crianças: convive bem")).toBeInTheDocument();
    expect(screen.getByText("Mais animada")).toBeInTheDocument();
    expect(screen.getByText("2ª dose · 12/03/2026")).toBeInTheDocument();
    expect(
      screen.getByRole("heading", { name: "A história da Mel" }),
    ).toBeInTheDocument();
    expect(screen.getByText("Protetor · Santo André/SP")).toBeInTheDocument();
  });

  test("a galeria troca a foto grande ao clicar na miniatura", async () => {
    abrir();
    await esperarFicha();

    expect(screen.getByAltText("Foto 1 de 3 de Mel")).toHaveAttribute(
      "src",
      perfilExemplo.fotos[0],
    );
    fireEvent.click(screen.getByRole("button", { name: "Ver foto 3 de 3" }));
    expect(screen.getByAltText("Foto 3 de 3 de Mel")).toHaveAttribute(
      "src",
      perfilExemplo.fotos[2],
    );
  });

  test("sem fotos e sem vacinas, mostra o espaço da foto e esconde a vacinação", async () => {
    perfilCom({ fotos: [], vacinas: [] });
    abrir();
    await esperarFicha();

    expect(screen.getByText("foto · Mel")).toBeInTheDocument();
    expect(
      screen.queryByRole("heading", { name: "Histórico de vacinação" }),
    ).not.toBeInTheDocument();
  });
});

describe("o que cada pessoa pode fazer", () => {
  test("visitante vê o botão, que leva pro fluxo de interesse (e ele pede login)", async () => {
    abrir();
    await esperarFicha();

    expect(
      screen.getByRole("link", { name: "Quero conhecer Mel" }),
    ).toHaveAttribute("href", `/animais/${ID}/interesse`);
    expect(
      screen.getByText("Pra continuar, você vai entrar ou criar sua conta."),
    ).toBeInTheDocument();
  });

  test("Usuario que pode adotar vê o botão, e a busca vai com o token", async () => {
    entrarComo("USUARIO");
    perfilCom({ podeDemonstrarInteresse: true });
    abrir();
    await esperarFicha();

    expect(
      screen.getByRole("link", { name: "Quero conhecer Mel" }),
    ).toBeInTheDocument();
    const [, opcoes] = fetch.mock.calls[0];
    expect(opcoes.headers.Authorization).toBe("Bearer token-de-teste");
  });

  test("quem já demonstrou interesse vê o andamento", async () => {
    entrarComo("USUARIO");
    perfilCom({ meuInteresse: { id: "i1", statusAndamento: "EM_CONTATO" } });
    abrir();
    await esperarFicha();

    expect(
      screen.getByText("Você já demonstrou interesse na Mel."),
    ).toBeInTheDocument();
    expect(screen.getByText("Em contato")).toBeInTheDocument();
    expect(
      screen.queryByRole("link", { name: "Quero conhecer Mel" }),
    ).not.toBeInTheDocument();
  });

  test("o protetor que cadastrou vê o botão de editar", async () => {
    entrarComo("USUARIO");
    perfilCom({ ehMeu: true });
    abrir();
    await esperarFicha();

    expect(screen.getByRole("link", { name: "Editar Mel" })).toHaveAttribute(
      "href",
      `/meus-animais/${ID}/editar`,
    );
  });

  test("Abrigo não demonstra interesse", async () => {
    entrarComo("ABRIGO");
    abrir();
    await esperarFicha();

    expect(
      screen.getByText(/Contas de abrigo não demonstram interesse/),
    ).toBeInTheDocument();
  });

  test("Usuario de outro estado fica sabendo por que não pode adotar", async () => {
    entrarComo("USUARIO");
    abrir();
    await esperarFicha();

    expect(
      screen.getByText(/acontece dentro do mesmo estado/),
    ).toHaveTextContent("Santo André/SP");
  });
});

describe("quando dá errado", () => {
  test("animal que não existe (ou já foi adotado)", async () => {
    simularApi({
      responderAnimal: () =>
        resposta(404, { status: 404, mensagem: "Animal não encontrado" }),
    });
    abrir("nao-existe");

    expect(
      await screen.findByRole("heading", { name: "Animal não encontrado" }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("link", { name: "Ver animais disponíveis" }),
    ).toHaveAttribute("href", "/animais");
  });

  test("erro do servidor deixa tentar de novo", async () => {
    let tentativas = 0;
    simularApi({
      responderAnimal: (id) => {
        tentativas += 1;
        return tentativas === 1
          ? resposta(500, { status: 500, mensagem: "Erro interno" })
          : resposta(200, { ...perfilExemplo, id });
      },
    });
    abrir();

    expect(await screen.findByRole("alert")).toHaveTextContent(
      "Não foi possível carregar o animal",
    );
    fireEvent.click(screen.getByRole("button", { name: "Tentar de novo" }));
    await esperarFicha();
  });

  test("token vencido: sai da conta e mostra a ficha como visitante", async () => {
    entrarComo("USUARIO");
    simularApi({
      responderAnimal: (id, opcoes) =>
        opcoes.headers.Authorization
          ? resposta(401, { status: 401, mensagem: "Autenticação necessária" })
          : resposta(200, { ...perfilExemplo, id }),
    });
    abrir();
    await esperarFicha();

    expect(
      screen.getByText("Pra continuar, você vai entrar ou criar sua conta."),
    ).toBeInTheDocument();
    expect(localStorage.getItem(CHAVE)).toBeNull();
  });
});
