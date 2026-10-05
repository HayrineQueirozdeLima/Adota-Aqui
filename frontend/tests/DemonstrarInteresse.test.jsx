import { fireEvent, render, screen, within } from "@testing-library/react";
import { MemoryRouter, Route, Routes } from "react-router-dom";
import { AuthProvider } from "../src/contexts/AuthContext";
import { perfilExemplo } from "../src/mocks/animais";
import DemonstrarInteresse from "../src/pages/DemonstrarInteresse/DemonstrarInteresse";
import { resposta, simularApi } from "./utils/apiFalsa";

// O formulário confere o que o front garante (aceite marcado e as 6 perguntas respondidas),
// manda o corpo no formato do api.md e mostra os contatos do Protetor depois do 201 (RF09)

const CHAVE = "adotaaqui.sessao";
const ID = perfilExemplo.id;

function entrar() {
  localStorage.setItem(
    CHAVE,
    JSON.stringify({
      token: "token-de-teste",
      tipoConta: "USUARIO",
      id: "1",
      nome: "Ana Souza",
      expiraEm: "2999-01-01T00:00:00Z",
    }),
  );
}

// Por padrão o animal pode receber interesse; cada teste muda o que precisar
function simular({ animal = {}, ...outros } = {}) {
  simularApi({
    responderAnimal: (id) =>
      resposta(200, {
        ...perfilExemplo,
        id,
        podeDemonstrarInteresse: true,
        ...animal,
      }),
    ...outros,
  });
}

function abrir() {
  render(
    <MemoryRouter initialEntries={[`/animais/${ID}/interesse`]}>
      <AuthProvider>
        <Routes>
          <Route
            path="/animais/:id/interesse"
            element={<DemonstrarInteresse />}
          />
        </Routes>
      </AuthProvider>
    </MemoryRouter>,
  );
}

async function esperarFormulario() {
  await screen.findByRole("heading", {
    level: 1,
    name: "Demonstrar interesse em Mel",
  });
}

// Escolhe a opção dentro da pergunta certa (várias perguntas têm "Prefiro responder...")
function responder(pergunta, opcao) {
  fireEvent.click(
    within(screen.getByRole("group", { name: pergunta })).getByLabelText(opcao),
  );
}

function preencherTudo() {
  fireEvent.click(
    screen.getByLabelText(
      "Li e aceito o termo de compromisso e guarda responsável.",
    ),
  );
  responder("Tipo de moradia", "Casa com quintal");
  responder("Convivência com crianças", "Não há crianças em casa");
  responder("Tempo que o animal ficará sozinho", "Até 4 horas");
  responder(
    "Convivência com outros animais",
    "Prefiro responder diretamente ao Protetor",
  );
  responder("Quando viajar", "Deixo com alguém de confiança");
  responder("Melhor momento para contato", "Noite");
}

function confirmar() {
  fireEvent.click(screen.getByRole("button", { name: "Confirmar interesse" }));
}

function chamadasDeInteresse() {
  return fetch.mock.calls.filter(([url]) => url.endsWith("/interesses"));
}

beforeEach(() => {
  entrar();
  simular();
});

afterEach(() => {
  localStorage.clear();
  sessionStorage.clear();
});

test("mostra o termo, as três partes da triagem e o resumo do animal", async () => {
  abrir();
  await esperarFormulario();

  expect(
    screen.getByRole("heading", { name: "Compromisso e guarda responsável" }),
  ).toBeInTheDocument();
  expect(
    screen.getByRole("heading", { name: "Parte 1 · Moradia e família" }),
  ).toBeInTheDocument();
  expect(
    screen.getByRole("heading", { name: "Parte 2 · Rotina" }),
  ).toBeInTheDocument();
  expect(
    screen.getByRole("heading", { name: "Parte 3 · Contato" }),
  ).toBeInTheDocument();
  expect(
    screen.getByText("Protetor: Instituto Quatro Patas · Santo André/SP"),
  ).toBeInTheDocument();
});

test("a pergunta de contato não tem a opção de responder depois (RF15)", async () => {
  abrir();
  await esperarFormulario();

  const contato = screen.getByRole("group", {
    name: "Melhor momento para contato",
  });
  expect(
    within(contato).queryByLabelText(
      "Prefiro responder diretamente ao Protetor",
    ),
  ).toBeNull();
  const moradia = screen.getByRole("group", { name: "Tipo de moradia" });
  expect(
    within(moradia).getByLabelText("Prefiro responder diretamente ao Protetor"),
  ).toBeInTheDocument();
});

