import { fireEvent, render, screen, waitFor, within } from "@testing-library/react";
import { MemoryRouter, Route, Routes } from "react-router-dom";
import { AuthProvider } from "../src/contexts/AuthContext";
import { interessesRecebidosExemplo } from "../src/mocks/interesses";
import InteressesRecebidos from "../src/pages/InteressesRecebidos/InteressesRecebidos";
import { resposta, simularApi } from "./utils/apiFalsa";

// Painel do protetor (UC08, RF10). A API de mentira guarda a lista e aplica as mudanças de status,
// do mesmo jeito que o back: aprovar adota o animal e descontinua os outros interesses dele.

const CHAVE = "adotaaqui.sessao";
const [ana, bruno, carla, davi] = interessesRecebidosExemplo;
const MEL = ana.animal;
const TOBIAS = carla.animal;
const MOTIVO_PADRAO = "Outro candidato foi aprovado para este animal.";

function entrarComoAbrigo() {
  localStorage.setItem(
    CHAVE,
    JSON.stringify({
      token: "token-de-teste",
      tipoConta: "ABRIGO",
      id: "1",
      nome: "Instituto Quatro Patas",
      expiraEm: "2999-01-01T00:00:00Z",
    }),
  );
}

// "recusarStatus" permite simular uma recusa da API no PATCH
function simularPainel({ lista = interessesRecebidosExemplo, recusarStatus } = {}) {
  let atual = lista.map((interesse) => ({ ...interesse }));
  simularApi({
    outras: (metodo, caminho, opcoes) => {
      if (caminho === "/api/interesses/recebidos") return resposta(200, atual);

      const mudanca = caminho.match(/^\/api\/interesses\/([^/]+)\/status$/);
      if (!mudanca || metodo !== "PATCH") return undefined;
      if (recusarStatus) return recusarStatus;

      const id = mudanca[1];
      const corpo = JSON.parse(opcoes.body);
      const alvo = atual.find((interesse) => interesse.id === id);
      atual = atual.map((interesse) => {
        if (interesse.id === id) {
          return {
            ...interesse,
            statusAndamento: corpo.statusAndamento,
            motivoDescontinuacao: corpo.motivoDescontinuacao ?? null,
          };
        }
        const outroDoMesmoAnimal =
          corpo.statusAndamento === "APROVADO" &&
          interesse.animal.id === alvo.animal.id &&
          ["PENDENTE", "EM_CONTATO"].includes(interesse.statusAndamento);
        return outroDoMesmoAnimal
          ? { ...interesse, statusAndamento: "DESCONTINUADO", motivoDescontinuacao: MOTIVO_PADRAO }
          : interesse;
      });
      return resposta(200, atual.find((interesse) => interesse.id === id));
    },
  });
}

function abrir(endereco = "/interesses-recebidos") {
  render(
    <MemoryRouter initialEntries={[endereco]}>
      <AuthProvider>
        <Routes>
          <Route path="/interesses-recebidos" element={<InteressesRecebidos />} />
        </Routes>
      </AuthProvider>
    </MemoryRouter>,
  );
}

// O cartão (li) de um candidato, pra procurar só dentro dele
function cartao(nome) {
  return within(screen.getByRole("heading", { name: nome }).closest("li"));
}

async function esperarLista() {
  await screen.findByRole("heading", { name: "Ana Souza" });
}

const chamadas = (metodo, final) =>
  fetch.mock.calls.filter(([url, opcoes]) => (opcoes?.method ?? "GET") === metodo && url.endsWith(final));

beforeEach(() => {
  entrarComoAbrigo();
  simularPainel();
});

afterEach(() => {
  localStorage.clear();
  sessionStorage.clear();
});

