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

test("mostra os quatro passos da adoção, na ordem", async () => {
  await abrirHome();

  const secao = screen.getByRole("region", { name: "Como funciona a adoção" });
  const passos = within(secao).getAllByRole("heading", { level: 3 }).map((titulo) => titulo.textContent);
  expect(passos).toEqual(["Encontre o animal", "Demonstre interesse", "Contato liberado", "Adoção realizada"]);
  expect(within(secao).getByText("Passo 04")).toBeInTheDocument();
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
