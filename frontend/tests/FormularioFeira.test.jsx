import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { MemoryRouter, Route, Routes, useLocation } from "react-router-dom";
import { AuthProvider } from "../src/contexts/AuthContext";
import { feirasExemplo } from "../src/mocks/feiras";
import FormularioFeira from "../src/pages/FormularioFeira/FormularioFeira";
import { resposta, simularApi } from "./utils/apiFalsa";

// Divulgar uma feira (/feiras/nova) e editar (/feiras/:id/editar). Só abrigo chega aqui (ver App.test.jsx)

const CHAVE = "adotaaqui.sessao";
const FEIRA = feirasExemplo[0];

function entrar() {
  localStorage.setItem(
    CHAVE,
    JSON.stringify({
      token: "token-de-teste",
      tipoConta: "ABRIGO",
      id: "a1",
      nome: "Instituto Quatro Patas",
      expiraEm: "2999-01-01T00:00:00Z",
    }),
  );
}

// Guarda o que foi enviado, pra conferir
let enviado;
let metodoDoEnvio;

function simular({ feira = { ehMinha: true }, respostaDaFeira, respostaDoEnvio } = {}) {
  enviado = null;
  metodoDoEnvio = null;
  simularApi({
    outras: (metodo, caminho, opcoes) => {
      if ((caminho === "/api/feiras" && metodo === "POST") || (caminho === `/api/feiras/${FEIRA.id}` && metodo === "PUT")) {
        enviado = JSON.parse(opcoes.body);
        metodoDoEnvio = metodo;
        return respostaDoEnvio ?? resposta(metodo === "POST" ? 201 : 200, FEIRA);
      }
      if (caminho === `/api/feiras/${FEIRA.id}`) return respostaDaFeira?.() ?? resposta(200, { ...FEIRA, ...feira });
      return undefined;
    },
  });
}

// Mostra o aviso que o formulário manda pra página de feiras
function FeirasDepois() {
  const { state } = useLocation();
  return <p>Página de feiras: {state?.aviso}</p>;
}

function abrir(endereco = "/feiras/nova") {
  render(
    <MemoryRouter initialEntries={[endereco]}>
      <AuthProvider>
        <Routes>
          <Route path="/feiras/nova" element={<FormularioFeira />} />
          <Route path="/feiras/:id/editar" element={<FormularioFeira />} />
          <Route path="/feiras" element={<FeirasDepois />} />
        </Routes>
      </AuthProvider>
    </MemoryRouter>,
  );
}

function escrever(rotulo, valor) {
  fireEvent.change(screen.getByLabelText(rotulo), { target: { value: valor } });
}

function preencher() {
  escrever("Título", "Feira de adoção da praça");
  escrever("Data", "2030-03-16");
  escrever("Começa às", "09:00");
  escrever("Termina às", "13:00");
  escrever("Nome do local", "Praça do Carmo");
  escrever("Endereço", "Rua Coronel Oliveira Lima, 100, Centro");
}

beforeEach(() => {
  entrar();
});

afterEach(() => {
  localStorage.clear();
  document.title = "";
});

test("divulga a feira com a cidade do abrigo já preenchida e volta pra lista com o aviso", async () => {
  simular();
  abrir();

  expect(screen.getByRole("heading", { level: 1, name: "Divulgar uma feira" })).toBeInTheDocument();
  expect(document.title).toBe("Divulgar uma feira | Adota Aqui");
  // perfilAbrigoExemplo: Santo André/SP
  await waitFor(() => expect(screen.getByLabelText("Cidade")).toHaveValue("Santo André"));
  expect(screen.getByLabelText("Estado")).toHaveValue("SP");

  preencher();
  escrever("Descrição (opcional)", "  Traga um documento com foto.  ");
  fireEvent.click(screen.getByRole("button", { name: "Divulgar feira" }));

  expect(await screen.findByText(/Página de feiras: A feira foi divulgada/)).toBeInTheDocument();
  expect(metodoDoEnvio).toBe("POST");
  expect(enviado).toEqual({
    titulo: "Feira de adoção da praça",
    data: "2030-03-16",
    horaInicio: "09:00",
    horaFim: "13:00",
    local: "Praça do Carmo",
    endereco: "Rua Coronel Oliveira Lima, 100, Centro",
    cidade: "Santo André",
    estado: "SP",
    descricao: "Traga um documento com foto.",
  });
});

