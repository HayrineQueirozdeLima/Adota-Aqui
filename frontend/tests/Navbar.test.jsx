import { fireEvent, render, screen, waitFor, within } from "@testing-library/react";
import { MemoryRouter, Route, Routes } from "react-router-dom";
import Navbar from "../src/components/Navbar/Navbar";
import { esquecerIaDisponivel } from "../src/hooks/useIaDisponivel";
import { resposta, simularApi } from "./utils/apiFalsa";

const marina = { nome: "Marina Prado", tipoConta: "USUARIO" };
const abrigo = { nome: "Instituto Quatro Patas", tipoConta: "ABRIGO" };

// O topo pergunta pra API se a IA está ligada (pro link do "Me ajuda a escolher")
function simularIa(ligada) {
  simularApi({
    outras: (metodo, caminho) =>
      caminho === "/api/ia/disponivel" ? resposta(200, { disponivel: ligada }) : undefined,
  });
}

function renderizar(usuario, endereco = "/", aoSair = () => {}) {
  render(
    <MemoryRouter initialEntries={[endereco]}>
      <Navbar usuario={usuario} aoSair={aoSair} />
      <Routes>
        <Route path="*" element={null} />
        <Route path="/" element={<p>Página inicial</p>} />
      </Routes>
    </MemoryRouter>,
  );
}

const menuPrincipal = () => screen.getByRole("navigation", { name: "Menu principal" });

beforeEach(() => {
  esquecerIaDisponivel();
  simularIa(true);
});

test("visitante vê Cadastrar e Entrar", () => {
  renderizar(null);
  expect(screen.getByRole("link", { name: "Cadastrar" })).toHaveAttribute(
    "href",
    "/cadastro",
  );
  expect(screen.getByRole("link", { name: "Entrar" })).toHaveAttribute(
    "href",
    "/login",
  );
});

test("o topo leva pras páginas do site, pra qualquer pessoa", async () => {
  renderizar(null);
  // espera a resposta da IA chegar, pra tela terminar de carregar dentro do teste
  await waitFor(() => expect(fetch).toHaveBeenCalled());
  await screen.findByRole("link", { name: "Me ajuda a escolher" });

  const destinos = {
    Animais: "/animais",
    "Me ajuda a escolher": "/me-ajuda-a-escolher",
    Feiras: "/feiras",
    Clínicas: "/clinicas",
    Observatório: "/observatorio",
    Blog: "/blog",
  };
  for (const [nome, destino] of Object.entries(destinos)) {
    expect(within(menuPrincipal()).getByRole("link", { name: nome })).toHaveAttribute("href", destino);
  }
});

test("sem a IA ligada, o Me ajuda a escolher sai do topo", async () => {
  simularIa(false);
  renderizar(null);
  // Enquanto a API não responde, o link fica, pra o topo não pular; com a resposta, ele sai
  await waitFor(() =>
    expect(screen.queryByRole("link", { name: "Me ajuda a escolher" })).not.toBeInTheDocument(),
  );
  expect(within(menuPrincipal()).getByRole("link", { name: "Feiras" })).toBeInTheDocument();
});

test("marca a página atual no topo", () => {
  renderizar(null, "/feiras");
  expect(within(menuPrincipal()).getByRole("link", { name: "Feiras" })).toHaveAttribute(
    "aria-current",
    "page",
  );
});

test("o botão Menu abre e fecha a lista das páginas, e o Esc fecha e devolve o foco", () => {
  renderizar(null);
  const botao = screen.getByRole("button", { name: "Menu" });
  expect(botao).toHaveAttribute("aria-expanded", "false");
  expect(screen.queryByRole("navigation", { name: "Páginas do site" })).not.toBeInTheDocument();

  fireEvent.click(botao);
  expect(botao).toHaveAttribute("aria-expanded", "true");
  const paginas = screen.getByRole("navigation", { name: "Páginas do site" });
  expect(within(paginas).getByRole("link", { name: /Clínicas veterinárias/ })).toHaveAttribute(
    "href",
    "/clinicas",
  );
  // No celular pequeno o Cadastrar fica aqui dentro
  expect(within(paginas).getByRole("link", { name: "Criar conta" })).toHaveAttribute("href", "/cadastro");

  fireEvent.keyDown(document, { key: "Escape" });
  expect(screen.queryByRole("navigation", { name: "Páginas do site" })).not.toBeInTheDocument();
  expect(botao).toHaveFocus();
});

