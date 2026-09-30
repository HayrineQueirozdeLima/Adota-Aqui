import { render, screen, fireEvent } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import VitrineAnimais from "../src/components/VitrineAnimais/VitrineAnimais";
import * as servico from "../src/services/animais";

// desfaz o jest.spyOn do último teste, pra ele não vazar pros outros
afterEach(() => {
  jest.restoreAllMocks();
});

function renderizar() {
  render(
    <MemoryRouter>
      <VitrineAnimais />
    </MemoryRouter>,
  );
}

// Espera a grade aparecer e devolve o nome dos animais, na ordem da tela
async function nomesNaTela() {
  const titulos = await screen.findAllByRole("heading", { level: 3 });
  return titulos.map((titulo) => titulo.textContent);
}

function clicar(nome) {
  fireEvent.click(screen.getByRole("button", { name: nome }));
}

function escolher(rotulo, valor) {
  fireEvent.change(screen.getByLabelText(rotulo), { target: { value: valor } });
}

test("sem filtro, mostra todos os animais", async () => {
  renderizar();
  expect(await nomesNaTela()).toEqual([
    "Mel",
    "Tobias",
    "Amora",
    "Bento",
    "Miau",
    "Tuca",
  ]);
});

test("filtra por espécie e marca o botão escolhido", async () => {
  renderizar();
  await nomesNaTela();

  clicar("Gatos");

  expect(await nomesNaTela()).toEqual(["Tobias", "Amora", "Miau"]);
  expect(screen.getByRole("button", { name: "Gatos" })).toHaveAttribute(
    "aria-pressed",
    "true",
  );
  expect(screen.getByRole("button", { name: "Todos" })).toHaveAttribute(
    "aria-pressed",
    "false",
  );
});

test("combina vários filtros", async () => {
  renderizar();
  await nomesNaTela();

  clicar("Cães");
  clicar("Macho");
  escolher("Energia", "MAIS_ANIMADO");

  expect(await nomesNaTela()).toEqual(["Bento"]);
});

test("filtra por cidade sem ligar pra maiúsculas", async () => {
  renderizar();
  await nomesNaTela();

  escolher("Cidade", "porto velho");

  expect(await nomesNaTela()).toEqual(["Tobias", "Amora"]);
});

test('"Bom com crianças" liga e desliga', async () => {
  renderizar();
  await nomesNaTela();

  clicar("Bom com crianças");
  expect(await nomesNaTela()).toEqual(["Mel", "Amora", "Bento", "Miau"]);

  clicar("Bom com crianças");
  expect(await nomesNaTela()).toHaveLength(6);
});

test("raça só libera depois de escolher a espécie", async () => {
  renderizar();
  await nomesNaTela();
  expect(screen.getByLabelText("Raça")).toBeDisabled();

  clicar("Gatos");
  await screen.findByRole("option", { name: "Siamês" });
  escolher("Raça", "SIAMES");
  expect(await nomesNaTela()).toEqual(["Tobias"]);

  // Trocou a espécie: a raça volta pra "qualquer uma"
  clicar("Cães");
  expect(screen.getByLabelText("Raça").value).toBe("");
  expect(await nomesNaTela()).toEqual(["Mel", "Bento", "Tuca"]);
});

test("avisa quando nada combina e deixa ver todos de novo", async () => {
  renderizar();
  await nomesNaTela();

  clicar("Gatos");
  escolher("Porte", "GRANDE");
  expect(
    await screen.findByText(
      "Nenhum resultado encontrado com essas informações.",
    ),
  ).toBeInTheDocument();

  clicar("Ver todos os animais");
  expect(await nomesNaTela()).toHaveLength(6);
});

test("avisa quando não consegue carregar a lista", async () => {
  // Finge que o back caiu: a busca sempre falha
  jest
    .spyOn(servico, "listarAnimais")
    .mockRejectedValue(new Error("fora do ar"));
  renderizar();

  expect(await screen.findByRole("alert")).toHaveTextContent(
    "Não foi possível carregar os animais",
  );
});
