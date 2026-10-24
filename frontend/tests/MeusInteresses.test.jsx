import {
  fireEvent,
  render,
  screen,
  waitFor,
  within,
} from "@testing-library/react";
import { MemoryRouter, Route, Routes } from "react-router-dom";
import { AuthProvider } from "../src/contexts/AuthContext";
import { minhasCandidaturasExemplo } from "../src/mocks/interesses";
import MeusInteresses from "../src/pages/MeusInteresses/MeusInteresses";
import { haQuantoTempo } from "../src/utils/rotulos";
import { resposta, simularApi } from "./utils/apiFalsa";

// Minhas candidaturas (UC07, RF09). Nos exemplos: Mel pendente, Bento em contato,
// Amora aprovada (já adotada) e Tuca descontinuado, porque outro candidato foi aprovado

const CHAVE = "adotaaqui.sessao";
const [mel, bento] = minhasCandidaturasExemplo;

function entrarComoPessoa() {
  localStorage.setItem(
    CHAVE,
    JSON.stringify({
      token: "token-de-teste",
      tipoConta: "USUARIO",
      id: "u1",
      nome: "Ana Souza",
      expiraEm: "2999-01-01T00:00:00Z",
    }),
  );
}

// "lista" é o que o GET devolve. "respostaDaLista" troca a resposta inteira (pra simular erro)
// e "recusarDesistencia" é a resposta do DELETE quando a API recusa
function simularCandidaturas({
  lista = minhasCandidaturasExemplo,
  respostaDaLista,
  recusarDesistencia,
} = {}) {
  simularApi({
    responderDesistencia: recusarDesistencia
      ? () => recusarDesistencia
      : undefined,
    outras: (metodo, caminho) => {
      if (caminho === "/api/interesses/meus")
        return respostaDaLista ?? resposta(200, lista);
      return undefined;
    },
  });
}

function abrir() {
  render(
    <MemoryRouter initialEntries={["/meus-interesses"]}>
      <AuthProvider>
        <Routes>
          <Route path="/meus-interesses" element={<MeusInteresses />} />
        </Routes>
      </AuthProvider>
    </MemoryRouter>,
  );
}

// O cartão (li) de uma candidatura, pra procurar só dentro dele
function cartao(nome) {
  return within(
    screen.getByRole("heading", { name: nome, level: 2 }).closest("li"),
  );
}

function nomesNaTela() {
  return screen
    .getAllByRole("heading", { level: 2 })
    .map((titulo) => titulo.textContent);
}

async function esperarLista() {
  await screen.findByRole("heading", { name: "Mel", level: 2 });
}

const chamadas = (metodo, final) =>
  fetch.mock.calls.filter(
    ([url, opcoes]) =>
      (opcoes?.method ?? "GET") === metodo && url.endsWith(final),
  );

function desistirDe(nome) {
  fireEvent.click(
    cartao(nome).getByRole("button", { name: `Desistir da adoção de ${nome}` }),
  );
  fireEvent.click(
    cartao(nome).getByRole("button", { name: "Confirmar desistência" }),
  );
}

beforeEach(() => {
  entrarComoPessoa();
  simularCandidaturas();
});

afterEach(() => {
  localStorage.clear();
  sessionStorage.clear();
});

