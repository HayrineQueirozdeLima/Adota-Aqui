import {
  fireEvent,
  render,
  screen,
  waitFor,
  within,
} from "@testing-library/react";
import { MemoryRouter, Route, Routes } from "react-router-dom";
import { AuthProvider } from "../src/contexts/AuthContext";
import CadastroAnimal from "../src/pages/CadastroAnimal/CadastroAnimal";
import MeusAnimais from "../src/pages/MeusAnimais/MeusAnimais";
import { resposta, simularApi } from "./utils/apiFalsa";

// Cadastro de animal (UC04): o formulário confere tudo antes de enviar, sobe as fotos uma a uma
// e manda o corpo no formato do api.md

const CHAVE = "adotaaqui.sessao";

function entrar() {
  localStorage.setItem(
    CHAVE,
    JSON.stringify({
      token: "token-de-teste",
      tipoConta: "USUARIO",
      id: "1",
      nome: "Ana",
      expiraEm: "2999-01-01T00:00:00Z",
    }),
  );
}

// Por padrão: o cadastro devolve 201 com o nome enviado, e a lista de "Meus animais" vem vazia
function simular(outras) {
  simularApi({
    outras: (metodo, caminho, opcoes) => {
      const resultado = outras?.(metodo, caminho, opcoes);
      if (resultado) return resultado;
      if (metodo === "POST" && caminho === "/api/animais") {
        return resposta(201, { id: "novo", ...JSON.parse(opcoes.body) });
      }
      if (caminho === "/api/animais/meus") return resposta(200, []);
      return undefined;
    },
  });
}

function abrir() {
  render(
    <MemoryRouter initialEntries={["/meus-animais/novo"]}>
      <AuthProvider>
        <Routes>
          <Route path="/meus-animais/novo" element={<CadastroAnimal />} />
          <Route path="/meus-animais" element={<MeusAnimais />} />
        </Routes>
      </AuthProvider>
    </MemoryRouter>,
  );
}

function digitar(rotulo, valor) {
  fireEvent.change(screen.getByLabelText(rotulo), { target: { value: valor } });
}

function escolherOpcao(pergunta, opcao) {
  fireEvent.click(
    within(screen.getByRole("group", { name: pergunta })).getByLabelText(opcao),
  );
}

function enviarFotos(...arquivos) {
  fireEvent.change(screen.getByLabelText("Adicionar fotos"), {
    target: { files: arquivos },
  });
}

const foto = (nome = "mingau.jpg", tipo = "image/jpeg", tamanho = 10) =>
  new File([new Uint8Array(tamanho)], nome, { type: tipo });

async function preencherTudo() {
  digitar("Nome", "Mingau");
  digitar("Espécie", "GATO");
  await screen.findByRole("option", { name: "Siamês" });
  digitar("Raça", "SRD_GATO");
  digitar("Porte", "PEQUENO");
  digitar("Sexo", "MACHO");
  digitar("Peso em kg (opcional)", "4,2");
  digitar("Nascimento estimado", "062024");
  escolherOpcao("Castrado", "Sim");
  escolherOpcao("Com cães", "Convive bem");
  escolherOpcao("Nível de energia", "Mais calmo");
  digitar("Trajetória do animal", "Resgatado numa noite de chuva.");
  enviarFotos(foto());
  await screen.findByAltText("Foto principal do animal");
}

function publicar() {
  fireEvent.click(screen.getByRole("button", { name: "Publicar animal" }));
}

const chamadas = (metodo, caminho) =>
  fetch.mock.calls.filter(
    ([url, opcoes]) =>
      (opcoes?.method ?? "GET") === metodo && url.endsWith(caminho),
  );

beforeEach(() => {
  entrar();
  simular();
});

afterEach(() => {
  localStorage.clear();
  sessionStorage.clear();
});

test("em branco, não envia e leva o foco pro primeiro erro", () => {
  abrir();
  publicar();

  expect(screen.getByText("Informe o nome.")).toBeInTheDocument();
  expect(screen.getByText("Envie pelo menos uma foto.")).toBeInTheDocument();
  expect(screen.getByLabelText("Nome")).toHaveFocus();
  expect(chamadas("POST", "/api/animais")).toHaveLength(0);
});

test("a raça só libera depois da espécie e vem da API", async () => {
  abrir();
  expect(screen.getByLabelText("Raça")).toBeDisabled();

  digitar("Espécie", "CAO");
  expect(
    await screen.findByRole("option", { name: "Labrador" }),
  ).toBeInTheDocument();
  expect(screen.getByLabelText("Raça")).toBeEnabled();
});

test("a máscara do nascimento monta MM/AAAA", () => {
  abrir();
  digitar("Nascimento estimado", "042023");
  expect(screen.getByLabelText("Nascimento estimado")).toHaveValue("04/2023");
});

