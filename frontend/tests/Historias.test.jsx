import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { depoimentosExemplo } from "../src/mocks/depoimentos";
import Historias from "../src/pages/Historias/Historias";
import { paginaDe, resposta, simularApi } from "./utils/apiFalsa";

// Mural de histórias de adoção (RF11), em /historias. Aberto pra qualquer pessoa

function simularMural(responder) {
  simularApi({
    outras: (metodo, caminho) => {
      if (caminho !== "/api/depoimentos") return undefined;
      return responder(new URL(fetch.mock.calls.at(-1)[0]).searchParams);
    },
  });
}

function abrir() {
  render(
    <MemoryRouter>
      <Historias />
    </MemoryRouter>,
  );
}

afterEach(() => {
  document.title = "";
});

test("mostra cada história com o animal, o texto e só o primeiro nome e o estado de quem contou", async () => {
  simularApi();
  abrir();

  expect(
    await screen.findByRole("heading", { level: 2, name: "Mel" }),
  ).toBeInTheDocument();
  expect(screen.getByRole("heading", { level: 2, name: "Miau" })).toBeInTheDocument();
  expect(screen.getByText(depoimentosExemplo[0].texto)).toBeInTheDocument();
  expect(screen.getByText("Ana, de RO")).toBeInTheDocument();
  expect(screen.getByText(/Adotou com Instituto Quatro Patas/)).toBeInTheDocument();
  expect(screen.getByText("Contou em 28/10/2026")).toBeInTheDocument();
  expect(screen.getByText("2 histórias")).toHaveAttribute("role", "status");
  expect(document.title).toBe("Histórias de adoção | Adota Aqui");
});

test("usa a foto do depoimento e, sem ela, a do animal", async () => {
  const comFoto = { ...depoimentosExemplo[0], fotoUrl: "https://fotos.teste/animais/historia.jpg" };
  const semFoto = {
    ...depoimentosExemplo[1],
    animal: { ...depoimentosExemplo[1].animal, fotoCapa: "https://fotos.teste/animais/miau.jpg" },
  };
  simularMural(() => resposta(200, paginaDe([comFoto, semFoto])));
  abrir();

  expect(await screen.findByRole("img", { name: "Foto de Mel" })).toHaveAttribute(
    "src",
    "https://fotos.teste/animais/historia.jpg",
  );
  expect(screen.getByRole("img", { name: "Foto de Miau" })).toHaveAttribute(
    "src",
    "https://fotos.teste/animais/miau.jpg",
  );
});

test("sem nenhuma história, convida a ver os animais", async () => {
  simularMural(() => resposta(200, paginaDe([])));
  abrir();

  expect(
    await screen.findByText("Ainda não tem nenhuma história por aqui."),
  ).toBeInTheDocument();
  expect(screen.getByRole("link", { name: "Ver animais disponíveis" })).toHaveAttribute(
    "href",
    "/animais",
  );
});

test("se a API falhar, avisa e deixa tentar de novo", async () => {
  let tentativas = 0;
  simularMural(() => {
    tentativas += 1;
    return tentativas === 1
      ? resposta(500, { status: 500, mensagem: "Erro interno" })
      : resposta(200, paginaDe(depoimentosExemplo));
  });
  abrir();

  expect(await screen.findByRole("alert")).toHaveTextContent(
    "Não foi possível carregar as histórias",
  );
  fireEvent.click(screen.getByRole("button", { name: "Tentar de novo" }));
  expect(
    await screen.findByRole("heading", { level: 2, name: "Mel" }),
  ).toBeInTheDocument();
});

test("o Ver mais histórias traz a próxima página e leva o foco pra primeira história nova", async () => {
  const segunda = { ...depoimentosExemplo[1], id: "d3", animal: { ...depoimentosExemplo[1].animal, nome: "Tuca" } };
  simularMural((parametros) =>
    parametros.get("pagina") === "1"
      ? resposta(200, paginaDe([segunda], { pagina: 1, tamanho: 2, totalItens: 3 }))
      : resposta(200, paginaDe(depoimentosExemplo, { tamanho: 2, totalItens: 3 })),
  );
  abrir();

  expect(await screen.findByText("Mostrando 2 de 3 histórias")).toBeInTheDocument();
  fireEvent.click(screen.getByRole("button", { name: "Ver mais histórias" }));

  const tuca = await screen.findByRole("heading", { level: 2, name: "Tuca" });
  await waitFor(() => expect(document.activeElement).toBe(tuca.closest("article")));
  expect(
    screen.queryByRole("button", { name: "Ver mais histórias" }),
  ).not.toBeInTheDocument();
});
