import { fireEvent, render, screen } from "@testing-library/react";
import { MemoryRouter, Route, Routes } from "react-router-dom";
import { AuthProvider } from "../src/contexts/AuthContext";
import { perfilExemplo } from "../src/mocks/animais";
import EditarAnimal from "../src/pages/EditarAnimal/EditarAnimal";
import MeusAnimais from "../src/pages/MeusAnimais/MeusAnimais";
import { resposta, simularApi } from "./utils/apiFalsa";

// Edição e remoção (UC05, RF06). A Mel de exemplo é da conta logada (ehMeu)

const CHAVE = "adotaaqui.sessao";
const ID = perfilExemplo.id;

function entrar() {
  localStorage.setItem(
    CHAVE,
    JSON.stringify({
      token: "token-de-teste",
      tipoConta: "ABRIGO",
      id: "1",
      nome: "Quatro Patas",
      expiraEm: "2999-01-01T00:00:00Z",
    }),
  );
}

// O animal que a API devolve, o que ela responde no PUT e no DELETE, e "Meus animais" vazio
function simular({ animal = {}, put, del } = {}) {
  simularApi({
    responderAnimal: (id) =>
      resposta(200, { ...perfilExemplo, id, ehMeu: true, ...animal }),
    outras: (metodo, caminho, opcoes) => {
      if (metodo === "PUT")
        return put
          ? put(opcoes)
          : resposta(200, { ...perfilExemplo, ...JSON.parse(opcoes.body) });
      if (metodo === "DELETE") return del ? del() : resposta(204, null);
      if (caminho === "/api/animais/meus") return resposta(200, []);
      return undefined;
    },
  });
}

function abrir() {
  render(
    <MemoryRouter initialEntries={[`/meus-animais/${ID}/editar`]}>
      <AuthProvider>
        <Routes>
          <Route path="/meus-animais/:id/editar" element={<EditarAnimal />} />
          <Route path="/meus-animais" element={<MeusAnimais />} />
        </Routes>
      </AuthProvider>
    </MemoryRouter>,
  );
}

async function esperarFormulario() {
  await screen.findByRole("heading", { level: 1, name: "Editar Mel" });
  // as raças da espécie chegaram (a raça da Mel aparece escolhida)
  await screen.findByRole("option", { name: "Labrador" });
}

const chamadas = (metodo) =>
  fetch.mock.calls.filter(([, opcoes]) => opcoes?.method === metodo);

beforeEach(() => {
  entrar();
  simular();
});

afterEach(() => {
  localStorage.clear();
  sessionStorage.clear();
});

test("o formulário vem preenchido com os dados do animal", async () => {
  abrir();
  await esperarFormulario();

  expect(screen.getByLabelText("Nome")).toHaveValue("Mel");
  expect(screen.getByLabelText("Espécie")).toHaveValue("CAO");
  expect(screen.getByLabelText("Raça")).toHaveValue("SRD_CAO");
  expect(screen.getByLabelText("Peso em kg (opcional)")).toHaveValue("14");
  expect(screen.getByLabelText("Nascimento estimado")).toHaveValue("03/2024");
  expect(screen.getByAltText("Foto principal do animal")).toHaveAttribute(
    "src",
    perfilExemplo.fotos[0],
  );
  expect(screen.getByText("Antirrábica")).toBeInTheDocument();
});

test("salva com PUT levando todos os campos e o status, e volta pra Meus animais", async () => {
  abrir();
  await esperarFormulario();
  fireEvent.change(screen.getByLabelText("Nome"), {
    target: { value: "Mel Maria" },
  });
  fireEvent.click(screen.getByRole("button", { name: "Salvar alterações" }));

  expect(
    await screen.findByText("As alterações em Mel Maria foram salvas."),
  ).toBeInTheDocument();
  const [[url, opcoes]] = chamadas("PUT");
  expect(url).toBe(`http://api.teste/api/animais/${ID}`);
  const corpo = JSON.parse(opcoes.body);
  expect(corpo.nome).toBe("Mel Maria");
  expect(corpo.statusAdocao).toBe("DISPONIVEL");
  expect(corpo.fotos).toEqual(perfilExemplo.fotos);
  expect(corpo.vacinas).toEqual([
    { nome: "V10", dose: 2, dataAplicacao: "2026-03-12" },
    { nome: "Antirrábica", dose: 1, dataAplicacao: "2026-04-20" },
  ]);
});

