import { fireEvent, render, screen, waitFor, within } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import Avatar from "../src/components/Avatar/Avatar";
import { AuthProvider } from "../src/contexts/AuthContext";
import { perfilAbrigoExemplo, perfilUsuarioExemplo } from "../src/mocks/perfil";
import Perfil from "../src/pages/Perfil/Perfil";
import { resposta, simularApi } from "./utils/apiFalsa";

// Foto de perfil, em Meu perfil: a imagem vai pro POST /api/fotos e o endereço pro PUT .../me/foto.
// A API de mentira guarda o fotoUrl que chegou e devolve o perfil com ele

const CHAVE = "adotaaqui.sessao";
let fotosSalvas;

function entrar(tipoConta = "USUARIO") {
  localStorage.setItem(
    CHAVE,
    JSON.stringify({
      token: "token-de-teste",
      tipoConta,
      id: "1",
      nome: tipoConta === "ABRIGO" ? "Instituto Quatro Patas" : "Marina Prado",
      expiraEm: "2999-01-01T00:00:00Z",
    }),
  );
}

function simular({ fotoInicial = null, recusar } = {}) {
  fotosSalvas = [];
  simularApi({
    outras: (metodo, caminho, opcoes) => {
      if (caminho === "/api/usuarios/me" || caminho === "/api/abrigos/me") {
        const perfil = caminho === "/api/abrigos/me" ? perfilAbrigoExemplo : perfilUsuarioExemplo;
        return resposta(200, { ...perfil, fotoUrl: fotoInicial });
      }
      if (caminho.endsWith("/me/foto") && metodo === "PUT") {
        if (recusar) return recusar;
        const { fotoUrl } = JSON.parse(opcoes.body);
        fotosSalvas.push({ caminho, fotoUrl });
        const perfil = caminho.startsWith("/api/abrigos") ? perfilAbrigoExemplo : perfilUsuarioExemplo;
        return resposta(200, { ...perfil, fotoUrl });
      }
      return undefined;
    },
  });
}

function abrir() {
  render(
    <MemoryRouter>
      <AuthProvider>
        <Perfil />
      </AuthProvider>
    </MemoryRouter>,
  );
}

const cartaoDaFoto = async () =>
  (await screen.findByRole("heading", { name: "Foto de perfil" })).closest("section");

function escolherArquivo(cartao, arquivo) {
  const campo = within(cartao).getByLabelText(/Escolher uma foto|Trocar a foto/);
  fireEvent.change(campo, { target: { files: [arquivo] } });
}

const jpg = () => new File(["imagem"], "eu.jpg", { type: "image/jpeg" });

afterEach(() => {
  localStorage.clear();
});

test("sem foto, mostra as iniciais e o botão de escolher", async () => {
  entrar();
  simular();
  abrir();
  const cartao = await cartaoDaFoto();
  expect(within(cartao).getByText("MP")).toBeInTheDocument();
  expect(within(cartao).getByLabelText("Escolher uma foto")).toHaveAttribute("type", "file");
  expect(within(cartao).queryByRole("button", { name: "Tirar a foto" })).not.toBeInTheDocument();
});

test("escolher uma imagem envia a foto, salva no perfil na hora e mostra a foto", async () => {
  entrar();
  simular();
  abrir();
  const cartao = await cartaoDaFoto();

  escolherArquivo(cartao, jpg());

  expect(await within(cartao).findByText("Foto salva.")).toBeInTheDocument();
  expect(fotosSalvas).toEqual([{ caminho: "/api/usuarios/me/foto", fotoUrl: "https://fotos.teste/animais/1.jpg" }]);
  expect(cartao.querySelector("img")).toHaveAttribute("src", "https://fotos.teste/animais/1.jpg");
  // O topo lê a foto da sessão: ela foi guardada junto
  expect(JSON.parse(localStorage.getItem(CHAVE)).fotoUrl).toBe("https://fotos.teste/animais/1.jpg");
  expect(within(cartao).getByLabelText("Trocar a foto")).toBeInTheDocument();
});

test("abrigo salva a foto na rota de abrigo", async () => {
  entrar("ABRIGO");
  simular();
  abrir();
  const cartao = await cartaoDaFoto();

  escolherArquivo(cartao, jpg());

  await within(cartao).findByText("Foto salva.");
  expect(fotosSalvas[0].caminho).toBe("/api/abrigos/me/foto");
});

test("tirar a foto manda vazio e volta pras iniciais", async () => {
  entrar();
  simular({ fotoInicial: "https://fotos.teste/animais/9.jpg" });
  abrir();
  const cartao = await cartaoDaFoto();
  await waitFor(() => expect(cartao.querySelector("img")).toBeInTheDocument());

  fireEvent.click(within(cartao).getByRole("button", { name: "Tirar a foto" }));

  expect(await within(cartao).findByText("Foto removida.")).toBeInTheDocument();
  expect(fotosSalvas).toEqual([{ caminho: "/api/usuarios/me/foto", fotoUrl: null }]);
  expect(cartao.querySelector("img")).not.toBeInTheDocument();
  expect(within(cartao).getByText("MP")).toBeInTheDocument();
});

test("arquivo que não é imagem é recusado antes de enviar", async () => {
  entrar();
  simular();
  abrir();
  const cartao = await cartaoDaFoto();

  escolherArquivo(cartao, new File(["texto"], "curriculo.pdf", { type: "application/pdf" }));

  expect(within(cartao).getByRole("alert")).toHaveTextContent("Envie uma imagem JPG, PNG ou WEBP.");
  expect(fotosSalvas).toEqual([]);
});

test("se a API recusar a foto, mostra o motivo", async () => {
  entrar();
  simular({
    recusar: resposta(400, {
      status: 400,
      erro: "Dados inválidos",
      mensagem: "Dados inválidos",
      campos: { fotoUrl: "Envie a foto pelo próprio site" },
    }),
  });
  abrir();
  const cartao = await cartaoDaFoto();

  escolherArquivo(cartao, jpg());

  expect(await within(cartao).findByRole("alert")).toHaveTextContent("Envie a foto pelo próprio site");
});

test("o Avatar mostra a foto quando tem, e as iniciais quando não tem", () => {
  const { rerender } = render(<Avatar nome="Instituto Quatro Patas" fotoUrl="https://fotos.teste/a.jpg" />);
  expect(document.querySelector("img")).toHaveAttribute("src", "https://fotos.teste/a.jpg");
  expect(document.querySelector("img")).toHaveAttribute("alt", "");
  rerender(<Avatar nome="Instituto Quatro Patas" fotoUrl={null} />);
  expect(screen.getByText("IQ")).toBeInTheDocument();
});
