import { render, screen, waitFor, within } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { AuthProvider } from "../src/contexts/AuthContext";
import Home from "../src/pages/Home/Home";
import { simularApi } from "./utils/apiFalsa";

// A Home tem a vitrine, que busca na API: os testes usam a API de mentira
beforeEach(() => {
  simularApi();
});

async function abrirHome(endereco = "/") {
  render(
    <MemoryRouter initialEntries={[endereco]}>
      <AuthProvider>
        <Home />
      </AuthProvider>
    </MemoryRouter>,
  );
  // espera os cards da vitrine pra não terminar o teste no meio da busca
  await screen.findAllByRole("link", { name: /^Quero conhecer/ });
}

test("o topo apresenta o site e leva pra vitrine e pro cadastro de animal", async () => {
  await abrirHome();

  expect(
    screen.getByRole("heading", { level: 1, name: "Todo animal merece um lar de verdade." }),
  ).toBeInTheDocument();
  expect(screen.getByRole("link", { name: "Ver animais disponíveis" })).toHaveAttribute("href", "/animais");
  expect(screen.getByRole("link", { name: "Resgatei um animal" })).toHaveAttribute(
    "href",
    "/meus-animais/novo",
  );
  expect(screen.getByText("Guarda responsável é obrigatória.")).toBeInTheDocument();
});

test("mostra os números do site logo depois da apresentação", async () => {
  await abrirHome();

  const secao = await screen.findByRole("region", { name: "O Adota Aqui em números" });
  expect(await within(secao).findByText("27")).toBeInTheDocument();
  expect(within(secao).getByText("adoções feitas pelo site")).toBeInTheDocument();
});

test("mostra as histórias mais novas de quem adotou, com o link pro mural", async () => {
  await abrirHome();

  const secao = await screen.findByRole("region", { name: "Histórias de quem adotou" });
  expect(await within(secao).findByRole("heading", { level: 3, name: "Mel" })).toBeInTheDocument();
  expect(within(secao).getByRole("link", { name: "Ver todas as histórias" })).toHaveAttribute(
    "href",
    "/historias",
  );
});

test("mostra os quatro passos da adoção, na ordem", async () => {
  await abrirHome();

  const secao = screen.getByRole("region", { name: "Como funciona a adoção" });
  const passos = within(secao).getAllByRole("heading", { level: 3 }).map((titulo) => titulo.textContent);
  expect(passos).toEqual(["Encontre o animal", "Demonstre interesse", "Contato liberado", "Adoção realizada"]);
  expect(within(secao).getByText("Passo 04")).toBeInTheDocument();
});

test("termina chamando pra conhecer o projeto na página Quem somos", async () => {
  await abrirHome();

  const secao = screen.getByRole("region", { name: "Conheça o Adota Aqui" });
  expect(within(secao).getByRole("link", { name: "Conhecer o projeto" })).toHaveAttribute(
    "href",
    "/quem-somos",
  );
  // É a última seção da Home, depois dos passos da adoção
  const passos = screen.getByRole("region", { name: "Como funciona a adoção" });
  expect(passos.compareDocumentPosition(secao) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy();
});

test("o link Como adotar rola até os passos, e de novo quando a vitrine termina de carregar", async () => {
  // o jsdom não rola a tela: guarda em quem o scrollIntoView foi chamado
  const rolados = [];
  Element.prototype.scrollIntoView = function () {
    rolados.push(this.id);
  };
  try {
    await abrirHome("/#como-funciona");
    await waitFor(() => expect(rolados).toEqual(["como-funciona", "como-funciona"]));
  } finally {
    delete Element.prototype.scrollIntoView;
  }
});