test("o menu fecha quando a pessoa clica fora dele", () => {
  renderizar(null);
  fireEvent.click(screen.getByRole("button", { name: "Menu" }));
  fireEvent.mouseDown(document.body);
  expect(screen.queryByRole("navigation", { name: "Páginas do site" })).not.toBeInTheDocument();
});

test("usuario logado vê as iniciais e, na Minha área, tudo o que é dele", () => {
  renderizar(marina);
  expect(screen.getByText("MP")).toBeInTheDocument();
  expect(screen.queryByRole("link", { name: "Entrar" })).not.toBeInTheDocument();

  fireEvent.click(screen.getByRole("button", { name: "Minha área" }));
  expect(screen.getByText("Entrou como Marina Prado")).toBeInTheDocument();
  const destinos = {
    "Meu perfil": "/perfil",
    "Meus animais": "/meus-animais",
    "Minhas candidaturas": "/meus-interesses",
    "Interesses recebidos": "/interesses-recebidos",
  };
  for (const [nome, destino] of Object.entries(destinos)) {
    expect(screen.getByRole("link", { name: nome })).toHaveAttribute("href", destino);
  }
  expect(screen.queryByRole("link", { name: "Divulgar uma feira" })).not.toBeInTheDocument();
});

test("abrigo não vê Minhas candidaturas, mas pode divulgar uma feira", () => {
  renderizar(abrigo);
  fireEvent.click(screen.getByRole("button", { name: "Minha área" }));
  expect(
    screen.queryByRole("link", { name: "Minhas candidaturas" }),
  ).not.toBeInTheDocument();
  expect(screen.getByRole("link", { name: "Divulgar uma feira" })).toHaveAttribute("href", "/feiras/nova");
});

test("marca o item da página atual na Minha área", () => {
  renderizar(marina, "/meus-animais");
  fireEvent.click(screen.getByRole("button", { name: "Minha área" }));
  expect(screen.getByRole("link", { name: "Meus animais" })).toHaveAttribute(
    "aria-current",
    "page",
  );
});

test("Sair encerra a sessão e volta pra página inicial", () => {
  const aoSair = jest.fn();
  renderizar(marina, "/meus-animais", aoSair);
  fireEvent.click(screen.getByRole("button", { name: "Minha área" }));
  fireEvent.click(screen.getByRole("button", { name: "Sair" }));
  expect(aoSair).toHaveBeenCalledTimes(1);
  expect(screen.getByText("Página inicial")).toBeInTheDocument();
});

test("trocar de página fecha a Minha área", () => {
  renderizar(marina);
  const botao = screen.getByRole("button", { name: "Minha área" });
  fireEvent.click(botao);
  fireEvent.click(screen.getByRole("link", { name: "Meus animais" }));
  expect(botao).toHaveAttribute("aria-expanded", "false");
  expect(screen.queryByRole("link", { name: "Meu perfil" })).not.toBeInTheDocument();
});

test("o Pular para o conteúdo leva o foco pro começo da página", () => {
  render(
    <MemoryRouter>
      <Navbar usuario={null} />
      <div id="conteudo" tabIndex={-1}>
        Conteúdo
      </div>
    </MemoryRouter>,
  );
  fireEvent.click(screen.getByRole("link", { name: "Pular para o conteúdo" }));
  expect(screen.getByText("Conteúdo")).toHaveFocus();
});

test("com foto de perfil, a Minha área mostra a foto no lugar das iniciais", () => {
  renderizar({ ...marina, fotoUrl: "https://fotos.teste/marina.jpg" });
  const botao = screen.getByRole("button", { name: "Minha área" });
  expect(botao.querySelector("img")).toHaveAttribute("src", "https://fotos.teste/marina.jpg");
  expect(screen.queryByText("MP")).not.toBeInTheDocument();
});
