import { fireEvent, render, screen, within } from "@testing-library/react";
import { MemoryRouter, Route, Routes } from "react-router-dom";
import { AuthProvider } from "../src/contexts/AuthContext";
import { animaisExemplo } from "../src/mocks/animais";
import { interessesRecebidosExemplo } from "../src/mocks/interesses";
import InteressesRecebidos from "../src/pages/InteressesRecebidos/InteressesRecebidos";
import { MOTIVO_PADRAO } from "../src/services/interesses";
import { resposta, simularApi } from "./utils/apiFalsa";

// Painel do protetor (UC08, RF10). A API de mentira guarda as listas e aplica as mudanças de status
// do mesmo jeito que o back: aprovar adota o animal e descontinua os outros interesses dele.
// Nos exemplos: Mel tem Ana (pendente) e Bruno (em contato). Tobias já foi adotado por Carla,
// e o interesse do Davi foi descontinuado.

const CHAVE = "adotaaqui.sessao";
const [ana, , carla] = interessesRecebidosExemplo;
const MEL = ana.animal;
const TOBIAS = carla.animal;

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
  let interesses = lista.map((interesse) => ({ ...interesse }));
  let animais = [
    { ...animaisExemplo[0] },
    { ...animaisExemplo[1], statusAdocao: "ADOTADO" },
  ];

  simularApi({
    outras: (metodo, caminho, opcoes) => {
      if (caminho === "/api/interesses/recebidos") return resposta(200, interesses);
      if (caminho === "/api/animais/meus") return resposta(200, animais);

      const mudanca = caminho.match(/^\/api\/interesses\/([^/]+)\/status$/);
      if (!mudanca || metodo !== "PATCH") return undefined;
      if (recusarStatus) return recusarStatus;

      const id = mudanca[1];
      const corpo = JSON.parse(opcoes.body);
      const alvo = interesses.find((interesse) => interesse.id === id);
      const aprovou = corpo.statusAndamento === "APROVADO";
      interesses = interesses.map((interesse) => {
        if (interesse.id === id) {
          return {
            ...interesse,
            statusAndamento: corpo.statusAndamento,
            motivoDescontinuacao: corpo.motivoDescontinuacao ?? null,
          };
        }
        const outroDoMesmoAnimal =
          aprovou &&
          interesse.animal.id === alvo.animal.id &&
          ["PENDENTE", "EM_CONTATO"].includes(interesse.statusAndamento);
        return outroDoMesmoAnimal
          ? { ...interesse, statusAndamento: "DESCONTINUADO", motivoDescontinuacao: MOTIVO_PADRAO }
          : interesse;
      });
      if (aprovou) {
        animais = animais.map((animal) =>
          animal.id === alvo.animal.id ? { ...animal, statusAdocao: "ADOTADO" } : animal,
        );
      }
      return resposta(200, interesses.find((interesse) => interesse.id === id));
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

// A linha (li) de um candidato, pra procurar só dentro dela
function linha(nome) {
  return within(screen.getByRole("heading", { name: nome }).closest("li"));
}

// O cartão (section) de um animal
function cartaoDoAnimal(nome) {
  return within(screen.getByRole("region", { name: nome }));
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
  test("busca os interesses e os animais com o token", async () => {
    abrir();
    await esperarLista();

    const [[url, opcoes]] = chamadas("GET", "/api/interesses/recebidos");
    expect(url).toBe("http://api.teste/api/interesses/recebidos");
    expect(opcoes.headers.Authorization).toBe("Bearer token-de-teste");
    expect(chamadas("GET", "/api/animais/meus")[0][1].headers.Authorization).toBe("Bearer token-de-teste");
  });

  test("um cartão por animal, com os dados de Meus animais e o resumo dos interesses", async () => {
    abrir();
    await esperarLista();
    const mel = cartaoDoAnimal("Mel");
    const tobias = cartaoDoAnimal("Tobias");

    expect(mel.getByRole("link", { name: "Mel" })).toHaveAttribute("href", `/animais/${MEL.id}`);
    expect(mel.getByText("Disponível")).toBeInTheDocument();
    expect(mel.getByText("Cão, sem raça definida, porte médio, 14 kg, em Santo André/SP")).toBeInTheDocument();
    expect(mel.getByText("2 interesses, 1 em contato")).toBeInTheDocument();
    expect(mel.getByText(/Ao aprovar um candidato, a Mel passa para Adotado/)).toBeInTheDocument();

    expect(tobias.getByText("Adotado")).toBeInTheDocument();
    expect(tobias.getByText("Histórico encerrado")).toBeInTheDocument();
    expect(tobias.queryByText(/Ao aprovar um candidato/)).toBeNull();
  });

  test("no cartão, quem está em contato vem antes dos pendentes", async () => {
    abrir();
    await esperarLista();

    const nomes = cartaoDoAnimal("Mel")
      .getAllByRole("heading", { level: 3 })
      .map((titulo) => titulo.textContent);
    expect(nomes).toEqual(["Bruno Lima", "Ana Souza"]);
  });

  test("mostra os contatos, o melhor horário e o resumo da triagem", async () => {
    abrir();
    await esperarLista();
    const daAna = linha("Ana Souza");

    expect(daAna.getByText("Pendente")).toBeInTheDocument();
    expect(daAna.getByRole("link", { name: "ana@example.com" })).toHaveAttribute("href", "mailto:ana@example.com");
    expect(daAna.getByRole("link", { name: "WhatsApp (69) 98888-7777" })).toHaveAttribute(
      "href",
      "https://wa.me/5569988887777",
    );
    expect(daAna.getByText("Melhor horário: noite")).toBeInTheDocument();
    expect(
      daAna.getByText(/Triagem: Casa com quintal, sem crianças, até 4h sozinho, deixa com alguém nas viagens/),
    ).toBeInTheDocument();
  });

  test("cada status mostra só as ações que a máquina de estados permite", async () => {
    abrir();
    await esperarLista();

    expect(linha("Ana Souza").getByRole("button", { name: "Marcar em contato" })).toBeInTheDocument();
    expect(linha("Ana Souza").getByRole("button", { name: "Descontinuar" })).toBeInTheDocument();
    expect(linha("Ana Souza").queryByRole("button", { name: "Aprovar" })).toBeNull();

    expect(linha("Bruno Lima").getByRole("button", { name: "Aprovar" })).toBeInTheDocument();
    expect(linha("Bruno Lima").getByRole("button", { name: "Descontinuar" })).toBeInTheDocument();
    expect(linha("Bruno Lima").queryByRole("button", { name: "Marcar em contato" })).toBeNull();

    expect(linha("Carla Dias").getAllByRole("button").map((botao) => botao.textContent)).toEqual(["Ver detalhes"]);
  });

  test("ver detalhes abre a triagem completa", async () => {
    abrir();
    await esperarLista();

    fireEvent.click(linha("Carla Dias").getByRole("button", { name: "Ver detalhes" }));

    expect(linha("Carla Dias").getByText("02/10/2026")).toBeInTheDocument();
    expect(linha("Carla Dias").getByText("Tipo de moradia")).toBeInTheDocument();
    expect(linha("Carla Dias").getByRole("button", { name: "Esconder detalhes" })).toHaveAttribute(
      "aria-expanded",
      "true",
    );
  });

  test("os descontinuados ficam recolhidos e abrem pelo cartão do animal", async () => {
    abrir();
    await esperarLista();
    const tobias = cartaoDoAnimal("Tobias");

    expect(screen.queryByRole("heading", { name: "Davi Rocha" })).toBeNull();
    expect(
      tobias.getByText(/1 interesse descontinuado automaticamente quando esta adoção foi aprovada/),
    ).toBeInTheDocument();

    fireEvent.click(tobias.getByRole("button", { name: "Mostrar interesses descontinuados de Tobias" }));

    expect(linha("Davi Rocha").getByText("Descontinuado")).toBeInTheDocument();
    expect(linha("Davi Rocha").getByText(MOTIVO_PADRAO)).toBeInTheDocument();
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

    fireEvent.click(screen.getByRole("button", { name: "Pendente 1" }));

    expect(screen.getByRole("heading", { name: "Ana Souza" })).toBeInTheDocument();
    expect(screen.queryByRole("heading", { name: "Bruno Lima" })).toBeNull();
    expect(screen.queryByRole("region", { name: "Tobias" })).toBeNull();
  });

  test("o filtro Descontinuado mostra os descontinuados direto, sem recolher", async () => {
    abrir();
    await esperarLista();

    fireEvent.click(screen.getByRole("button", { name: "Descontinuado 1" }));

    expect(linha("Davi Rocha").getByText(MOTIVO_PADRAO)).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: /interesses descontinuados de/ })).toBeNull();
    expect(screen.queryByRole("region", { name: "Mel" })).toBeNull();
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
  test("marcar em contato manda o PATCH e atualiza a lista", async () => {
    abrir();
    await esperarLista();

    fireEvent.click(linha("Ana Souza").getByRole("button", { name: "Marcar em contato" }));

    expect(await screen.findByText("O interesse de Ana Souza foi marcado como em contato.")).toBeInTheDocument();
    expect(await linha("Ana Souza").findByText("Em contato")).toBeInTheDocument();
    const [[url, opcoes]] = chamadas("PATCH", "/status");
    expect(url).toBe(`http://api.teste/api/interesses/${ana.id}/status`);
    expect(opcoes.headers.Authorization).toBe("Bearer token-de-teste");
    expect(JSON.parse(opcoes.body)).toEqual({ statusAndamento: "EM_CONTATO" });
    expect(chamadas("GET", "/api/interesses/recebidos")).toHaveLength(2);
  });

  test("aprovar pede confirmação, adota o animal e recolhe os outros interesses", async () => {
    abrir();
    await esperarLista();

    fireEvent.click(linha("Bruno Lima").getByRole("button", { name: "Aprovar" }));
    expect(screen.getByText("Aprovar Bruno Lima para adotar Mel?")).toBeInTheDocument();
    expect(chamadas("PATCH", "/status")).toHaveLength(0);

    fireEvent.click(screen.getByRole("button", { name: "Confirmar aprovação" }));

    expect(await screen.findByText(/Adoção de Mel aprovada para Bruno Lima/)).toBeInTheDocument();
    expect(await linha("Bruno Lima").findByText("Aprovado")).toBeInTheDocument();
    const mel = cartaoDoAnimal("Mel");
    expect(mel.getByText("Adotado")).toBeInTheDocument();
    expect(mel.getByText("Histórico encerrado")).toBeInTheDocument();
    expect(screen.queryByRole("heading", { name: "Ana Souza" })).toBeNull();
    expect(
      mel.getByText(/1 interesse descontinuado automaticamente quando esta adoção foi aprovada/),
    ).toBeInTheDocument();
    expect(JSON.parse(chamadas("PATCH", "/status")[0][1].body)).toEqual({ statusAndamento: "APROVADO" });
  });

  test("dá pra voltar atrás antes de aprovar", async () => {
    abrir();
    await esperarLista();

    fireEvent.click(linha("Bruno Lima").getByRole("button", { name: "Aprovar" }));
    fireEvent.click(screen.getByRole("button", { name: "Voltar" }));

    expect(linha("Bruno Lima").getByRole("button", { name: "Aprovar" })).toBeInTheDocument();
    expect(chamadas("PATCH", "/status")).toHaveLength(0);
  });

  test("descontinuar exige o motivo e envia junto", async () => {
    abrir();
    await esperarLista();

    fireEvent.click(linha("Ana Souza").getByRole("button", { name: "Descontinuar" }));
    fireEvent.click(linha("Ana Souza").getByRole("button", { name: "Confirmar" }));
    expect(screen.getByText("Escreva o motivo. O candidato vai ver essa mensagem.")).toBeInTheDocument();
    expect(chamadas("PATCH", "/status")).toHaveLength(0);

    const motivo = "Procuramos uma casa com tela nas janelas.";
    fireEvent.change(screen.getByLabelText("Por que você vai descontinuar o interesse de Ana Souza?"), {
      target: { value: motivo },
    });
    fireEvent.click(linha("Ana Souza").getByRole("button", { name: "Confirmar" }));

    expect(await screen.findByText("O interesse de Ana Souza foi descontinuado.")).toBeInTheDocument();
    expect(JSON.parse(chamadas("PATCH", "/status")[0][1].body)).toEqual({
      statusAndamento: "DESCONTINUADO",
      motivoDescontinuacao: motivo,
    });

    // Sai da lista e fica recolhida no fim do cartão da Mel
    const mel = cartaoDoAnimal("Mel");
    expect(await mel.findByText(/^1 interesse descontinuado\./)).toBeInTheDocument();
    fireEvent.click(mel.getByRole("button", { name: "Mostrar interesses descontinuados de Mel" }));
    expect(linha("Ana Souza").getByText(motivo)).toBeInTheDocument();
  });

  test("recusa da API aparece na linha do candidato", async () => {
    simularPainel({
      recusarStatus: resposta(409, { status: 409, mensagem: "Este animal já foi adotado" }),
    });
    abrir();
    await esperarLista();

    fireEvent.click(linha("Bruno Lima").getByRole("button", { name: "Aprovar" }));
    fireEvent.click(screen.getByRole("button", { name: "Confirmar aprovação" }));

    expect(await linha("Bruno Lima").findByRole("alert")).toHaveTextContent("Este animal já foi adotado");
    expect(chamadas("GET", "/api/interesses/recebidos")).toHaveLength(1);
  });
});