test("sem os campos obrigatórios, marca cada um e leva o foco pro primeiro", async () => {
  simular();
  abrir();
  await waitFor(() => expect(screen.getByLabelText("Cidade")).toHaveValue("Santo André"));

  fireEvent.click(screen.getByRole("button", { name: "Divulgar feira" }));

  expect(screen.getByText("O título deve ter pelo menos 5 caracteres.")).toBeInTheDocument();
  expect(screen.getByText("Informe a data da feira.")).toBeInTheDocument();
  expect(screen.getByText("Informe a hora em que a feira começa.")).toBeInTheDocument();
  expect(screen.getByText("Informe o nome do local.")).toBeInTheDocument();
  expect(screen.getByText("Informe o endereço.")).toBeInTheDocument();
  expect(screen.getByLabelText("Título")).toHaveFocus();
  expect(enviado).toBeNull();
});

test("não aceita feira que já passou nem que termina antes de começar", async () => {
  simular();
  abrir();
  await waitFor(() => expect(screen.getByLabelText("Cidade")).toHaveValue("Santo André"));

  preencher();
  escrever("Data", "2020-01-10");
  escrever("Termina às", "08:30");
  fireEvent.click(screen.getByRole("button", { name: "Divulgar feira" }));

  expect(screen.getByText("A data da feira já passou.")).toBeInTheDocument();
  expect(screen.getByText("A feira deve terminar depois de começar.")).toBeInTheDocument();
  expect(enviado).toBeNull();
});

test("o erro que a API devolve num campo aparece embaixo dele", async () => {
  simular({
    respostaDoEnvio: resposta(400, {
      mensagem: "A data da feira já passou",
      campos: { data: "A data da feira já passou" },
    }),
  });
  abrir();
  await waitFor(() => expect(screen.getByLabelText("Cidade")).toHaveValue("Santo André"));

  preencher();
  fireEvent.click(screen.getByRole("button", { name: "Divulgar feira" }));

  expect(await screen.findByText("A data da feira já passou")).toBeInTheDocument();
  expect(screen.getByLabelText("Data")).toHaveFocus();
});

test("erro sem campo aparece em cima dos botões", async () => {
  simular({ respostaDoEnvio: resposta(403, { mensagem: "Só abrigos divulgam feiras de adoção" }) });
  abrir();
  await waitFor(() => expect(screen.getByLabelText("Cidade")).toHaveValue("Santo André"));

  preencher();
  fireEvent.click(screen.getByRole("button", { name: "Divulgar feira" }));

  expect(await screen.findByRole("alert")).toHaveTextContent("Só abrigos divulgam feiras de adoção");
  expect(screen.getByRole("button", { name: "Divulgar feira" })).toBeEnabled();
});

describe("editar", () => {
  test("carrega a feira, salva com PUT e volta pra lista", async () => {
    simular();
    abrir(`/feiras/${FEIRA.id}/editar`);

    expect(await screen.findByLabelText("Título")).toHaveValue(FEIRA.titulo);
    expect(screen.getByLabelText("Começa às")).toHaveValue("09:00");
    expect(screen.getByLabelText("Termina às")).toHaveValue("13:00");
    expect(screen.getByLabelText("Estado")).toHaveValue("RO");

    escrever("Título", "Feira de adoção no Parque");
    fireEvent.click(screen.getByRole("button", { name: "Salvar alterações" }));

    expect(await screen.findByText("Página de feiras: As alterações na feira foram salvas.")).toBeInTheDocument();
    expect(metodoDoEnvio).toBe("PUT");
    expect(enviado.titulo).toBe("Feira de adoção no Parque");
    expect(enviado.horaInicio).toBe("09:00");
  });

  test("feira de outro abrigo não abre pra editar", async () => {
    simular({ feira: { ehMinha: false } });
    abrir(`/feiras/${FEIRA.id}/editar`);

    expect(
      await screen.findByRole("heading", { name: "Só o abrigo que divulgou pode editar esta feira" }),
    ).toBeInTheDocument();
  });

  test("feira que não existe mais", async () => {
    simular({ respostaDaFeira: () => resposta(404, { mensagem: "Feira não encontrada" }) });
    abrir(`/feiras/${FEIRA.id}/editar`);

    expect(await screen.findByRole("heading", { name: "Feira não encontrada" })).toBeInTheDocument();
  });

  test("se a API falhar, deixa tentar de novo", async () => {
    let falhar = true;
    simular({ respostaDaFeira: () => (falhar ? resposta(500, {}) : resposta(200, { ...FEIRA, ehMinha: true })) });
    abrir(`/feiras/${FEIRA.id}/editar`);

    expect(await screen.findByRole("heading", { name: "Não foi possível carregar" })).toBeInTheDocument();
    falhar = false;
    fireEvent.click(screen.getByRole("button", { name: "Tentar de novo" }));
    expect(await screen.findByLabelText("Título")).toHaveValue(FEIRA.titulo);
  });
});
