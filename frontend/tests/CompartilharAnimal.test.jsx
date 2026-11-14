import { fireEvent, render, screen } from "@testing-library/react";
import CompartilharAnimal from "../src/components/CompartilharAnimal/CompartilharAnimal";
import { animaisExemplo } from "../src/mocks/animais";

// Quadro "Ajude a Mel a achar um lar", do perfil do animal.
// O jsdom não tem área de transferência nem o menu de compartilhar do sistema: cada teste escolhe o que o navegador tem

const [mel] = animaisExemplo;
const linkDaMel = `http://localhost/animais/${mel.id}`;
const textoDaMel = "Conheça a Mel, que procura um lar em Santo André/SP, no Adota Aqui:";

function navegadorCom(propriedade, valor) {
  Object.defineProperty(navigator, propriedade, { configurable: true, value: valor });
}

afterEach(() => {
  delete navigator.clipboard;
  delete navigator.share;
});

test("manda o perfil pelo WhatsApp com um texto pronto e o link", () => {
  render(<CompartilharAnimal animal={mel} />);

  expect(
    screen.getByRole("heading", { level: 2, name: "Ajude a Mel a achar um lar" }),
  ).toBeInTheDocument();
  const whatsapp = screen.getByRole("link", {
    name: "Enviar no WhatsApp (abre em outra aba)",
  });
  const endereco = new URL(whatsapp.href);
  expect(endereco.origin).toBe("https://wa.me");
  expect(endereco.searchParams.get("text")).toBe(`${textoDaMel} ${linkDaMel}`);
});

test("usa o artigo certo pro macho", () => {
  render(<CompartilharAnimal animal={animaisExemplo[1]} />);
  expect(
    screen.getByRole("heading", { name: "Ajude o Tobias a achar um lar" }),
  ).toBeInTheDocument();
});

test("copia o link e avisa", async () => {
  const writeText = jest.fn().mockResolvedValue();
  navegadorCom("clipboard", { writeText });
  render(<CompartilharAnimal animal={mel} />);

  fireEvent.click(screen.getByRole("button", { name: "Copiar link" }));

  expect(await screen.findByRole("button", { name: "Link copiado" })).toBeInTheDocument();
  expect(screen.getByRole("status")).toHaveTextContent("Link copiado");
  expect(writeText).toHaveBeenCalledWith(linkDaMel);
});

test("se não der pra copiar, mostra o link escrito", async () => {
  navegadorCom("clipboard", { writeText: jest.fn().mockRejectedValue(new Error("sem permissão")) });
  render(<CompartilharAnimal animal={mel} />);

  fireEvent.click(screen.getByRole("button", { name: "Copiar link" }));

  expect(await screen.findByRole("alert")).toHaveTextContent(linkDaMel);
});

test("o menu de compartilhar do sistema só aparece no navegador que tem", () => {
  render(<CompartilharAnimal animal={mel} />);
  expect(screen.queryByRole("button", { name: "Outros apps" })).not.toBeInTheDocument();
});

test("outros apps abre o menu do sistema com o texto e o link", async () => {
  const share = jest.fn().mockResolvedValue();
  navegadorCom("share", share);
  render(<CompartilharAnimal animal={mel} />);

  fireEvent.click(screen.getByRole("button", { name: "Outros apps" }));

  expect(share).toHaveBeenCalledWith({
    title: "Mel | Adota Aqui",
    text: textoDaMel,
    url: linkDaMel,
  });
});

test("fechar o menu do sistema sem escolher nada não dá erro", async () => {
  navegadorCom("share", jest.fn().mockRejectedValue(new Error("AbortError")));
  render(<CompartilharAnimal animal={mel} />);

  fireEvent.click(screen.getByRole("button", { name: "Outros apps" }));

  expect(screen.queryByRole("alert")).not.toBeInTheDocument();
});
