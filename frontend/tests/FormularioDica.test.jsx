import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { MemoryRouter, Route, Routes, useLocation } from "react-router-dom";
import { AuthProvider } from "../src/contexts/AuthContext";
import { dicaExemplo } from "../src/mocks/dicas";
import FormularioDica from "../src/pages/FormularioDica/FormularioDica";
import { resposta, simularApi } from "./utils/apiFalsa";

// Escrever uma dica (/dicas/nova) e editar (/dicas/:id/editar)

const CHAVE = "adotaaqui.sessao";
const ID = dicaExemplo.id;
const TEXTO =
  "Antes de adotar, converse com todo mundo da casa e combine quem vai cuidar da comida e dos passeios.";

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

function simular({ podePublicar = true, dica = { ehMinha: true }, respostaDaDica, respostaDoEnvio } = {}) {
  enviado = null;
  metodoDoEnvio = null;
  simularApi({
    outras: (metodo, caminho, opcoes) => {
      if (caminho === "/api/dicas/minhas") return resposta(200, { podePublicar, dicas: [] });
      if ((caminho === "/api/dicas" && metodo === "POST") || (caminho === `/api/dicas/${ID}` && metodo === "PUT")) {
        enviado = JSON.parse(opcoes.body);
        metodoDoEnvio = metodo;
        return respostaDoEnvio ?? resposta(metodo === "POST" ? 201 : 200, { ...dicaExemplo, id: ID });
      }
      if (caminho === `/api/dicas/${ID}`) return respostaDaDica?.() ?? resposta(200, { ...dicaExemplo, ...dica });
      return undefined;
    },
  });
}

// Mostra o aviso que o formulário manda pra dica
function DicaSalva() {
  const { state } = useLocation();
  return <p>Dica salva: {state?.aviso}</p>;
}

function abrir(endereco = "/dicas/nova") {
  render(
    <MemoryRouter initialEntries={[endereco]}>
      <AuthProvider>
        <Routes>
          <Route path="/dicas/nova" element={<FormularioDica />} />
          <Route path="/dicas/:id/editar" element={<FormularioDica />} />
          <Route path="/dicas/:id" element={<DicaSalva />} />
        </Routes>
      </AuthProvider>
    </MemoryRouter>,
  );
}

function preencher({ titulo = "Converse com a família antes", assunto = "ADOCAO_RESPONSAVEL", texto = TEXTO } = {}) {
  fireEvent.change(screen.getByLabelText("Título"), { target: { value: titulo } });
  fireEvent.change(screen.getByLabelText("Assunto"), { target: { value: assunto } });
  fireEvent.change(screen.getByLabelText("A dica"), { target: { value: texto } });
}

beforeEach(() => {
  entrar();
});

afterEach(() => {
  localStorage.clear();
  document.title = "";
});

test("conta que ainda não é protetora vê o convite pra cadastrar um animal", async () => {
  simular({ podePublicar: false });
  abrir();

  expect(
    await screen.findByRole("heading", { level: 1, name: "Pra escrever dicas, cadastre um animal primeiro" }),
  ).toBeInTheDocument();
  expect(screen.getByRole("link", { name: "Cadastrar um animal" })).toHaveAttribute("href", "/meus-animais/novo");
});

test("sem título, assunto e texto, não envia e leva o foco pro primeiro problema", async () => {
  simular();
  abrir();
  await screen.findByLabelText("Título");
  expect(document.title).toBe("Escrever uma dica | Adota Aqui");
  expect(screen.getByText("0/10000")).toBeInTheDocument();

  fireEvent.click(screen.getByRole("button", { name: "Publicar dica" }));

  expect(await screen.findByText("O título deve ter pelo menos 5 caracteres.")).toBeInTheDocument();
  expect(screen.getByText("Escolha o assunto da dica.")).toBeInTheDocument();
  expect(screen.getByText("A dica deve ter pelo menos 50 caracteres.")).toBeInTheDocument();
  await waitFor(() => expect(document.activeElement).toBe(screen.getByLabelText("Título")));
  expect(enviado).toBeNull();

  // Corrigiu: a mensagem some na hora
  fireEvent.change(screen.getByLabelText("Título"), { target: { value: "Um título bom" } });
  expect(screen.queryByText("O título deve ter pelo menos 5 caracteres.")).not.toBeInTheDocument();
});

