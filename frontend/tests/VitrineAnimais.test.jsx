import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import VitrineAnimais from "../src/components/VitrineAnimais/VitrineAnimais";
import { AuthProvider } from "../src/contexts/AuthContext";
import { animaisExemplo } from "../src/mocks/animais";
import {
  buscasDeAnimais,
  resposta,
  simularApi,
  ultimaBuscaDeAnimais,
} from "./utils/apiFalsa";

// A API é quem filtra (estado, espécie, cidade...). Aqui o teste confere o que é trabalho do front:
// mandar os filtros certos, mandar o token, mostrar a resposta e as mensagens de cada situação.

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

function renderizar() {
  render(
    <MemoryRouter>
      <AuthProvider>
        <VitrineAnimais />
      </AuthProvider>
    </MemoryRouter>,
  );
}

// Espera a grade aparecer e devolve o nome dos animais, na ordem da tela
async function nomesNaTela() {
  const titulos = await screen.findAllByRole("heading", { level: 3 });
  return titulos.map((titulo) => titulo.textContent);
}

function clicar(nome) {
  fireEvent.click(screen.getByRole("button", { name: nome }));
}

function escolher(rotulo, valor) {
  fireEvent.change(screen.getByLabelText(rotulo), { target: { value: valor } });
}

beforeEach(() => {
  simularApi();
});

afterEach(() => {
  localStorage.clear();
  sessionStorage.clear();
});

describe("busca na API", () => {
  test("mostra os animais que a API devolve, sem mandar filtro vazio", async () => {
    renderizar();

    expect(await nomesNaTela()).toEqual([
      "Mel",
      "Tobias",
      "Amora",
      "Bento",
      "Miau",
      "Tuca",
    ]);
    expect(fetch).toHaveBeenCalledWith(
      "http://api.teste/api/animais",
      expect.anything(),
    );
  });

  test("manda os filtros escolhidos como parâmetros", async () => {
    renderizar();
    await nomesNaTela();

    clicar("Gatos");
    clicar("Macho");
    escolher("Energia", "MAIS_CALMO");
    clicar("Bom com crianças");

    await waitFor(() =>
      expect(ultimaBuscaDeAnimais().parametros).toEqual({
        especie: "GATO",
        sexo: "MACHO",
        energia: "MAIS_CALMO",
        convivenciaCrianca: "CONVIVE_BEM",
      }),
    );
  });

  test("espera a pessoa parar de digitar a cidade pra buscar uma vez só", async () => {
    renderizar();
    await nomesNaTela();

    escolher("Cidade", "p");
    escolher("Cidade", "por");
    escolher("Cidade", "porto velho");

    await waitFor(() =>
      expect(ultimaBuscaDeAnimais().parametros).toEqual({
        cidade: "porto velho",
      }),
    );
    // a primeira busca (ao abrir) + uma só pras três mudanças
    expect(buscasDeAnimais()).toHaveLength(2);
  });

  test("a raça vem da API e só libera depois de escolher a espécie", async () => {
    renderizar();
    await nomesNaTela();
    expect(screen.getByLabelText("Raça")).toBeDisabled();

    clicar("Gatos");
    await screen.findByRole("option", { name: "Siamês" });
    escolher("Raça", "SIAMES");
    await waitFor(() =>
      expect(ultimaBuscaDeAnimais().parametros).toEqual({
        especie: "GATO",
        raca: "SIAMES",
      }),
    );

    // trocou a espécie: a raça volta pra "qualquer uma"
    clicar("Cães");
    expect(screen.getByLabelText("Raça").value).toBe("");
    await waitFor(() =>
      expect(ultimaBuscaDeAnimais().parametros).toEqual({ especie: "CAO" }),
    );
  });

  test("avisa quando nada combina com o filtro e deixa ver todos de novo", async () => {
    simularApi({
      responderAnimais: (parametros) =>
        resposta(200, parametros.porte ? [] : animaisExemplo),
    });
    renderizar();
    await nomesNaTela();

    escolher("Porte", "GRANDE");
    expect(
      await screen.findByText(
        "Nenhum resultado encontrado com essas informações.",
      ),
    ).toBeInTheDocument();

    clicar("Ver todos os animais");
    expect(await nomesNaTela()).toHaveLength(6);
  });

  test("avisa quando a API falha e deixa tentar de novo", async () => {
    let tentativas = 0;
    simularApi({
      responderAnimais: () => {
        tentativas += 1;
        return tentativas === 1
          ? resposta(500, { status: 500, mensagem: "Erro interno" })
          : resposta(200, animaisExemplo);
      },
    });
    renderizar();

    expect(await screen.findByRole("alert")).toHaveTextContent(
      "Não foi possível carregar os animais",
    );
    clicar("Tentar de novo");
    expect(await nomesNaTela()).toHaveLength(6);
  });
});

describe("quem está vendo", () => {
  test("visitante: busca sem token e é convidado a entrar", async () => {
    renderizar();
    await nomesNaTela();

    expect(ultimaBuscaDeAnimais().opcoes.headers.Authorization).toBeUndefined();
    expect(
      screen.getByRole("link", { name: "entre para filtrar pelo seu" }),
    ).toHaveAttribute("href", "/login");
  });

  test("Usuario: busca com o token e vê o aviso do estado dele", async () => {
    entrarComo("USUARIO");
    renderizar();
    await nomesNaTela();

    expect(ultimaBuscaDeAnimais().opcoes.headers.Authorization).toBe(
      "Bearer token-de-teste",
    );
    expect(
      screen.getByText("Exibindo animais do seu estado."),
    ).toBeInTheDocument();
    expect(
      screen.queryByRole("link", { name: "entre para filtrar pelo seu" }),
    ).not.toBeInTheDocument();
  });

  test("Usuario sem animais no estado vê a mensagem do UC06 FA01", async () => {
    entrarComo("USUARIO");
    simularApi({ responderAnimais: () => resposta(200, []) });
    renderizar();

    expect(
      await screen.findByText(
        "Nenhum animal disponível no seu estado no momento.",
      ),
    ).toBeInTheDocument();
  });

  test("Abrigo: vê todos os estados, sem o convite pra entrar", async () => {
    entrarComo("ABRIGO");
    renderizar();
    await nomesNaTela();

    expect(
      screen.getByText("Exibindo animais de todos os estados brasileiros."),
    ).toBeInTheDocument();
    expect(
      screen.queryByRole("link", { name: "entre para filtrar pelo seu" }),
    ).not.toBeInTheDocument();
  });

  test("token vencido: sai da conta e mostra a vitrine como visitante", async () => {
    entrarComo("USUARIO");
    simularApi({
      responderAnimais: (parametros, opcoes) =>
        opcoes.headers.Authorization
          ? resposta(401, { status: 401, mensagem: "Autenticação necessária" })
          : resposta(200, animaisExemplo),
    });
    renderizar();

    expect(
      await screen.findByRole("link", { name: "entre para filtrar pelo seu" }),
    ).toBeInTheDocument();
    expect(await nomesNaTela()).toHaveLength(6);
    expect(localStorage.getItem(CHAVE)).toBeNull();
  });
});