describe("lista", () => {
  test("busca as candidaturas com o token", async () => {
    abrir();
    expect(screen.getByText("Carregando candidaturas...")).toBeInTheDocument();
    await esperarLista();

    const [[url, opcoes]] = chamadas("GET", "/api/interesses/meus");
    expect(url).toBe("http://api.teste/api/interesses/meus");
    expect(opcoes.headers.Authorization).toBe("Bearer token-de-teste");
  });

  test("as em andamento vêm primeiro, depois a aprovada e a descontinuada", async () => {
    abrir();
    await esperarLista();

    expect(nomesNaTela()).toEqual(["Bento", "Mel", "Amora", "Tuca"]);
  });

  test("mostra o animal, o status, quando foi enviada e o contato do protetor", async () => {
    abrir();
    await esperarLista();
    const doBento = cartao("Bento");

    expect(doBento.getByText("Em contato")).toBeInTheDocument();
    expect(
      doBento.getByText(
        `Cão, labrador, porte grande. Interesse enviado ${haQuantoTempo(bento.dataHora)}`,
      ),
    ).toBeInTheDocument();
    expect(doBento.getByText("Instituto Quatro Patas")).toBeInTheDocument();
    expect(
      doBento.getByRole("link", { name: "contato@quatropatas.org" }),
    ).toHaveAttribute("href", "mailto:contato@quatropatas.org");
    expect(
      doBento.getByRole("link", { name: "WhatsApp (69) 3222-1111" }),
    ).toHaveAttribute("href", "https://wa.me/556932221111");
    expect(cartao("Mel").getByText("Pendente")).toBeInTheDocument();
  });

  test("a aprovada diz o próximo passo e a descontinuada mostra o motivo", async () => {
    abrir();
    await esperarLista();

    expect(cartao("Amora").getByText("Aprovado")).toBeInTheDocument();
    expect(
      cartao("Amora").getByText(
        "Adoção aprovada. Combine os próximos passos com o protetor.",
      ),
    ).toBeInTheDocument();
    expect(cartao("Tuca").getByText("Descontinuado")).toBeInTheDocument();
    expect(
      cartao("Tuca").getByText(
        "Outro candidato foi aprovado para este animal.",
      ),
    ).toBeInTheDocument();
  });

  test("ver ficha só com o animal disponível, e desistir só com a candidatura em andamento", async () => {
    abrir();
    await esperarLista();

    expect(
      cartao("Mel").getByRole("link", { name: "Ver ficha de Mel" }),
    ).toHaveAttribute("href", `/animais/${mel.animal.id}`);
    expect(
      cartao("Mel").getByRole("button", { name: "Desistir da adoção de Mel" }),
    ).toBeInTheDocument();
    expect(
      cartao("Bento").getByRole("button", {
        name: "Desistir da adoção de Bento",
      }),
    ).toBeInTheDocument();
    // Amora e Tuca já foram adotados: a ficha não abre pra quem não é o protetor
    for (const nome of ["Amora", "Tuca"]) {
      expect(
        cartao(nome).queryByRole("link", { name: /Ver ficha/ }),
      ).toBeNull();
      expect(cartao(nome).queryByRole("button")).toBeNull();
    }
  });

  test("o filtro mostra só o status escolhido, com a contagem de cada um", async () => {
    abrir();
    await esperarLista();

    expect(screen.getByRole("button", { name: "Todas 4" })).toHaveAttribute(
      "aria-pressed",
      "true",
    );
    fireEvent.click(screen.getByRole("button", { name: "Descontinuado 1" }));

    expect(nomesNaTela()).toEqual(["Tuca"]);
    expect(
      screen.getByRole("button", { name: "Descontinuado 1" }),
    ).toHaveAttribute("aria-pressed", "true");
    expect(screen.getByRole("button", { name: "Todas 4" })).toHaveAttribute(
      "aria-pressed",
      "false",
    );
  });
});

