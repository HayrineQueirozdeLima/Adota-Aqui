import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { MemoryRouter, Route, Routes, useLocation } from "react-router-dom";
import { AuthProvider } from "../src/contexts/AuthContext";
import { minhasCandidaturasExemplo } from "../src/mocks/interesses";
import EscreverDepoimento from "../src/pages/EscreverDepoimento/EscreverDepoimento";
import { resposta, simularApi } from "./utils/apiFalsa";

// Contar como foi a adoção (RF11, UC09), em /meus-interesses/:id/depoimento.
// Nos exemplos, a Amora (m3) foi aprovada e ainda pode receber a história

const CHAVE = "adotaaqui.sessao";
const amora = minhasCandidaturasExemplo[2];

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

// Guarda o que a tela de envio recebeu, pra conferir
let enviado;

function simular({ lista = minhasCandidaturasExemplo, respostaDoEnvio } = {}) {
  enviado = null;
  simularApi({
    outras: (metodo, caminho, opcoes) => {
      if (caminho === "/api/interesses/meus") return resposta(200, lista);
      if (caminho === "/api/interesses/m3/depoimento" && metodo === "POST") {
        enviado = JSON.parse(opcoes.body);
        return respostaDoEnvio ?? resposta(201, { id: "d1" });
      }
      return undefined;
    },
  });
}

// Mostra o aviso que a tela manda pra Minhas candidaturas
function MinhasCandidaturas() {
  const { state } = useLocation();
  return <p>Minhas candidaturas: {state?.aviso}</p>;
}

function abrir(id = "m3") {
  render(
    <MemoryRouter initialEntries={[`/meus-interesses/${id}/depoimento`]}>
      <AuthProvider>
        <Routes>
          <Route path="/meus-interesses/:id/depoimento" element={<EscreverDepoimento />} />
          <Route path="/meus-interesses" element={<MinhasCandidaturas />} />
        </Routes>
      </AuthProvider>
    </MemoryRouter>,
  );
}

beforeEach(() => {
  entrarComoPessoa();
});

afterEach(() => {
  localStorage.clear();
});

test("mostra o animal, o prazo e o contador de caracteres", async () => {
  simular();
  abrir();

  expect(
    await screen.findByRole("heading", { level: 1, name: "Como está sendo a vida com Amora?" }),
  ).toBeInTheDocument();
  expect(screen.getByText("Dá pra contar até 28/11/2026.")).toBeInTheDocument();
  expect(screen.getByText("0/1000")).toBeInTheDocument();
  fireEvent.change(screen.getByLabelText("Sua história"), { target: { value: "Ela é ótima" } });
  expect(screen.getByText("11/1000")).toBeInTheDocument();
  expect(document.title).toBe("Contar como foi a adoção de Amora | Adota Aqui");
});

test("sem texto ou sem autorizar, não envia e leva o foco pro primeiro problema", async () => {
  simular();
  abrir();
  await screen.findByLabelText("Sua história");

  fireEvent.click(screen.getByRole("button", { name: "Publicar no mural" }));

  expect(await screen.findByText("Escreva pelo menos 10 caracteres.")).toBeInTheDocument();
  expect(
    screen.getByText("Marque a autorização pra publicar a sua história no mural."),
  ).toBeInTheDocument();
  await waitFor(() => expect(document.activeElement).toBe(screen.getByLabelText("Sua história")));
  expect(enviado).toBeNull();

  // Corrigiu: a mensagem some na hora
  fireEvent.change(screen.getByLabelText("Sua história"), { target: { value: "Agora tem texto" } });
  fireEvent.click(screen.getByRole("checkbox"));
  expect(screen.queryByText("Escreva pelo menos 10 caracteres.")).not.toBeInTheDocument();
  expect(
    screen.queryByText("Marque a autorização pra publicar a sua história no mural."),
  ).not.toBeInTheDocument();
});

test("envia o texto, a foto e a autorização, e volta pras candidaturas com o aviso", async () => {
  simular();
  abrir();
  await screen.findByLabelText("Sua história");

  fireEvent.change(screen.getByLabelText("Sua história"), {
    target: { value: "  A Amora dorme no meu pé todo dia.  " },
  });
  const arquivo = new File(["foto"], "amora.jpg", { type: "image/jpeg" });
  fireEvent.change(screen.getByLabelText("Escolher uma foto"), { target: { files: [arquivo] } });
  expect(await screen.findByRole("img", { name: "Foto de Amora" })).toHaveAttribute(
    "src",
    "https://fotos.teste/animais/1.jpg",
  );
  fireEvent.click(screen.getByRole("checkbox"));
  fireEvent.click(screen.getByRole("button", { name: "Publicar no mural" }));

  expect(
    await screen.findByText("Minhas candidaturas: Sua história com Amora foi publicada no mural."),
  ).toBeInTheDocument();
  expect(enviado).toEqual({
    texto: "A Amora dorme no meu pé todo dia.",
    fotoUrl: "https://fotos.teste/animais/1.jpg",
    autorizaPublicacao: true,
  });
});

test("foto que não é imagem é recusada antes de enviar", async () => {
  simular();
  abrir();
  await screen.findByLabelText("Sua história");

  const pdf = new File(["x"], "documento.pdf", { type: "application/pdf" });
  fireEvent.change(screen.getByLabelText("Escolher uma foto"), { target: { files: [pdf] } });

  expect(screen.getByRole("alert")).toHaveTextContent("Envie uma imagem JPG, PNG ou WEBP.");
});

test("se a API recusar, mostra a mensagem dela", async () => {
  simular({
    respostaDoEnvio: resposta(409, {
      status: 409,
      mensagem: "O prazo de 30 dias pra contar como foi a adoção acabou",
    }),
  });
  abrir();
  await screen.findByLabelText("Sua história");

  fireEvent.change(screen.getByLabelText("Sua história"), {
    target: { value: "Chegou tarde, mas chegou." },
  });
  fireEvent.click(screen.getByRole("checkbox"));
  fireEvent.click(screen.getByRole("button", { name: "Publicar no mural" }));

  expect(await screen.findByRole("alert")).toHaveTextContent(
    "O prazo de 30 dias pra contar como foi a adoção acabou",
  );
});

test("adoção que não pode receber história mostra o aviso no lugar do formulário", async () => {
  simular({ lista: [{ ...amora, podeContarAdocao: false }] });
  abrir();

  expect(
    await screen.findByRole("heading", { name: "Essa história não pode ser contada agora" }),
  ).toBeInTheDocument();
  expect(screen.getByRole("link", { name: "Ver minhas candidaturas" })).toHaveAttribute(
    "href",
    "/meus-interesses",
  );
  expect(screen.queryByLabelText("Sua história")).not.toBeInTheDocument();
});
