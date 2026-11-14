import { act, render, screen, waitFor } from "@testing-library/react";
import { useRef } from "react";
import NumeroQueSobe from "../src/components/NumeroQueSobe/NumeroQueSobe";
import Revelar from "../src/components/Revelar/Revelar";
import { useProgressoDaRolagem } from "../src/hooks/useProgressoDaRolagem";
import { useRevelarAoRolar } from "../src/hooks/useRevelarAoRolar";

// As animações do site (index.css). O jsdom não tem IntersectionObserver nem matchMedia,
// então o teste faz o papel do navegador: diz se a pessoa aceita movimento e avisa quando um bloco aparece na tela

let observadores;

class ObservadorFalso {
  constructor(callback) {
    this.callback = callback;
    this.alvos = new Set();
    observadores.push(this);
  }

  observe(alvo) {
    this.alvos.add(alvo);
  }

  unobserve(alvo) {
    this.alvos.delete(alvo);
  }

  disconnect() {
    this.alvos.clear();
  }

  // o bloco entrou na tela
  cruzar(alvo) {
    this.callback([{ target: alvo, isIntersecting: true }], this);
  }
}

// O que o index.html faz quando o navegador sabe observar a rolagem e a pessoa não pediu menos movimento
function navegadorQueAnima() {
  document.documentElement.classList.add("animar");
  window.IntersectionObserver = ObservadorFalso;
  window.matchMedia = jest.fn(() => ({ matches: true }));
}

function PaginaComBlocos({ comMaisUm = false }) {
  useRevelarAoRolar();
  return (
    <>
      <Revelar>
        <p>Primeiro bloco</p>
      </Revelar>
      {comMaisUm && (
        <Revelar ordem={1}>
          <p>Bloco que chegou depois</p>
        </Revelar>
      )}
    </>
  );
}

function TrilhaDeTeste() {
  const trilha = useRef(null);
  useProgressoDaRolagem(trilha);
  return (
    <div ref={trilha} data-testid="trilha">
      <span data-linha-da-trilha data-testid="linha" />
      <span data-marco data-testid="pata-lida" />
      <span data-marco data-testid="pata-mais-abaixo" />
    </div>
  );
}

// Onde fica cada parte, como o navegador mediria: a trilha começa no topo da tela e tem 1000 de altura,
// uma pata está a 300 do começo da trilha e a outra a 800
const caixas = { trilha: { top: 0, height: 1000 }, linha: { top: 0, height: 1000 } };
const distancias = { "pata-lida": 300, "pata-mais-abaixo": 800 };

beforeEach(() => {
  observadores = [];
});

afterEach(() => {
  document.documentElement.classList.remove("animar");
  delete window.IntersectionObserver;
  delete window.matchMedia;
  jest.restoreAllMocks();
});

test("o bloco fica marcado como revelado quando entra na tela, e para de ser observado", () => {
  navegadorQueAnima();
  render(<PaginaComBlocos />);
  const bloco = screen.getByText("Primeiro bloco").parentElement;
  const [observador] = observadores;

  expect(bloco).toHaveClass("revelar-ao-rolar");
  expect(observador.alvos.has(bloco)).toBe(true);
  expect(bloco).not.toHaveAttribute("data-revelado");

  act(() => observador.cruzar(bloco));
  expect(bloco).toHaveAttribute("data-revelado");
  expect(observador.alvos.has(bloco)).toBe(false);
});

test("um bloco que aparece depois, como uma lista que veio da API, também é observado", async () => {
  navegadorQueAnima();
  const { rerender } = render(<PaginaComBlocos />);
  rerender(<PaginaComBlocos comMaisUm />);
  const novo = screen.getByText("Bloco que chegou depois").parentElement;

  await waitFor(() => expect(observadores[0].alvos.has(novo)).toBe(true));
});

test("pra quem pediu menos movimento nada fica esperando a rolagem pra aparecer", () => {
  // O navegador sabe observar, mas o index.html não pôs a classe "animar"
  window.IntersectionObserver = ObservadorFalso;
  render(<PaginaComBlocos />);
  expect(observadores).toHaveLength(0);
  expect(screen.getByText("Primeiro bloco").parentElement).not.toHaveAttribute("data-revelado");
});

test("sem poder animar, o número já aparece pronto", () => {
  render(
    <p>
      <NumeroQueSobe valor={1234} formatar={(numero) => numero.toLocaleString("pt-BR")} />
    </p>,
  );
  expect(screen.getByText("1.234")).toBeInTheDocument();
});

test("com animação, o número conta até o valor quando aparece, e o leitor de tela ouve só o valor final", () => {
  navegadorQueAnima();
  // Cada quadro da tela já chega no fim da contagem, pra o teste não ter que esperar
  jest.spyOn(window, "requestAnimationFrame").mockImplementation((passo) => {
    passo(performance.now() + 5000);
    return 1;
  });
  const { container } = render(
    <p>
      <NumeroQueSobe valor={48} />
    </p>,
  );
  const naTela = container.querySelector('[aria-hidden="true"]');

  expect(naTela).toHaveTextContent("0");
  expect(screen.getByText("48")).toHaveClass("sr-only");

  act(() => observadores[0].cruzar(container.querySelector(".tabular-nums")));
  expect(naTela).toHaveTextContent("48");
});

test("a trilha do Quem somos guarda quanto a pessoa já leu e acende as patas por onde a leitura passou", () => {
  document.documentElement.classList.add("animar");
  jest
    .spyOn(HTMLElement.prototype, "getBoundingClientRect")
    .mockImplementation(function medir() {
      return caixas[this.dataset.testid] ?? { top: 0, height: 0 };
    });
  jest.spyOn(HTMLElement.prototype, "offsetTop", "get").mockImplementation(function distancia() {
    return distancias[this.dataset.testid] ?? 0;
  });
  jest.spyOn(HTMLElement.prototype, "offsetHeight", "get").mockReturnValue(36);
  window.innerHeight = 1000;

  render(<TrilhaDeTeste />);
  // a linha de leitura fica a 60% da altura da tela: 600 dos 1000 de altura da trilha já passaram por ela
  expect(screen.getByTestId("trilha").style.getPropertyValue("--progresso")).toBe("0.600");
  expect(screen.getByTestId("pata-lida")).toHaveAttribute("data-alcancado");
  expect(screen.getByTestId("pata-mais-abaixo")).not.toHaveAttribute("data-alcancado");
});

test("sem animação, a trilha fica como está, sem medir nada", () => {
  const medir = jest.spyOn(HTMLElement.prototype, "getBoundingClientRect");
  render(<TrilhaDeTeste />);
  expect(medir).not.toHaveBeenCalled();
  expect(screen.getByTestId("trilha").style.getPropertyValue("--progresso")).toBe("");
});