describe("desistir", () => {
  test("pede confirmação, apaga o interesse e tira o cartão da lista", async () => {
    abrir();
    await esperarLista();
    const botao = cartao("Mel").getByRole("button", {
      name: "Desistir da adoção de Mel",
    });

    fireEvent.click(botao);
    expect(botao).toHaveAttribute("aria-expanded", "true");
    expect(
      cartao("Mel").getByText("Desistir da adoção de Mel?"),
    ).toBeInTheDocument();
    expect(chamadas("DELETE", "/api/interesses/m1")).toHaveLength(0);

    fireEvent.click(
      cartao("Mel").getByRole("button", { name: "Confirmar desistência" }),
    );

    const aviso = await screen.findByText(
      "Você desistiu da adoção de Mel. O protetor não vê mais o seu interesse.",
    );
    await waitFor(() => expect(aviso).toHaveFocus());
    expect(screen.queryByRole("heading", { name: "Mel", level: 2 })).toBeNull();
    expect(screen.getByRole("button", { name: "Todas 3" })).toBeInTheDocument();
    const [[, opcoes]] = chamadas("DELETE", "/api/interesses/m1");
    expect(opcoes.headers.Authorization).toBe("Bearer token-de-teste");
  });

  test("voltar fecha a confirmação sem apagar nada", async () => {
    abrir();
    await esperarLista();
    const botao = cartao("Bento").getByRole("button", {
      name: "Desistir da adoção de Bento",
    });

    fireEvent.click(botao);
    fireEvent.click(cartao("Bento").getByRole("button", { name: "Voltar" }));

    expect(
      cartao("Bento").queryByRole("button", { name: "Confirmar desistência" }),
    ).toBeNull();
    expect(botao).toHaveAttribute("aria-expanded", "false");
    expect(botao).toHaveFocus();
    expect(chamadas("DELETE", "/api/interesses/m2")).toHaveLength(0);
  });

  test("se a API recusar, mostra o motivo e o cartão continua", async () => {
    simularCandidaturas({
      recusarDesistencia: resposta(409, {
        status: 409,
        mensagem:
          "Só é possível desistir de um interesse pendente ou em contato",
      }),
    });
    abrir();
    await esperarLista();

    desistirDe("Mel");

    expect(await cartao("Mel").findByRole("alert")).toHaveTextContent(
      "Só é possível desistir de um interesse pendente ou em contato",
    );
    expect(
      cartao("Mel").getByRole("button", { name: "Confirmar desistência" }),
    ).toBeEnabled();
  });

  test("com a sessão vencida, encerra a sessão", async () => {
    simularCandidaturas({
      recusarDesistencia: resposta(401, {
        status: 401,
        mensagem: "Token inválido ou expirado",
      }),
    });
    abrir();
    await esperarLista();

    desistirDe("Mel");

    await waitFor(() => expect(localStorage.getItem(CHAVE)).toBeNull());
  });

  test("com o filtro ligado, desistir da última mostra o atalho pra ver todas", async () => {
    abrir();
    await esperarLista();
    fireEvent.click(screen.getByRole("button", { name: "Pendente 1" }));

    desistirDe("Mel");

    expect(
      await screen.findByText("Nenhuma candidatura com esse status."),
    ).toBeInTheDocument();
    fireEvent.click(
      screen.getByRole("button", { name: "Ver todas as candidaturas" }),
    );
    expect(nomesNaTela()).toEqual(["Bento", "Amora", "Tuca"]);
  });
});

describe("estados da página", () => {
  test("sem candidaturas, convida a ver os animais", async () => {
    simularCandidaturas({ lista: [] });
    abrir();

    expect(
      await screen.findByText(
        /Você ainda não demonstrou interesse em nenhum animal/,
      ),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("link", { name: "Ver animais disponíveis" }),
    ).toHaveAttribute("href", "/animais");
    expect(screen.queryByRole("button", { name: /Todas/ })).toBeNull();
  });

  test("erro ao carregar oferece tentar de novo", async () => {
    let tentativas = 0;
    simularApi({
      outras: (metodo, caminho) => {
        if (caminho !== "/api/interesses/meus") return undefined;
        tentativas += 1;
        return tentativas === 1
          ? resposta(500, { status: 500, mensagem: "Erro interno" })
          : resposta(200, minhasCandidaturasExemplo);
      },
    });
    abrir();

    fireEvent.click(
      await screen.findByRole("button", { name: "Tentar de novo" }),
    );

    await esperarLista();
    expect(tentativas).toBe(2);
  });

  test("com o token vencido, encerra a sessão", async () => {
    simularCandidaturas({
      respostaDaLista: resposta(401, {
        status: 401,
        mensagem: "Token inválido ou expirado",
      }),
    });
    abrir();

    await waitFor(() => expect(localStorage.getItem(CHAVE)).toBeNull());
  });
});
