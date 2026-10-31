import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { MemoryRouter, Route, Routes, useLocation } from "react-router-dom";
import { AuthProvider } from "../src/contexts/AuthContext";
import { dicaExemplo } from "../src/mocks/dicas";
import Dica from "../src/pages/Dica/Dica";
import { resposta, simularApi } from "./utils/apiFalsa";

// Uma dica inteira, em /dicas/:id

const CHAVE = "adotaaqui.sessao";
const ID = dicaExemplo.id;

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

// "dica" troca campos da dica de exemplo. "responder" decide a resposta do GET (recebe o número da tentativa)
let apagou;
function simular({ dica = {}, responder, respostaDoApagar } = {}) {
  apagou = false;
  let tentativas = 0;
  simularApi({
    outras: (metodo, caminho) => {
      if (caminho !== `/api/dicas/${ID}`) return undefined;
      if (metodo === "DELETE") {
        apagou = true;
        return respostaDoApagar ?? resposta(204, null);
      }
      tentativas += 1;
      return responder?.(tentativas) ?? resposta(200, { ...dicaExemplo, ...dica });
    },
  });
}

// Mostra o aviso que a tela manda pra lista de dicas
function ListaDeDicas() {
  const { state } = useLocation();
  return <p>Lista de dicas: {state?.aviso}</p>;
}

function abrir(estado) {
  render(
    <MemoryRouter initialEntries={[{ pathname: `/dicas/${ID}`, state: estado }]}>
      <AuthProvider>
        <Routes>
          <Route path="/dicas/:id" element={<Dica />} />
          <Route path="/dicas" element={<ListaDeDicas />} />
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
  expect(screen.getByText(/\(abrigo\), de Santo André\/SP\. Publicada em 29\/10\/2026\./)).toBeInTheDocument();
  expect(screen.getByText(/Deixe o gato começar por um cômodo só/).tagName).toBe("P");
  expect(screen.getByText("Antes de liberar a casa toda, confira se as janelas estão teladas.")).toBeInTheDocument();
  expect(screen.getByRole("link", { name: "Todas as dicas" })).toHaveAttribute("href", "/dicas");
  expect(screen.queryByRole("link", { name: "Editar dica" })).not.toBeInTheDocument();
  expect(document.title).toBe("Os primeiros dias do gato em casa | Adota Aqui");
});

test("dica de pessoa, editada e com capa: mostra a data da edição e a foto", async () => {
  simular({
    dica: {
      autor: { nome: "Maria Pinheiro", tipo: "USUARIO", cidade: "Porto Alegre", estado: "RS" },
      atualizadaEm: "2026-10-30T09:00:00",
      fotoCapa: "https://fotos.teste/animais/capa.jpg",
    },
  });
  abrir();

  expect(
    await screen.findByText(/, de Porto Alegre\/RS\. Publicada em 29\/10\/2026 e atualizada em 30\/10\/2026\./),
  ).toBeInTheDocument();
  expect(screen.queryByText(/\(abrigo\)/)).not.toBeInTheDocument();
  expect(document.querySelector('img[src="https://fotos.teste/animais/capa.jpg"]')).toHaveAttribute("alt", "");
});

test("quem escreveu edita e apaga, e volta pra lista com o aviso", async () => {
  entrar();
  simular({ dica: { ehMinha: true } });
  abrir({ aviso: "Sua dica foi publicada." });

  expect(await screen.findByText("Sua dica foi publicada.")).toHaveAttribute("role", "status");
  expect(screen.getByRole("link", { name: "Editar dica" })).toHaveAttribute("href", `/dicas/${ID}/editar`);

  const apagar = screen.getByRole("button", { name: "Apagar dica" });
  fireEvent.click(apagar);
  expect(apagar).toHaveAttribute("aria-expanded", "true");
  expect(screen.getByText("Apagar esta dica de vez?")).toBeInTheDocument();

  // Voltar fecha a confirmação e devolve o foco
  fireEvent.click(screen.getByRole("button", { name: "Voltar" }));
  expect(screen.queryByText("Apagar esta dica de vez?")).not.toBeInTheDocument();
  expect(document.activeElement).toBe(apagar);

  fireEvent.click(apagar);
  fireEvent.click(screen.getByRole("button", { name: "Confirmar" }));

  expect(
    await screen.findByText('Lista de dicas: A dica "Os primeiros dias do gato em casa" foi apagada.'),
  ).toBeInTheDocument();
  expect(apagou).toBe(true);
});

test("se não der pra apagar, avisa e continua na dica", async () => {
  entrar();
  simular({
    dica: { ehMinha: true },
    respostaDoApagar: resposta(403, { status: 403, mensagem: "Só quem escreveu pode apagar a dica" }),
  });
  abrir();

  fireEvent.click(await screen.findByRole("button", { name: "Apagar dica" }));
  fireEvent.click(screen.getByRole("button", { name: "Confirmar" }));

  expect(await screen.findByRole("alert")).toHaveTextContent("Só quem escreveu pode apagar a dica");
  expect(screen.getByRole("button", { name: "Confirmar" })).toBeEnabled();
});

test("dica que não existe mostra o aviso e o caminho pra lista", async () => {
  simular({ responder: () => resposta(404, { status: 404, mensagem: "Dica não encontrada" }) });
  abrir();

  expect(await screen.findByRole("heading", { level: 1, name: "Dica não encontrada" })).toBeInTheDocument();
  expect(screen.getByRole("link", { name: "Ver todas as dicas" })).toHaveAttribute("href", "/dicas");
  expect(document.title).toBe("Dica não encontrada | Adota Aqui");
});

test("se a API falhar, avisa e deixa tentar de novo", async () => {
  simular({
    responder: (tentativa) =>
      tentativa === 1 ? resposta(500, { status: 500, mensagem: "Erro interno" }) : undefined,
  });
  abrir();

  expect(
    await screen.findByRole("heading", { level: 1, name: "Não foi possível carregar a dica" }),
  ).toBeInTheDocument();
  fireEvent.click(screen.getByRole("button", { name: "Tentar de novo" }));
  await waitFor(() =>
    expect(
      screen.getByRole("heading", { level: 1, name: "Os primeiros dias do gato em casa" }),
    ).toBeInTheDocument(),
  );
});
