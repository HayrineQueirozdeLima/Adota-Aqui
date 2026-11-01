import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { MemoryRouter, Route, Routes, useLocation } from "react-router-dom";
import { AuthProvider } from "../src/contexts/AuthContext";
import { artigoExemplo } from "../src/mocks/artigos";
import Artigo from "../src/pages/Artigo/Artigo";
import { resposta, simularApi } from "./utils/apiFalsa";

// Um artigo inteiro, em /blog/:id

const CHAVE = "adotaaqui.sessao";
const ID = artigoExemplo.id;

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

// "artigo" troca campos do artigo de exemplo. "responder" decide a resposta do GET (recebe o número da tentativa)
let apagou;
function simular({ artigo = {}, responder, respostaDoApagar } = {}) {
  apagou = false;
  let tentativas = 0;
  simularApi({
    outras: (metodo, caminho) => {
      if (caminho !== `/api/artigos/${ID}`) return undefined;
      if (metodo === "DELETE") {
        apagou = true;
        return respostaDoApagar ?? resposta(204, null);
      }
      tentativas += 1;
      return responder?.(tentativas) ?? resposta(200, { ...artigoExemplo, ...artigo });
    },
  });
}

// Mostra o aviso que a tela manda pra lista de artigos
function ListaDeArtigos() {
  const { state } = useLocation();
  return <p>Lista de artigos: {state?.aviso}</p>;
}

function abrir(estado) {
  render(
    <MemoryRouter initialEntries={[{ pathname: `/blog/${ID}`, state: estado }]}>
      <AuthProvider>
        <Routes>
          <Route path="/blog/:id" element={<Artigo />} />
          <Route path="/blog" element={<ListaDeArtigos />} />
        </Routes>
      </AuthProvider>
    </MemoryRouter>,
  );
}

afterEach(() => {
  localStorage.clear();
  document.title = "";
});

test("mostra o título, o assunto, quem escreveu e o texto em parágrafos", async () => {
  simular();
  abrir();

  expect(
    await screen.findByRole("heading", { level: 1, name: "Os primeiros dias do gato em casa" }),
  ).toBeInTheDocument();
  expect(screen.getByText("Primeiros dias em casa")).toBeInTheDocument();
  expect(screen.getByText(/\(abrigo\), de Santo André\/SP\. Publicado em 29\/10\/2026\./)).toBeInTheDocument();
  expect(screen.getByText(/Deixe o gato começar por um cômodo só/).tagName).toBe("P");
  expect(screen.getByText("Antes de liberar a casa toda, confira se as janelas estão teladas.")).toBeInTheDocument();
  expect(screen.getByRole("link", { name: "Voltar pro blog" })).toHaveAttribute("href", "/blog");
  expect(screen.queryByRole("link", { name: "Editar artigo" })).not.toBeInTheDocument();
  expect(document.title).toBe("Os primeiros dias do gato em casa | Adota Aqui");
});

test("artigo de pessoa, editado e com capa: mostra a data da edição e a foto", async () => {
  simular({
    artigo: {
      autor: { nome: "Maria Pinheiro", tipo: "USUARIO", cidade: "Porto Alegre", estado: "RS" },
      atualizadoEm: "2026-10-30T09:00:00",
      fotoCapa: "https://fotos.teste/animais/capa.jpg",
    },
  });
  abrir();

  expect(
    await screen.findByText(/, de Porto Alegre\/RS\. Publicado em 29\/10\/2026 e atualizado em 30\/10\/2026\./),
  ).toBeInTheDocument();
  expect(screen.queryByText(/\(abrigo\)/)).not.toBeInTheDocument();
  expect(document.querySelector('img[src="https://fotos.teste/animais/capa.jpg"]')).toHaveAttribute("alt", "");
});

test("quem escreveu edita e apaga, e volta pra lista com o aviso", async () => {
  entrar();
  simular({ artigo: { ehMeu: true } });
  abrir({ aviso: "Seu artigo foi publicado." });

  expect(await screen.findByText("Seu artigo foi publicado.")).toHaveAttribute("role", "status");
  expect(screen.getByRole("link", { name: "Editar artigo" })).toHaveAttribute("href", `/blog/${ID}/editar`);

  const apagar = screen.getByRole("button", { name: "Apagar artigo" });
  fireEvent.click(apagar);
  expect(apagar).toHaveAttribute("aria-expanded", "true");
  expect(screen.getByText("Apagar este artigo de vez?")).toBeInTheDocument();

  // Voltar fecha a confirmação e devolve o foco
  fireEvent.click(screen.getByRole("button", { name: "Voltar" }));
  expect(screen.queryByText("Apagar este artigo de vez?")).not.toBeInTheDocument();
  expect(document.activeElement).toBe(apagar);

  fireEvent.click(apagar);
  fireEvent.click(screen.getByRole("button", { name: "Confirmar" }));

  expect(
    await screen.findByText('Lista de artigos: O artigo "Os primeiros dias do gato em casa" foi apagado.'),
  ).toBeInTheDocument();
  expect(apagou).toBe(true);
});

test("se não der pra apagar, avisa e continua no artigo", async () => {
  entrar();
  simular({
    artigo: { ehMeu: true },
    respostaDoApagar: resposta(403, { status: 403, mensagem: "Só quem escreveu pode apagar o artigo" }),
  });
  abrir();

  fireEvent.click(await screen.findByRole("button", { name: "Apagar artigo" }));
  fireEvent.click(screen.getByRole("button", { name: "Confirmar" }));

  expect(await screen.findByRole("alert")).toHaveTextContent("Só quem escreveu pode apagar o artigo");
  expect(screen.getByRole("button", { name: "Confirmar" })).toBeEnabled();
});

test("artigo que não existe mostra o aviso e o caminho pra lista", async () => {
  simular({ responder: () => resposta(404, { status: 404, mensagem: "Artigo não encontrado" }) });
  abrir();

  expect(await screen.findByRole("heading", { level: 1, name: "Artigo não encontrado" })).toBeInTheDocument();
  expect(screen.getByRole("link", { name: "Ver todos os artigos" })).toHaveAttribute("href", "/blog");
  expect(document.title).toBe("Artigo não encontrado | Adota Aqui");
});

test("se a API falhar, avisa e deixa tentar de novo", async () => {
  simular({
    responder: (tentativa) =>
      tentativa === 1 ? resposta(500, { status: 500, mensagem: "Erro interno" }) : undefined,
  });
  abrir();

  expect(
    await screen.findByRole("heading", { level: 1, name: "Não foi possível carregar o artigo" }),
  ).toBeInTheDocument();
  fireEvent.click(screen.getByRole("button", { name: "Tentar de novo" }));
  await waitFor(() =>
    expect(
      screen.getByRole("heading", { level: 1, name: "Os primeiros dias do gato em casa" }),
    ).toBeInTheDocument(),
  );
});
