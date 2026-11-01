import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { MemoryRouter, Route, Routes, useLocation } from "react-router-dom";
import { AuthProvider } from "../src/contexts/AuthContext";
import { artigoExemplo } from "../src/mocks/artigos";
import FormularioArtigo from "../src/pages/FormularioArtigo/FormularioArtigo";
import { resposta, simularApi } from "./utils/apiFalsa";

// Escrever um artigo (/blog/novo) e editar (/blog/:id/editar)

const CHAVE = "adotaaqui.sessao";
const ID = artigoExemplo.id;
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

function simular({ podePublicar = true, artigo = { ehMeu: true }, respostaDoArtigo, respostaDoEnvio } = {}) {
  enviado = null;
  metodoDoEnvio = null;
  simularApi({
    outras: (metodo, caminho, opcoes) => {
      if (caminho === "/api/artigos/meus") return resposta(200, { podePublicar, artigos: [] });
      if ((caminho === "/api/artigos" && metodo === "POST") || (caminho === `/api/artigos/${ID}` && metodo === "PUT")) {
        enviado = JSON.parse(opcoes.body);
        metodoDoEnvio = metodo;
        return respostaDoEnvio ?? resposta(metodo === "POST" ? 201 : 200, { ...artigoExemplo, id: ID });
      }
      if (caminho === `/api/artigos/${ID}`) return respostaDoArtigo?.() ?? resposta(200, { ...artigoExemplo, ...artigo });
      return undefined;
    },
  });
}

// Mostra o aviso que o formulário manda pro artigo
function ArtigoSalvo() {
  const { state } = useLocation();
  return <p>Artigo salvo: {state?.aviso}</p>;
}

function abrir(endereco = "/blog/novo") {
  render(
    <MemoryRouter initialEntries={[endereco]}>
      <AuthProvider>
        <Routes>
          <Route path="/blog/novo" element={<FormularioArtigo />} />
          <Route path="/blog/:id/editar" element={<FormularioArtigo />} />
          <Route path="/blog/:id" element={<ArtigoSalvo />} />
        </Routes>
      </AuthProvider>
    </MemoryRouter>,
  );
}

function preencher({ titulo = "Converse com a família antes", assunto = "ADOCAO_RESPONSAVEL", texto = TEXTO } = {}) {
  fireEvent.change(screen.getByLabelText("Título"), { target: { value: titulo } });
  fireEvent.change(screen.getByLabelText("Assunto"), { target: { value: assunto } });
  fireEvent.change(screen.getByLabelText("Texto do artigo"), { target: { value: texto } });
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
    await screen.findByRole("heading", { level: 1, name: "Pra escrever artigos, cadastre um animal primeiro" }),
  ).toBeInTheDocument();
  expect(screen.getByRole("link", { name: "Cadastrar um animal" })).toHaveAttribute("href", "/meus-animais/novo");
});

test("sem título, assunto e texto, não envia e leva o foco pro primeiro problema", async () => {
  simular();
  abrir();
  await screen.findByLabelText("Título");
  expect(document.title).toBe("Escrever um artigo | Adota Aqui");
  expect(screen.getByText("0/10000")).toBeInTheDocument();

  fireEvent.click(screen.getByRole("button", { name: "Publicar artigo" }));

  expect(await screen.findByText("O título deve ter pelo menos 5 caracteres.")).toBeInTheDocument();
  expect(screen.getByText("Escolha o assunto do artigo.")).toBeInTheDocument();
  expect(screen.getByText("O texto deve ter pelo menos 50 caracteres.")).toBeInTheDocument();
  await waitFor(() => expect(document.activeElement).toBe(screen.getByLabelText("Título")));
  expect(enviado).toBeNull();

  // Corrigiu: a mensagem some na hora
  fireEvent.change(screen.getByLabelText("Título"), { target: { value: "Um título bom" } });
  expect(screen.queryByText("O título deve ter pelo menos 5 caracteres.")).not.toBeInTheDocument();
});

