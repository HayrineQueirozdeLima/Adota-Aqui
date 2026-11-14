import { fireEvent, render, screen } from "@testing-library/react";
import { AuthProvider } from "../src/contexts/AuthContext";
import EscreverComIa from "../src/components/EscreverComIa/EscreverComIa";
import { esquecerIaDisponivel } from "../src/hooks/useIaDisponivel";
import { animalVazio } from "../src/utils/formularioAnimal";
import { resposta, simularApi } from "./utils/apiFalsa";

// "Escrever com IA" no formulário do animal. A API de mentira responde se a IA está ligada
// e o texto sugerido; o teste confere o que vai pra API e o que volta pro formulário

const mel = { ...animalVazio, nome: "Mel", especie: "CAO", porte: "MEDIO", historia: "" };

let enviado;

function simularIa({ ligada = true, descricao = resposta(200, { texto: "Mel é uma cadela tranquila." }) } = {}) {
  enviado = null;
  simularApi({
    outras: (metodo, caminho, opcoes) => {
      if (caminho === "/api/ia/disponivel") return resposta(200, { disponivel: ligada });
      if (caminho === "/api/ia/descricao") {
        enviado = JSON.parse(opcoes.body);
        return descricao;
      }
      return undefined;
    },
  });
}

function abrir(valores = mel, aoUsar = jest.fn()) {
  localStorage.setItem(
    "adotaaqui.sessao",
    JSON.stringify({ token: "token-de-teste", tipoConta: "ABRIGO", id: "1", nome: "Abrigo", expiraEm: "2999-01-01T00:00:00Z" }),
  );
  render(
    <AuthProvider>
      <EscreverComIa valores={valores} aoUsar={aoUsar} />
    </AuthProvider>,
  );
  return aoUsar;
}

beforeEach(() => {
  esquecerIaDisponivel();
});

afterEach(() => {
  localStorage.clear();
});

test("sem a IA ligada no servidor, nada aparece", async () => {
  simularIa({ ligada: false });
  abrir();
  await new Promise((pronto) => setTimeout(pronto, 0));
  expect(screen.queryByRole("button", { name: "Escrever com IA" })).not.toBeInTheDocument();
});

test("precisa do nome e da espécie antes de pedir", async () => {
  simularIa();
  abrir({ ...animalVazio });
  expect(await screen.findByRole("button", { name: "Escrever com IA" })).toBeDisabled();
  expect(screen.getByText("Preencha o nome e a espécie pra IA poder ajudar.")).toBeInTheDocument();
});

test("mostra a sugestão separada e só põe no formulário quando o protetor escolhe usar", async () => {
  simularIa();
  const aoUsar = abrir();

  fireEvent.click(await screen.findByRole("button", { name: "Escrever com IA" }));

  expect(await screen.findByText("Mel é uma cadela tranquila.")).toBeInTheDocument();
  expect(screen.getByRole("heading", { name: "Sugestão da IA" })).toBeInTheDocument();
  expect(enviado).toMatchObject({ nome: "Mel", especie: "CAO", porte: "MEDIO", rascunho: null });
  expect(aoUsar).not.toHaveBeenCalled();

  fireEvent.click(screen.getByRole("button", { name: "Usar este texto" }));
  expect(aoUsar).toHaveBeenCalledWith("Mel é uma cadela tranquila.");
  expect(screen.queryByText("Mel é uma cadela tranquila.")).not.toBeInTheDocument();
});

test("descartar some com a sugestão, e com texto já escrito o botão vira melhorar", async () => {
  simularIa();
  const aoUsar = abrir({ ...mel, historia: "Achei na rua." });

  fireEvent.click(await screen.findByRole("button", { name: "Melhorar com IA" }));
  expect(await screen.findByText("Mel é uma cadela tranquila.")).toBeInTheDocument();
  expect(enviado.rascunho).toBe("Achei na rua.");

  fireEvent.click(screen.getByRole("button", { name: "Descartar" }));
  expect(screen.queryByText("Mel é uma cadela tranquila.")).not.toBeInTheDocument();
  expect(aoUsar).not.toHaveBeenCalled();
});

test("se a IA não responder, explica e deixa tentar de novo", async () => {
  simularIa({
    descricao: resposta(503, { mensagem: "A ajuda com IA não está disponível agora. Tente de novo em instantes." }),
  });
  abrir();

  fireEvent.click(await screen.findByRole("button", { name: "Escrever com IA" }));

  expect(await screen.findByRole("alert")).toHaveTextContent("A ajuda com IA não está disponível agora.");
  expect(screen.getByRole("button", { name: "Escrever com IA" })).toBeEnabled();
});
