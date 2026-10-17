import { fireEvent, render, screen } from "@testing-library/react";
import BotaoTema from "../src/components/BotaoTema/BotaoTema";

const CHAVE = "adotaaqui.tema";
const html = document.documentElement;

afterEach(() => {
  localStorage.clear();
  html.classList.remove("tema-escuro");
  delete window.matchMedia;
});

test("liga e desliga o tema escuro e lembra a escolha", () => {
  render(<BotaoTema />);
  const botao = screen.getByRole("button", { name: "Tema escuro" });
  expect(botao).toHaveAttribute("aria-pressed", "false");
  expect(html).not.toHaveClass("tema-escuro");

  fireEvent.click(botao);
  expect(botao).toHaveAttribute("aria-pressed", "true");
  expect(html).toHaveClass("tema-escuro");
  expect(localStorage.getItem(CHAVE)).toBe("escuro");

  fireEvent.click(botao);
  expect(botao).toHaveAttribute("aria-pressed", "false");
  expect(html).not.toHaveClass("tema-escuro");
  expect(localStorage.getItem(CHAVE)).toBe("claro");
});

test("sem escolha salva, segue o tema do sistema", () => {
  window.matchMedia = jest.fn().mockReturnValue({ matches: true });
  render(<BotaoTema />);

  expect(window.matchMedia).toHaveBeenCalledWith("(prefers-color-scheme: dark)");
  expect(screen.getByRole("button", { name: "Tema escuro" })).toHaveAttribute("aria-pressed", "true");
  expect(html).toHaveClass("tema-escuro");
});

test("a escolha salva vale mais que o tema do sistema", () => {
  window.matchMedia = jest.fn().mockReturnValue({ matches: true });
  localStorage.setItem(CHAVE, "claro");
  render(<BotaoTema />);

  expect(screen.getByRole("button", { name: "Tema escuro" })).toHaveAttribute("aria-pressed", "false");
  expect(html).not.toHaveClass("tema-escuro");
});