test("publica com a capa e abre o artigo com o aviso", async () => {
  simular();
  abrir();
  await screen.findByLabelText("Título");

  preencher({ titulo: "  Converse com a família antes  " });
  const arquivo = new File(["foto"], "capa.jpg", { type: "image/jpeg" });
  fireEvent.change(screen.getByLabelText("Escolher uma foto"), { target: { files: [arquivo] } });
  expect(await screen.findByRole("img", { name: "Foto de capa do artigo" })).toHaveAttribute(
    "src",
    "https://fotos.teste/animais/1.jpg",
  );
  fireEvent.click(screen.getByRole("button", { name: "Publicar artigo" }));

  expect(await screen.findByText("Artigo salvo: Seu artigo foi publicado.")).toBeInTheDocument();
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
  fireEvent.click(screen.getByRole("button", { name: "Publicar artigo" }));

  expect(await screen.findByText("Esse título já foi usado")).toBeInTheDocument();
  await waitFor(() => expect(document.activeElement).toBe(screen.getByLabelText("Título")));
});

test("outro erro da API aparece embaixo do formulário", async () => {
  simular({ respostaDoEnvio: resposta(400, { status: 400, mensagem: "Envie a foto pelo próprio site" }) });
  abrir();
  await screen.findByLabelText("Título");

  preencher();
  fireEvent.click(screen.getByRole("button", { name: "Publicar artigo" }));

  expect(await screen.findByRole("alert")).toHaveTextContent("Envie a foto pelo próprio site");
  expect(screen.getByRole("button", { name: "Publicar artigo" })).toBeEnabled();
});

test("editar traz o artigo preenchido, salva com PUT e abre o artigo com o aviso", async () => {
  simular();
  abrir(`/blog/${ID}/editar`);

  expect(await screen.findByLabelText("Título")).toHaveValue(artigoExemplo.titulo);
  expect(screen.getByLabelText("Assunto")).toHaveValue("PRIMEIROS_DIAS");
  expect(screen.getByLabelText("Texto do artigo")).toHaveValue(artigoExemplo.conteudo);
  expect(screen.getByRole("link", { name: "Cancelar" })).toHaveAttribute("href", `/blog/${ID}`);
  expect(document.title).toBe("Editar artigo | Adota Aqui");

  fireEvent.change(screen.getByLabelText("Título"), { target: { value: "Os primeiros dias do gato" } });
  fireEvent.click(screen.getByRole("button", { name: "Salvar alterações" }));

  expect(await screen.findByText("Artigo salvo: As alterações no artigo foram salvas.")).toBeInTheDocument();
  expect(metodoDoEnvio).toBe("PUT");
  expect(enviado).toMatchObject({ titulo: "Os primeiros dias do gato", categoria: "PRIMEIROS_DIAS" });
});

test("artigo de outra pessoa não abre pra edição", async () => {
  simular({ artigo: { ehMeu: false } });
  abrir(`/blog/${ID}/editar`);

  expect(
    await screen.findByRole("heading", { level: 1, name: "Só quem escreveu pode editar este artigo" }),
  ).toBeInTheDocument();
  expect(screen.getByRole("link", { name: "Ler o artigo" })).toHaveAttribute("href", `/blog/${ID}`);
});

test("artigo que não existe mostra o aviso", async () => {
  simular({ respostaDoArtigo: () => resposta(404, { status: 404, mensagem: "Artigo não encontrado" }) });
  abrir(`/blog/${ID}/editar`);

  expect(await screen.findByRole("heading", { level: 1, name: "Artigo não encontrado" })).toBeInTheDocument();
});

test("se não der pra carregar, avisa e deixa tentar de novo", async () => {
  let tentativas = 0;
  simular({
    respostaDoArtigo: () => {
      tentativas += 1;
      return tentativas === 1 ? resposta(500, { status: 500, mensagem: "Erro interno" }) : undefined;
    },
  });
  abrir(`/blog/${ID}/editar`);

  expect(await screen.findByRole("alert")).toHaveTextContent("Não foi possível carregar");
  fireEvent.click(screen.getByRole("button", { name: "Tentar de novo" }));
  expect(await screen.findByLabelText("Título")).toHaveValue(artigoExemplo.titulo);
});
