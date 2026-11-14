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

// O card mostra onde o animal está, que pode não ser o endereço do protetor
test("mostra onde o animal está, mesmo longe do endereço do protetor", () => {
  renderizar({ ...mel, cidade: "Campinas", estado: "SP" });
  expect(screen.getByText("Campinas/SP")).toBeInTheDocument();
  expect(screen.queryByText("Santo André/SP")).not.toBeInTheDocument();
});

test("se a API não mandar o local do animal, usa o do protetor", () => {
  const { cidade, estado, ...semLocal } = mel;
  renderizar(semLocal);
  expect(screen.getByText(`${cidade}/${estado}`)).toBeInTheDocument();
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

// O selo conta do dia em que o animal entrou no site. Datas bem antigas e bem recentes,
// pro teste não depender do dia em que roda
test("mostra há quanto tempo o animal espera, a partir de 1 mês no site", () => {
  renderizar({ ...mel, cadastradoEm: "2020-01-10" });
  expect(screen.getByText(/^Esperando há \d+ anos$/)).toBeInTheDocument();
});

test("animal que acabou de chegar não tem o selo", () => {
  const hoje = new Date().toISOString().slice(0, 10);
  renderizar({ ...mel, cadastradoEm: hoje });
  expect(screen.queryByText(/Esperando há/)).not.toBeInTheDocument();
});

// Foto de perfil de quem cadastrou: aparece no lugar das iniciais, e o nome continua escrito do lado
test("mostra a foto de perfil do protetor quando ele tem, e as iniciais quando não tem", () => {
  const { unmount } = render(
    <MemoryRouter>
      <CardAnimal animal={{ ...mel, protetor: { ...mel.protetor, fotoUrl: "https://fotos.teste/abrigo.jpg" } }} />
    </MemoryRouter>,
  );
  const fotoDoProtetor = [...document.querySelectorAll("img")].find((img) => img.getAttribute("src") === "https://fotos.teste/abrigo.jpg");
  expect(fotoDoProtetor).toHaveAttribute("alt", "");
  expect(screen.getByText("Instituto Quatro Patas")).toBeInTheDocument();
  unmount();

  renderizar(mel);
  expect(screen.getByText("IQ")).toBeInTheDocument();
});
