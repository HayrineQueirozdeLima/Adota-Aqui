import { fireEvent, render, screen } from "@testing-library/react";
import {
  Link,
  MemoryRouter,
  Route,
  Routes,
  useNavigate,
} from "react-router-dom";
import RolarParaOTopo from "../src/components/RolarParaOTopo/RolarParaOTopo";

// Toda página nova abre no topo, menos o endereço com # e o voltar do navegador

function Pagina({ nome }) {
  return (
    <>
      <h1>{nome}</h1>
      <Link to="/b">Ir pra B</Link>
      <Link to="/#como-funciona">Como adotar</Link>
    </>
  );
}

function Voltar() {
  const navegar = useNavigate();
  return (
    <button type="button" onClick={() => navegar(-1)}>
      Voltar
    </button>
  );
}

function abrir() {
  render(
    <MemoryRouter initialEntries={["/"]}>
      <RolarParaOTopo />
      <Voltar />
      <Routes>
        <Route path="/" element={<Pagina nome="A" />} />
        <Route path="/b" element={<Pagina nome="B" />} />
      </Routes>
    </MemoryRouter>,
  );
}

beforeEach(() => {
  jest.spyOn(window, "scrollTo").mockImplementation(() => {});
});

afterEach(() => {
  jest.restoreAllMocks();
});

test("ao abrir o site, a rolagem fica por conta do navegador", () => {
  abrir();
  expect(window.scrollTo).not.toHaveBeenCalled();
});

test("cada página nova abre no topo", () => {
  abrir();
  fireEvent.click(screen.getByRole("link", { name: "Ir pra B" }));

  expect(screen.getByRole("heading", { name: "B" })).toBeInTheDocument();
  expect(window.scrollTo).toHaveBeenCalledWith(0, 0);
});

test("o link com # deixa a página rolar até a seção", () => {
  abrir();
  fireEvent.click(screen.getByRole("link", { name: "Como adotar" }));

  expect(window.scrollTo).not.toHaveBeenCalled();
});

test("voltar no navegador não joga a pessoa pro topo", () => {
  abrir();
  fireEvent.click(screen.getByRole("link", { name: "Ir pra B" }));
  window.scrollTo.mockClear();

  fireEvent.click(screen.getByRole("button", { name: "Voltar" }));

  expect(screen.getByRole("heading", { name: "A" })).toBeInTheDocument();
  expect(window.scrollTo).not.toHaveBeenCalled();
});
