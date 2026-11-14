import { render, screen } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import ProximasFeiras from "../src/components/ProximasFeiras/ProximasFeiras";
import { feirasExemplo } from "../src/mocks/feiras";
import { paginaDe, resposta, simularApi } from "./utils/apiFalsa";

// As próximas feiras de adoção, na Home. É um extra: sem feira ou com erro, a seção some

function abrir() {
  render(
    <MemoryRouter>
      <ProximasFeiras />
    </MemoryRouter>,
  );
}

function simularFeiras(respostaDasFeiras) {
  simularApi({ outras: (metodo, caminho) => (caminho === "/api/feiras" ? respostaDasFeiras : undefined) });
}

test("mostra as 2 próximas feiras e o link pra ver todas", async () => {
  simularFeiras(resposta(200, paginaDe(feirasExemplo)));
  abrir();

  expect(
    await screen.findByRole("heading", { level: 2, name: "Próximas feiras de adoção" }),
  ).toBeInTheDocument();
  expect(screen.getAllByRole("heading", { level: 3 })).toHaveLength(2);
  expect(screen.getByRole("link", { name: "Ver todas as feiras" })).toHaveAttribute("href", "/feiras");
  // Pede só 2, de todo o Brasil
  expect(new URL(fetch.mock.calls[0][0]).search).toBe("?tamanho=2");
  // Na Home ninguém apaga feira
  expect(screen.queryByRole("button", { name: "Apagar" })).not.toBeInTheDocument();
});

test("sem feira marcada, a seção não aparece", async () => {
  simularFeiras(resposta(200, paginaDe([])));
  abrir();

  await new Promise((pronto) => setTimeout(pronto, 0));
  expect(screen.queryByRole("heading", { name: "Próximas feiras de adoção" })).not.toBeInTheDocument();
});

test("se a API falhar, a seção não aparece", async () => {
  simularFeiras(resposta(500, {}));
  abrir();

  await new Promise((pronto) => setTimeout(pronto, 0));
  expect(screen.queryByRole("heading", { name: "Próximas feiras de adoção" })).not.toBeInTheDocument();
});
