import { fireEvent, render, screen, within } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import Observatorio from "../src/pages/Observatorio/Observatorio";
import { resposta, simularApi } from "./utils/apiFalsa";

// Observatório da adoção (/observatorio): os números do site por estado (API de mentira:
// RO, SP e RS com números, o resto zerado) e os do IBGE, que ficam no código

function abrir() {
  render(
    <MemoryRouter>
      <Observatorio />
    </MemoryRouter>,
  );
}

const mapa = () => screen.getByRole("group", { name: /^Mapa do Brasil/ });

afterEach(() => {
  document.title = "";
});

test("abre com os animais esperando por estado, o total do site e o ranking", async () => {
  simularApi();
  abrir();

  expect(await screen.findByText("38")).toBeInTheDocument();
  expect(screen.getByText("animais esperando um lar agora")).toBeInTheDocument();
  expect(document.title).toBe("Observatório da adoção | Adota Aqui");

  expect(within(mapa()).getAllByRole("button")).toHaveLength(27);
  expect(within(mapa()).getByRole("button", { name: "Rondônia: 12 animais esperando" })).toBeInTheDocument();
  expect(within(mapa()).getByRole("button", { name: "Acre: 0 animais esperando" })).toBeInTheDocument();
  expect(screen.getByText("nenhum ainda")).toBeInTheDocument();

  const lista = screen.getByRole("heading", { name: "Onde tem mais: animais esperando" }).nextElementSibling;
  expect(within(lista).getAllByRole("listitem").map((item) => item.textContent)).toEqual([
    "1ºSão Paulo20",
    "2ºRondônia12",
    "3ºRio Grande do Sul6",
  ]);
});

test("troca pra porcentagem dos lares com cachorro, do IBGE, com a fonte", async () => {
  simularApi();
  abrir();
  await screen.findByText("38");

  fireEvent.click(screen.getByRole("button", { name: "Lares com cachorro" }));

  expect(screen.getByRole("button", { name: "Lares com cachorro" })).toHaveAttribute("aria-pressed", "true");
  expect(
    within(mapa()).getByRole("button", { name: "Rondônia: 64,8% dos lares têm cachorro" }),
  ).toBeInTheDocument();
  expect(screen.getByRole("link", { name: "IBGE, Pesquisa Nacional de Saúde 2019 (abre em outra aba)" })).toHaveAttribute(
    "href",
    expect.stringContaining("ibge.gov.br"),
  );
  // Na porcentagem não existe "nenhum ainda"
  expect(screen.queryByText("nenhum ainda")).not.toBeInTheDocument();
});

test("escolher um estado mostra os números dele, do site e do IBGE, e dá pra voltar pro Brasil", async () => {
  simularApi();
  abrir();
  await screen.findByText("38");

  fireEvent.click(within(mapa()).getByRole("button", { name: "Rondônia: 12 animais esperando" }));

  const rondonia = screen.getByRole("heading", { level: 3, name: "Rondônia" }).parentElement.parentElement;
  expect(within(rondonia).getByText("Adoções").nextElementSibling).toHaveTextContent("3");
  expect(within(rondonia).getByText("Abrigos").nextElementSibling).toHaveTextContent("2");
  expect(within(rondonia).getByText("Lares com gato").nextElementSibling).toHaveTextContent("26,9%");
  expect(within(mapa()).getByRole("button", { name: /^Rondônia/ })).toHaveAttribute("aria-pressed", "true");

  fireEvent.click(screen.getByRole("button", { name: "Ver o Brasil" }));
  expect(screen.getByRole("heading", { level: 3, name: "Brasil" })).toBeInTheDocument();
});

test("se a API falhar, os números do IBGE continuam funcionando", async () => {
  let falhar = true;
  simularApi({
    outras: (metodo, caminho) =>
      caminho === "/api/estatisticas/estados" && falhar ? resposta(500, {}) : undefined,
  });
  abrir();

  expect(await screen.findByRole("alert")).toHaveTextContent("Não foi possível carregar os números do Adota Aqui.");
  fireEvent.click(screen.getByRole("button", { name: "Lares com gato" }));
  expect(within(mapa()).getByRole("button", { name: "Piauí: 32,6% dos lares têm gato" })).toBeInTheDocument();

  falhar = false;
  fireEvent.click(screen.getByRole("button", { name: "Animais esperando" }));
  fireEvent.click(screen.getByRole("button", { name: "Tentar de novo" }));
  expect(await screen.findByText("38")).toBeInTheDocument();
});

test("os números do Brasil têm fonte, e a tabela mostra os 27 estados", async () => {
  simularApi();
  abrir();
  await screen.findByText("38");

  const retrato = screen.getByRole("heading", { name: "O retrato no Brasil" }).nextElementSibling;
  within(retrato)
    .getAllByRole("listitem")
    .forEach((item) => expect(within(item).getByRole("link")).toHaveAttribute("target", "_blank"));

  const tabela = screen.getByRole("table", { name: "Números por estado: Adota Aqui e IBGE" });
  // 1 linha de cabeçalho + 27 estados
  expect(within(tabela).getAllByRole("row")).toHaveLength(28);
  expect(within(tabela).getByRole("rowheader", { name: "Rondônia" }).parentElement).toHaveTextContent(
    "Rondônia123264,8%26,9%",
  );
});
