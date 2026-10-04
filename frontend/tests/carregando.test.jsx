import { act, render, screen } from "@testing-library/react";
import Carregando from "../src/components/Carregando/Carregando";

// "Relógio de mentira": o teste avança o tempo na hora, sem esperar 4 segundos de verdade
beforeEach(() => {
  jest.useFakeTimers();
});

afterEach(() => {
  jest.useRealTimers();
});

test("avisa que o servidor pode estar acordando quando a resposta demora", () => {
  render(<Carregando texto="Carregando animais..." />);
  expect(screen.getByRole("status")).toHaveTextContent("Carregando animais...");
  expect(screen.queryByText(/está acordando/)).not.toBeInTheDocument();

  act(() => {
    jest.advanceTimersByTime(4000);
  });

  expect(screen.getByText(/está acordando/)).toBeInTheDocument();
});