test("envia as fotos uma a uma, e a primeira vira a principal", async () => {
  abrir();
  enviarFotos(foto("a.jpg"), foto("b.png", "image/png"));

  expect(await screen.findByAltText("Foto 2 do animal")).toHaveAttribute(
    "src",
    "https://fotos.teste/animais/2.jpg",
  );
  expect(screen.getByAltText("Foto principal do animal")).toHaveAttribute(
    "src",
    "https://fotos.teste/animais/1.jpg",
  );
  const envios = chamadas("POST", "/api/fotos");
  expect(envios).toHaveLength(2);
  expect(envios[0][1].body).toBeInstanceOf(FormData);
  expect(envios[0][1].headers.Authorization).toBe("Bearer token-de-teste");

  // a segunda vira a principal
  fireEvent.click(screen.getByRole("button", { name: "Principal" }));
  expect(screen.getByAltText("Foto principal do animal")).toHaveAttribute(
    "src",
    "https://fotos.teste/animais/2.jpg",
  );
});

test("recusa arquivo que não é imagem e imagem maior que 5 MB, sem gastar envio", () => {
  abrir();
  enviarFotos(
    foto("leia-me.txt", "text/plain"),
    foto("enorme.jpg", "image/jpeg", 5 * 1024 * 1024 + 1),
  );

  return waitFor(() => {
    expect(
      screen.getByText("leia-me.txt: envie uma imagem JPG, PNG ou WEBP."),
    ).toBeInTheDocument();
    expect(
      screen.getByText("enorme.jpg: a imagem pode ter no máximo 5 MB."),
    ).toBeInTheDocument();
    expect(chamadas("POST", "/api/fotos")).toHaveLength(0);
  });
});

test("adiciona e remove vacinas, e o Enter adiciona sem enviar o formulário", async () => {
  abrir();
  fireEvent.click(screen.getByRole("button", { name: "Adicionar vacina" }));
  digitar("Vacina", "V4");
  digitar("Dose (opcional)", "1");
  fireEvent.keyDown(screen.getByLabelText("Vacina"), { key: "Enter" });

  expect(screen.getByText("V4")).toBeInTheDocument();
  expect(screen.getByText("1ª dose")).toBeInTheDocument();
  expect(chamadas("POST", "/api/animais")).toHaveLength(0);

  fireEvent.click(screen.getByRole("button", { name: "Remover a vacina V4" }));
  expect(screen.getByText("Nenhuma vacina registrada.")).toBeInTheDocument();
});

test("vacina sem nome não entra na lista", () => {
  abrir();
  fireEvent.click(screen.getByRole("button", { name: "Adicionar vacina" }));
  fireEvent.click(screen.getByRole("button", { name: "Adicionar" }));

  expect(screen.getByText("Informe o nome da vacina.")).toBeInTheDocument();
  expect(screen.getByText("Nenhuma vacina registrada.")).toBeInTheDocument();
});

test("publica com o corpo do api.md e volta pra Meus animais com o aviso", async () => {
  abrir();
  await preencherTudo();
  publicar();

  expect(
    await screen.findByText("Mingau foi publicado e já aparece na vitrine."),
  ).toBeInTheDocument();
  const [[, opcoes]] = chamadas("POST", "/api/animais");
  expect(opcoes.headers.Authorization).toBe("Bearer token-de-teste");
  expect(JSON.parse(opcoes.body)).toEqual({
    nome: "Mingau",
    especie: "GATO",
    raca: "SRD_GATO",
    sexo: "MACHO",
    porte: "PEQUENO",
    peso: 4.2,
    dataNascEstimada: "2024-06-01",
    castrado: true,
    energia: "MAIS_CALMO",
    convivencia: {
      crianca: "NAO_TESTADO",
      cao: "CONVIVE_BEM",
      gato: "NAO_TESTADO",
    },
    historia: "Resgatado numa noite de chuva.",
    fotos: ["https://fotos.teste/animais/1.jpg"],
    vacinas: [],
  });
});

test("erro de campo vindo da API aparece no campo certo", async () => {
  simular((metodo, caminho) =>
    metodo === "POST" && caminho === "/api/animais"
      ? resposta(400, {
          status: 400,
          mensagem: "Dados inválidos",
          campos: { racaDaEspecie: "A raça não pertence à espécie informada" },
        })
      : undefined,
  );
  abrir();
  await preencherTudo();
  publicar();

  expect(
    await screen.findByText("A raça não pertence à espécie informada"),
  ).toBeInTheDocument();
  expect(screen.getByRole("button", { name: "Publicar animal" })).toBeEnabled();
});

test("erro sem campo aparece em destaque no topo", async () => {
  simular((metodo, caminho) =>
    metodo === "POST" && caminho === "/api/animais"
      ? resposta(500, {
          status: 500,
          mensagem: "Não foi possível concluir a operação.",
        })
      : undefined,
  );
  abrir();
  await preencherTudo();
  publicar();

  expect(await screen.findByRole("alert")).toHaveTextContent(
    "Não foi possível concluir a operação.",
  );
});
