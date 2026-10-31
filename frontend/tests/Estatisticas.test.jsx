import { render, screen, waitFor } from "@testing-library/react";
import Estatisticas from "../src/components/Estatisticas/Estatisticas";
import { resposta, simularApi } from "./utils/apiFalsa";

// A faixa de números da Home (GET /api/estatisticas)

function numeros(corpo, status = 200) {
  simularApi({
    outras: (metodo, caminho) =>
      caminho === "/api/estatisticas" ? resposta(status, corpo) : undefined,
  });
}

test("mostra os números do site, com ponto no milhar", async () => {
  numeros({ adocoes: 1234, animaisDisponiveis: 43, abrigos: 12 });
  render(<Estatisticas />);

  expect(await screen.findByText("1.234")).toBeInTheDocument();
  expect(screen.getByText("adoções feitas pelo site")).toBeInTheDocument();
  expect(screen.getByText("43")).toBeInTheDocument();
  expect(screen.getByText("animais esperando um lar")).toBeInTheDocument();
  expect(screen.getByText("abrigos e ONGs cadastrados")).toBeInTheDocument();
  expect(
    screen.getByRole("heading", { level: 2, name: "O Adota Aqui em números" }),
  ).toBeInTheDocument();
});

test("usa o singular quando é um só, e o plural no zero", async () => {
  numeros({ adocoes: 1, animaisDisponiveis: 1, abrigos: 0 });
  render(<Estatisticas />);

  expect(await screen.findByText("adoção feita pelo site")).toBeInTheDocument();
  expect(screen.getByText("animal esperando um lar")).toBeInTheDocument();
  expect(screen.getByText("abrigos e ONGs cadastrados")).toBeInTheDocument();
});

test("enquanto carrega, a lista avisa que está ocupada", () => {
  numeros({ adocoes: 1, animaisDisponiveis: 1, abrigos: 1 });
  render(<Estatisticas />);

  expect(screen.getByRole("list")).toHaveAttribute("aria-busy", "true");
});

test("se a API falhar, a faixa some sem mostrar erro", async () => {
  numeros({ status: 500, mensagem: "Erro interno" }, 500);
  render(<Estatisticas />);

  await waitFor(() =>
    expect(
      screen.queryByRole("heading", { name: "O Adota Aqui em números" }),
    ).not.toBeInTheDocument(),
  );
  expect(screen.queryByRole("alert")).not.toBeInTheDocument();
});