describe("lista", () => {
  test("busca com o token e agrupa os candidatos por animal", async () => {
    abrir();
    await esperarLista();

    const [[url, opcoes]] = chamadas("GET", "/api/interesses/recebidos");
    expect(url).toBe("http://api.teste/api/interesses/recebidos");
    expect(opcoes.headers.Authorization).toBe("Bearer token-de-teste");
    expect(screen.getByRole("link", { name: "Mel" })).toHaveAttribute("href", `/animais/${MEL.id}`);
    expect(screen.getByRole("link", { name: "Tobias" })).toBeInTheDocument();
    expect(screen.getAllByText("2 interesses")).toHaveLength(2);
  });

  test("mostra os contatos, o horário preferido e as respostas da triagem", async () => {
    abrir();
    await esperarLista();
    const daAna = cartao("Ana Souza");

    expect(daAna.getByText("Recebido em 06/10/2026")).toBeInTheDocument();
    expect(daAna.getByRole("link", { name: "WhatsApp: (69) 98888-7777" })).toHaveAttribute(
      "href",
      "https://wa.me/5569988887777",
    );
    expect(daAna.getByRole("link", { name: "ana@example.com" })).toHaveAttribute("href", "mailto:ana@example.com");
    expect(daAna.getByText("Melhor horário para contato: Noite")).toBeInTheDocument();
    expect(daAna.getByText("Casa com quintal")).toBeInTheDocument();
    expect(daAna.getByText("Prefere responder na conversa")).toBeInTheDocument();
    expect(daAna.getByText("Pendente")).toBeInTheDocument();
  });

  test("cada status mostra só as ações que a máquina de estados permite", async () => {
    abrir();
    await esperarLista();

    expect(cartao("Ana Souza").getByRole("button", { name: "Marcar como em contato" })).toBeInTheDocument();
    expect(cartao("Bruno Lima").queryByRole("button", { name: "Marcar como em contato" })).toBeNull();
    expect(cartao("Bruno Lima").getByRole("button", { name: "Aprovar adoção" })).toBeInTheDocument();
    expect(cartao("Carla Dias").queryByRole("button")).toBeNull();
    expect(cartao("Carla Dias").getByText(/é quem vai cuidar de Tobias/)).toBeInTheDocument();
    expect(cartao("Davi Rocha").queryByRole("button")).toBeNull();
    expect(cartao("Davi Rocha").getByText(MOTIVO_PADRAO)).toBeInTheDocument();
  });

  test("sem interesses, explica e leva pra Meus animais", async () => {
    simularPainel({ lista: [] });
    abrir();

    expect(await screen.findByText(/ainda não recebeu nenhum interesse/)).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "Ver meus animais" })).toHaveAttribute("href", "/meus-animais");
  });

  test("se não conseguir carregar, deixa tentar de novo", async () => {
    let tentativas = 0;
    simularApi({
      outras: (metodo, caminho) => {
        if (caminho !== "/api/interesses/recebidos") return undefined;
        tentativas += 1;
        return tentativas === 1
          ? resposta(500, { status: 500, mensagem: "Erro interno" })
          : resposta(200, interessesRecebidosExemplo);
      },
    });
    abrir();

    expect(await screen.findByRole("alert")).toHaveTextContent("Não foi possível carregar os interesses");
    fireEvent.click(screen.getByRole("button", { name: "Tentar de novo" }));
    await esperarLista();
  });
});

describe("filtros", () => {
  test("o filtro de status conta e mostra só os escolhidos", async () => {
    abrir();
    await esperarLista();

    fireEvent.click(screen.getByRole("button", { name: "Pendentes 1" }));

    expect(screen.getByRole("heading", { name: "Ana Souza" })).toBeInTheDocument();
    expect(screen.queryByRole("heading", { name: "Bruno Lima" })).toBeNull();
    expect(screen.queryByRole("link", { name: "Tobias" })).toBeNull();
  });

  test("o animal pode vir no endereço, e dá pra trocar pela seleção", async () => {
    abrir(`/interesses-recebidos?animal=${TOBIAS.id}`);
    await screen.findByRole("heading", { name: "Carla Dias" });

    expect(screen.queryByRole("heading", { name: "Ana Souza" })).toBeNull();
    expect(screen.getByRole("button", { name: "Todos 2" })).toBeInTheDocument();
    expect(screen.getByLabelText("Animal")).toHaveValue(TOBIAS.id);

    fireEvent.change(screen.getByLabelText("Animal"), { target: { value: "" } });
    expect(screen.getByRole("heading", { name: "Ana Souza" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Todos 4" })).toBeInTheDocument();
  });

  test("animal sem interesses no endereço: explica e deixa ver todos", async () => {
    abrir("/interesses-recebidos?animal=animal-sem-interesses");

    expect(await screen.findByText("Esse animal ainda não recebeu interesses.")).toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: "Ver todos os interesses" }));
    expect(screen.getByRole("heading", { name: "Ana Souza" })).toBeInTheDocument();
  });
});