test("publica com a capa e abre a dica com o aviso", async () => {
  simular();
  abrir();
  await screen.findByLabelText("Título");

  preencher({ titulo: "  Converse com a família antes  " });
  const arquivo = new File(["foto"], "capa.jpg", { type: "image/jpeg" });
  fireEvent.change(screen.getByLabelText("Escolher uma foto"), { target: { files: [arquivo] } });
  expect(await screen.findByRole("img", { name: "Foto de capa da dica" })).toHaveAttribute(
    "src",
    "https://fotos.teste/animais/1.jpg",
  );
  fireEvent.click(screen.getByRole("button", { name: "Publicar dica" }));

  expect(await screen.findByText("Dica salva: Sua dica foi publicada.")).toBeInTheDocument();
  expect(metodoDoEnvio).toBe("POST");
  expect(enviado).toEqual({
    titulo: "Converse com a família antes",
    categoria: "ADOCAO_RESPONSAVEL",
    conteudo: TEXTO,
    fotoCapa: "https://fotos.teste/animais/1.jpg",
  });
});

test("o erro de um campo que volta da API aparece no campo", async () => {
  simular({
    respostaDoEnvio: resposta(400, {
      status: 400,
      mensagem: "Dados inválidos",
      campos: { titulo: "Esse título já foi usado" },
    }),
  });
  abrir();
  await screen.findByLabelText("Título");

  preencher();
  fireEvent.click(screen.getByRole("button", { name: "Publicar dica" }));

  expect(await screen.findByText("Esse título já foi usado")).toBeInTheDocument();
  await waitFor(() => expect(document.activeElement).toBe(screen.getByLabelText("Título")));
});

test("outro erro da API aparece embaixo do formulário", async () => {
  simular({ respostaDoEnvio: resposta(400, { status: 400, mensagem: "Envie a foto pelo próprio site" }) });
  abrir();
  await screen.findByLabelText("Título");

  preencher();
  fireEvent.click(screen.getByRole("button", { name: "Publicar dica" }));

  expect(await screen.findByRole("alert")).toHaveTextContent("Envie a foto pelo próprio site");
  expect(screen.getByRole("button", { name: "Publicar dica" })).toBeEnabled();
});

test("editar traz a dica preenchida, salva com PUT e abre a dica com o aviso", async () => {
  simular();
  abrir(`/dicas/${ID}/editar`);

  expect(await screen.findByLabelText("Título")).toHaveValue(dicaExemplo.titulo);
  expect(screen.getByLabelText("Assunto")).toHaveValue("PRIMEIROS_DIAS");
  expect(screen.getByLabelText("A dica")).toHaveValue(dicaExemplo.conteudo);
  expect(screen.getByRole("link", { name: "Cancelar" })).toHaveAttribute("href", `/dicas/${ID}`);
  expect(document.title).toBe("Editar dica | Adota Aqui");

  fireEvent.change(screen.getByLabelText("Título"), { target: { value: "Os primeiros dias do gato" } });
  fireEvent.click(screen.getByRole("button", { name: "Salvar alterações" }));

  expect(await screen.findByText("Dica salva: As alterações na dica foram salvas.")).toBeInTheDocument();
  expect(metodoDoEnvio).toBe("PUT");
  expect(enviado).toMatchObject({ titulo: "Os primeiros dias do gato", categoria: "PRIMEIROS_DIAS" });
});

test("dica de outra pessoa não abre pra edição", async () => {
  simular({ dica: { ehMinha: false } });
  abrir(`/dicas/${ID}/editar`);

  expect(
    await screen.findByRole("heading", { level: 1, name: "Só quem escreveu pode editar esta dica" }),
  ).toBeInTheDocument();
  expect(screen.getByRole("link", { name: "Ler a dica" })).toHaveAttribute("href", `/dicas/${ID}`);
});

test("dica que não existe mostra o aviso", async () => {
  simular({ respostaDaDica: () => resposta(404, { status: 404, mensagem: "Dica não encontrada" }) });
  abrir(`/dicas/${ID}/editar`);

  expect(await screen.findByRole("heading", { level: 1, name: "Dica não encontrada" })).toBeInTheDocument();
});

test("se não der pra carregar, avisa e deixa tentar de novo", async () => {
  let tentativas = 0;
  simular({
    respostaDaDica: () => {
      tentativas += 1;
      return tentativas === 1 ? resposta(500, { status: 500, mensagem: "Erro interno" }) : undefined;
    },
  });
  abrir(`/dicas/${ID}/editar`);

  expect(await screen.findByRole("alert")).toHaveTextContent("Não foi possível carregar");
  fireEvent.click(screen.getByRole("button", { name: "Tentar de novo" }));
  expect(await screen.findByLabelText("Título")).toHaveValue(dicaExemplo.titulo);
});
