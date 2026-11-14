import { fireEvent, render, screen, waitFor, within } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { AuthProvider } from "../src/contexts/AuthContext";
import ChamadaDaIa from "../src/components/ChamadaDaIa/ChamadaDaIa";
import { esquecerIaDisponivel } from "../src/hooks/useIaDisponivel";
import { animaisExemplo } from "../src/mocks/animais";
import MeAjudaAEscolher from "../src/pages/MeAjudaAEscolher/MeAjudaAEscolher";
import { resposta, simularApi } from "./utils/apiFalsa";

// "Me ajuda a escolher" (/me-ajuda-a-escolher). A API de mentira faz o papel da IA:
// o teste confere o que a pessoa manda e como as sugestões aparecem

const [mel, tobias] = animaisExemplo;
const ROTINA = "Moro em apartamento e trabalho fora de manhã.";

let enviado;

function simularIa({ ligada = true, sugestoes = resposta(200, { sugestoes: [], conselho: "" }) } = {}) {
  enviado = null;
  simularApi({
    outras: (metodo, caminho, opcoes) => {
      if (caminho === "/api/ia/disponivel") return resposta(200, { disponivel: ligada });
      if (caminho === "/api/ia/sugestoes") {
        enviado = JSON.parse(opcoes.body);
        return sugestoes;
      }
      return undefined;
    },
  });
}

function entrarComo(tipoConta) {
  localStorage.setItem(
    "adotaaqui.sessao",
    JSON.stringify({ token: "token-de-teste", tipoConta, id: "1", nome: "Marina", expiraEm: "2999-01-01T00:00:00Z" }),
  );
}

function abrir(elemento = <MeAjudaAEscolher />) {
  render(
    <MemoryRouter>
      <AuthProvider>{elemento}</AuthProvider>
    </MemoryRouter>,
  );
}

function escrever(texto) {
  fireEvent.change(screen.getByLabelText("Como é a sua rotina?"), { target: { value: texto } });
}

beforeEach(() => {
  esquecerIaDisponivel();
});

afterEach(() => {
  localStorage.clear();
  document.title = "";
});

test("sem a IA ligada, explica e leva pra vitrine", async () => {
  simularIa({ ligada: false });
  abrir();

  expect(await screen.findByText("A ajuda com IA não está disponível agora.")).toBeInTheDocument();
  expect(screen.getByRole("link", { name: "Ver animais para adoção" })).toHaveAttribute("href", "/animais");
  expect(document.title).toBe("Me ajuda a escolher | Adota Aqui");
});

test("visitante conta a rotina, escolhe o estado e vê as sugestões com o motivo", async () => {
  simularIa({
    sugestoes: resposta(200, {
      sugestoes: [
        { animal: mel, motivo: "É calma e convive bem com crianças." },
        { animal: tobias, motivo: "Gosta de ficar em casa." },
      ],
      conselho: "Visite o animal antes de decidir.",
    }),
  });
  abrir();

  // Frases prontas entram no texto
  fireEvent.click(await screen.findByRole("button", { name: "Moro em apartamento" }));
  fireEvent.click(screen.getByRole("button", { name: "Tenho crianças em casa" }));
  expect(screen.getByLabelText("Como é a sua rotina?")).toHaveValue("Moro em apartamento. Tenho crianças em casa.");
  // Avisa pra não escrever dado pessoal
  expect(screen.getByText(/Não escreva nome, telefone nem endereço/)).toBeInTheDocument();

  fireEvent.change(screen.getByLabelText("Em qual estado você está?"), { target: { value: "RO" } });
  fireEvent.click(screen.getByRole("button", { name: "Ver sugestões" }));

  const titulo = await screen.findByRole("heading", { level: 2, name: "2 animais que combinam com você" });
  // O foco vai pro resultado, que no celular fica embaixo do formulário
  await waitFor(() => expect(titulo).toHaveFocus());
  expect(enviado).toEqual({ rotina: "Moro em apartamento. Tenho crianças em casa.", estado: "RO" });

  const lista = screen.getAllByRole("listitem").filter((item) => item.textContent.includes("Por que combina"));
  expect(lista).toHaveLength(2);
  expect(within(lista[0]).getByText("É calma e convive bem com crianças.")).toBeInTheDocument();
  expect(within(lista[0]).getByRole("heading", { name: "Mel" })).toBeInTheDocument();
  expect(screen.getByText("Visite o animal antes de decidir.")).toBeInTheDocument();
  expect(screen.getByText(/Sugestões feitas por IA/)).toBeInTheDocument();
});

test("rotina curta demais não vai pra IA", async () => {
  simularIa();
  abrir();
  await screen.findByLabelText("Como é a sua rotina?");

  escrever("casa");
  fireEvent.click(screen.getByRole("button", { name: "Ver sugestões" }));

  expect(screen.getByText("Conte um pouco mais da sua rotina (pelo menos 15 letras).")).toBeInTheDocument();
  expect(screen.getByLabelText("Como é a sua rotina?")).toHaveFocus();
  expect(enviado).toBeNull();
});

test("sem animal que combine, diz isso e mostra a dica", async () => {
  simularIa({
    sugestoes: resposta(200, { sugestoes: [], conselho: "Ainda não tem animais disponíveis pra adoção nesse estado." }),
  });
  abrir();
  await screen.findByLabelText("Como é a sua rotina?");

  escrever(ROTINA);
  fireEvent.click(screen.getByRole("button", { name: "Ver sugestões" }));

  expect(
    await screen.findByRole("heading", { name: "Nenhum animal combinou com a sua rotina agora" }),
  ).toBeInTheDocument();
  expect(screen.getByText("Ainda não tem animais disponíveis pra adoção nesse estado.")).toBeInTheDocument();
  expect(enviado).toEqual({ rotina: ROTINA, estado: null });
});

test("pessoa logada não escolhe estado: vale o do perfil", async () => {
  entrarComo("USUARIO");
  simularIa();
  abrir();
  await screen.findByLabelText("Como é a sua rotina?");

  expect(screen.queryByLabelText("Em qual estado você está?")).not.toBeInTheDocument();
  expect(screen.getByText(/estado do seu perfil/)).toBeInTheDocument();

  escrever(ROTINA);
  fireEvent.click(screen.getByRole("button", { name: "Ver sugestões" }));
  await screen.findByRole("heading", { name: "Nenhum animal combinou com a sua rotina agora" });
  expect(enviado).toEqual({ rotina: ROTINA, estado: null });
  const [, opcoes] = fetch.mock.calls.find(([url]) => new URL(url).pathname === "/api/ia/sugestoes");
  expect(opcoes.headers.Authorization).toBe("Bearer token-de-teste");
});

test("limite de uso ou IA fora do ar aparecem como aviso", async () => {
  simularIa({
    sugestoes: resposta(429, { mensagem: "Você já usou a IA muitas vezes nesta hora. Tente de novo mais tarde." }),
  });
  abrir();
  await screen.findByLabelText("Como é a sua rotina?");

  escrever(ROTINA);
  fireEvent.click(screen.getByRole("button", { name: "Ver sugestões" }));

  expect(await screen.findByRole("alert")).toHaveTextContent("Você já usou a IA muitas vezes nesta hora.");
  expect(screen.getByRole("button", { name: "Ver sugestões" })).toBeEnabled();
});

test("a chamada da vitrine só aparece com a IA ligada", async () => {
  simularIa();
  abrir(<ChamadaDaIa />);
  expect(await screen.findByRole("link", { name: "Me ajuda a escolher" })).toHaveAttribute(
    "href",
    "/me-ajuda-a-escolher",
  );
});