describe("ações", () => {
  test("marcar como em contato manda o PATCH e atualiza a lista", async () => {
    abrir();
    await esperarLista();

    fireEvent.click(cartao("Ana Souza").getByRole("button", { name: "Marcar como em contato" }));

    expect(await screen.findByText("O interesse de Ana Souza foi marcado como em contato.")).toBeInTheDocument();
    expect(await cartao("Ana Souza").findByText("Em contato")).toBeInTheDocument();
    const [[url, opcoes]] = chamadas("PATCH", "/status");
    expect(url).toBe(`http://api.teste/api/interesses/${ana.id}/status`);
    expect(opcoes.headers.Authorization).toBe("Bearer token-de-teste");
    expect(JSON.parse(opcoes.body)).toEqual({ statusAndamento: "EM_CONTATO" });
    expect(chamadas("GET", "/api/interesses/recebidos")).toHaveLength(2);
  });

  test("aprovar pede confirmação e descontinua os outros interesses do animal", async () => {
    abrir();
    await esperarLista();

    fireEvent.click(cartao("Ana Souza").getByRole("button", { name: "Aprovar adoção" }));
    expect(screen.getByText("Aprovar Ana Souza para adotar Mel?")).toBeInTheDocument();
    expect(chamadas("PATCH", "/status")).toHaveLength(0);

    fireEvent.click(screen.getByRole("button", { name: "Confirmar aprovação" }));

    expect(await screen.findByText(/Adoção de Mel aprovada para Ana Souza/)).toBeInTheDocument();
    expect(await cartao("Ana Souza").findByText("Aprovado")).toBeInTheDocument();
    expect(cartao("Bruno Lima").getByText("Descontinuado")).toBeInTheDocument();
    expect(JSON.parse(chamadas("PATCH", "/status")[0][1].body)).toEqual({ statusAndamento: "APROVADO" });
  });

  test("dá pra voltar atrás antes de aprovar", async () => {
    abrir();
    await esperarLista();

    fireEvent.click(cartao("Ana Souza").getByRole("button", { name: "Aprovar adoção" }));
    fireEvent.click(screen.getByRole("button", { name: "Voltar" }));

    expect(cartao("Ana Souza").getByRole("button", { name: "Aprovar adoção" })).toBeInTheDocument();
    expect(chamadas("PATCH", "/status")).toHaveLength(0);
  });

  test("descontinuar exige o motivo e envia junto", async () => {
    abrir();
    await esperarLista();

    fireEvent.click(cartao("Bruno Lima").getByRole("button", { name: "Descontinuar" }));
    fireEvent.click(cartao("Bruno Lima").getByRole("button", { name: "Confirmar" }));
    expect(screen.getByText("Escreva o motivo. O candidato vai ver essa mensagem.")).toBeInTheDocument();
    expect(chamadas("PATCH", "/status")).toHaveLength(0);

    const motivo = "Procuramos uma casa sem outros gatos.";
    fireEvent.change(screen.getByLabelText("Por que você vai descontinuar o interesse de Bruno Lima?"), {
      target: { value: motivo },
    });
    fireEvent.click(cartao("Bruno Lima").getByRole("button", { name: "Confirmar" }));

    expect(await screen.findByText("O interesse de Bruno Lima foi descontinuado.")).toBeInTheDocument();
    expect(await cartao("Bruno Lima").findByText(motivo)).toBeInTheDocument();
    expect(JSON.parse(chamadas("PATCH", "/status")[0][1].body)).toEqual({
      statusAndamento: "DESCONTINUADO",
      motivoDescontinuacao: motivo,
    });
  });

  test("recusa da API aparece no cartão do candidato", async () => {
    simularPainel({
      recusarStatus: resposta(409, { status: 409, mensagem: "Este animal já foi adotado" }),
    });
    abrir();
    await esperarLista();

    fireEvent.click(cartao("Ana Souza").getByRole("button", { name: "Aprovar adoção" }));
    fireEvent.click(screen.getByRole("button", { name: "Confirmar aprovação" }));

    expect(await cartao("Ana Souza").findByRole("alert")).toHaveTextContent("Este animal já foi adotado");
    expect(chamadas("GET", "/api/interesses/recebidos")).toHaveLength(1);
  });
});