test("sem aceite e sem respostas, não envia e leva o foco pro primeiro erro", async () => {
  abrir();
  await esperarFormulario();
  confirmar();

  const aceite = screen.getByLabelText(
    "Li e aceito o termo de compromisso e guarda responsável.",
  );
  expect(screen.getByText(/Pra continuar, aceite o termo/)).toBeInTheDocument();
  expect(screen.getAllByText("Escolha uma opção.")).toHaveLength(6);
  expect(aceite).toHaveFocus();
  expect(chamadasDeInteresse()).toHaveLength(0);
});

test("o erro da pergunta some assim que ela é respondida", async () => {
  abrir();
  await esperarFormulario();
  confirmar();

  responder("Tipo de moradia", "Casa com quintal");
  expect(screen.getAllByText("Escolha uma opção.")).toHaveLength(5);
});

test("envia o aceite e a triagem com o token e mostra os contatos do Protetor", async () => {
  abrir();
  await esperarFormulario();
  preencherTudo();
  confirmar();

  expect(
    await screen.findByRole("heading", {
      name: /Marina Prado já pode falar com você/,
    }),
  ).toBeInTheDocument();
  expect(
    screen.getByRole("link", { name: "WhatsApp: (69) 99999-8888" }),
  ).toHaveAttribute("href", "https://wa.me/5569999998888");
  expect(
    screen.getByRole("link", { name: "marina@example.com" }),
  ).toHaveAttribute("href", "mailto:marina@example.com");

  const [[url, opcoes]] = chamadasDeInteresse();
  expect(url).toBe(`http://api.teste/api/animais/${ID}/interesses`);
  expect(opcoes.method).toBe("POST");
  expect(opcoes.headers.Authorization).toBe("Bearer token-de-teste");
  expect(JSON.parse(opcoes.body)).toEqual({
    aceiteTermo: true,
    triagem: {
      moradia: "CASA_COM_QUINTAL",
      criancas: "NAO",
      tempoSozinho: "ATE_4_HORAS",
      outrosAnimais: "PREFIRO_RESPONDER_DIRETAMENTE_AO_PROTETOR",
      programacaoViagem: "DEIXO_NOS_CUIDADOS_DE_ALGUEM_DE_CONFIANCA",
      momentoContato: "NOITE",
    },
  });
});

test("mostra a mensagem da API quando ela recusa (ex.: 409)", async () => {
  simular({
    responderInteresse: () =>
      resposta(409, {
        status: 409,
        mensagem: "Você já demonstrou interesse neste animal",
      }),
  });
  abrir();
  await esperarFormulario();
  preencherTudo();
  confirmar();

  expect(await screen.findByRole("alert")).toHaveTextContent(
    "Você já demonstrou interesse neste animal",
  );
  expect(
    screen.getByRole("button", { name: "Confirmar interesse" }),
  ).toBeEnabled();
});

test("erro de campo vindo da API aparece na pergunta certa", async () => {
  simular({
    responderInteresse: () =>
      resposta(400, {
        status: 400,
        mensagem: "Dados inválidos",
        campos: { "triagem.moradia": "O campo moradia é obrigatório" },
      }),
  });
  abrir();
  await esperarFormulario();
  preencherTudo();
  confirmar();

  const moradia = screen.getByRole("group", { name: "Tipo de moradia" });
  expect(
    await within(moradia).findByText("O campo moradia é obrigatório"),
  ).toBeInTheDocument();
});

test("quem já tem interesse em andamento não vê o formulário", async () => {
  simular({
    animal: {
      podeDemonstrarInteresse: false,
      meuInteresse: { id: "i1", statusAndamento: "PENDENTE" },
    },
  });
  abrir();

  expect(
    await screen.findByRole("heading", {
      name: "Você já demonstrou interesse em Mel",
    }),
  ).toBeInTheDocument();
  expect(
    screen.getByRole("link", { name: "Ver minhas candidaturas" }),
  ).toHaveAttribute("href", "/meus-interesses");
  expect(
    screen.queryByRole("button", { name: "Confirmar interesse" }),
  ).not.toBeInTheDocument();
});

test("animal de outro estado: explica e volta pro perfil", async () => {
  simular({ animal: { podeDemonstrarInteresse: false } });
  abrir();

  expect(
    await screen.findByText(/acontece dentro do mesmo estado/),
  ).toBeInTheDocument();
  expect(screen.getByRole("link", { name: "Voltar para Mel" })).toHaveAttribute(
    "href",
    `/animais/${ID}`,
  );
});
