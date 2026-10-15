import { render, screen } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import CardAnimal from "../src/components/CardAnimal/CardAnimal";
import { animaisExemplo } from "../src/mocks/animais";

const [mel, tobias] = animaisExemplo;

function renderizar(animal) {
  render(
    <MemoryRouter>
      <CardAnimal animal={animal} />
    </MemoryRouter>,
  );
}

test("mostra a descrição com espécie, raça, porte e peso", () => {
  renderizar(mel);
  expect(
    screen.getByText("Cão, sem raça definida, porte médio, 14 kg"),
  ).toBeInTheDocument();
});

test("usa a palavra certa para o sexo do animal", () => {
  renderizar(mel);
  expect(screen.getByText("Castrada")).toBeInTheDocument();
  expect(screen.getByText("Mais animada")).toBeInTheDocument();
});

test("não mostra a tag de castrado quando o animal não é castrado", () => {
  renderizar(tobias);
  expect(screen.queryByText("Castrado")).not.toBeInTheDocument();
});

// CT-NFR-02: quem usa leitor de tela ouve de quem é a foto
test("a foto tem texto alternativo com o nome do animal", () => {
  renderizar({ ...mel, fotoCapa: "https://fotos.teste/animais/mel.jpg" });
  expect(screen.getByAltText("Foto de Mel")).toHaveAttribute(
    "src",
    "https://fotos.teste/animais/mel.jpg",
  );
});

test("o botão leva para a ficha do animal", () => {
  renderizar(mel);
  expect(
    screen.getByRole("link", { name: "Quero conhecer Mel" }),
  ).toHaveAttribute("href", `/animais/${mel.id}`);
});

test("pinta cada estado de convivência com a sua cor", () => {
  renderizar(mel);
  expect(screen.getByText("Criança: convive bem")).toHaveClass(
    "bg-status-disponivel-fundo",
  );
  expect(screen.getByText("Gato: não testado")).toHaveClass(
    "bg-marca-roxo-suave",
  );
});