describe("animal adotado (RF06)", () => {
  beforeEach(() => {
    simular({ animal: { statusAdocao: "ADOTADO" } });
  });

  test("só o status fica editável", async () => {
    abrir();
    await esperarFormulario();

    expect(screen.getByText(/foi adotado/)).toBeInTheDocument();
    expect(screen.getByLabelText("Nome")).toBeDisabled();
    expect(screen.getByLabelText("Status")).toBeEnabled();
    expect(
      screen.getByRole("button", { name: "Salvar alterações" }),
    ).toBeDisabled();
    expect(screen.queryByLabelText("Adicionar fotos")).not.toBeInTheDocument();
  });

  test("voltar pra Disponível destrava os campos e pede confirmação antes de salvar", async () => {
    abrir();
    await esperarFormulario();

    fireEvent.change(screen.getByLabelText("Status"), {
      target: { value: "DISPONIVEL" },
    });
    expect(screen.getByLabelText("Nome")).toBeEnabled();

    fireEvent.click(screen.getByRole("button", { name: "Salvar alterações" }));
    expect(
      screen.getByText("Tornar Mel disponível de novo?"),
    ).toBeInTheDocument();
    expect(chamadas("PUT")).toHaveLength(0);

    fireEvent.click(screen.getByRole("button", { name: "Confirmar e salvar" }));
    await screen.findByText("As alterações em Mel foram salvas.");
    expect(JSON.parse(chamadas("PUT")[0][1].body).statusAdocao).toBe(
      "DISPONIVEL",
    );
  });
});

test("remove depois da confirmação, avisando dos interesses, e volta pra Meus animais", async () => {
  abrir();
  await esperarFormulario();

  fireEvent.click(screen.getByRole("button", { name: "Remover Mel" }));
  expect(
    screen.getByText(/interesses recebidos também serão excluídos/),
  ).toBeInTheDocument();
  fireEvent.click(screen.getByRole("button", { name: "Remover de vez" }));

  expect(await screen.findByText("Mel foi removido.")).toBeInTheDocument();
  expect(chamadas("DELETE")[0][0]).toBe(`http://api.teste/api/animais/${ID}`);
});

test("dá pra voltar atrás antes de remover", async () => {
  abrir();
  await esperarFormulario();

  fireEvent.click(screen.getByRole("button", { name: "Remover Mel" }));
  fireEvent.click(screen.getByRole("button", { name: "Voltar" }));

  expect(
    screen.getByRole("button", { name: "Remover Mel" }),
  ).toBeInTheDocument();
  expect(chamadas("DELETE")).toHaveLength(0);
});

test("se a remoção falhar, mostra a mensagem da API", async () => {
  simular({
    del: () =>
      resposta(403, {
        status: 403,
        mensagem: "Somente o cadastrante pode alterar ou remover o animal",
      }),
  });
  abrir();
  await esperarFormulario();

  fireEvent.click(screen.getByRole("button", { name: "Remover Mel" }));
  fireEvent.click(screen.getByRole("button", { name: "Remover de vez" }));

  expect(await screen.findByRole("alert")).toHaveTextContent(
    "Somente o cadastrante pode alterar ou remover o animal",
  );
});

test("quem não cadastrou o animal não vê o formulário", async () => {
  simular({ animal: { ehMeu: false } });
  abrir();

  expect(
    await screen.findByRole("heading", {
      name: "Você não pode editar este animal",
    }),
  ).toBeInTheDocument();
  expect(screen.queryByLabelText("Nome")).not.toBeInTheDocument();
});

test("animal que não existe", async () => {
  simularApi({
    responderAnimal: () =>
      resposta(404, { status: 404, mensagem: "Animal não encontrado" }),
  });
  abrir();

  expect(
    await screen.findByRole("heading", { name: "Animal não encontrado" }),
  ).toBeInTheDocument();
});
