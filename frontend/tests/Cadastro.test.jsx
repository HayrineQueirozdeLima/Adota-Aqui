import { fireEvent, render, screen } from "@testing-library/react";
import { MemoryRouter, Route, Routes } from "react-router-dom";
import { AuthProvider } from "../src/contexts/AuthContext";
import CadastroAbrigo from "../src/pages/CadastroAbrigo/CadastroAbrigo";
import CadastroUsuario from "../src/pages/CadastroUsuario/CadastroUsuario";
import EscolhaCadastro from "../src/pages/EscolhaCadastro/EscolhaCadastro";

const sessao = {
  token: "token-de-teste",
  tipoConta: "USUARIO",
  id: "3f6c1a2e-8b4d-4c7a-9e1f-2a5b7c9d0e11",
  nome: "Marina Prado",
  expiraEm: "2999-01-01T00:00:00Z",
};

const viaCep = {
  cep: "76801-000",
  logradouro: "Avenida Sete de Setembro",
  bairro: "Centro",
  localidade: "Porto Velho",
  uf: "RO",
};

function resposta(status, corpo) {
  return {
    ok: status >= 200 && status < 300,
    status,
    json: async () => corpo,
    text: async () => JSON.stringify(corpo),
  };
}

// O fetch responde conforme o endereço: ViaCEP ou a nossa API
function simularServidor({
  api = resposta(201, sessao),
  cep = resposta(200, viaCep),
} = {}) {
  global.fetch = jest.fn((url) =>
    Promise.resolve(url.includes("viacep") ? cep : api),
  );
}

function chamadaDaApi(caminho) {
  return fetch.mock.calls.find(([url]) => url.endsWith(caminho));
}

function renderizar(entrada) {
  render(
    <MemoryRouter initialEntries={[entrada]}>
      <AuthProvider>
        <Routes>
          <Route path="/cadastro/usuario" element={<CadastroUsuario />} />
          <Route path="/cadastro/abrigo" element={<CadastroAbrigo />} />
          <Route path="/animais" element={<p>Vitrine</p>} />
        </Routes>
      </AuthProvider>
    </MemoryRouter>,
  );
}

function preencher(rotulo, valor) {
  fireEvent.change(screen.getByLabelText(rotulo), { target: { value: valor } });
}

// Preenche CEP e espera o ViaCEP completar o endereço
async function preencherEndereco() {
  preencher("CEP", "76801000");
  await screen.findByDisplayValue("Porto Velho");
  preencher("Número", "1040");
}

function preencherSenhas(senha = "senhaSegura1", confirmacao = senha) {
  preencher("Senha", senha);
  preencher("Confirmar senha", confirmacao);
}

afterEach(() => {
  localStorage.clear();
  sessionStorage.clear();
});

describe("cadastro de pessoa física", () => {
  async function preencherTudo() {
    preencher("Nome completo", "Marina Prado");
    preencher("CPF", "52998224725");
    preencher("E-mail", "marina@email.com");
    preencher("Telefone (DDD)", "69999998888");
    preencherSenhas();
    await preencherEndereco();
  }

  test("o CEP preenche cidade, estado e logradouro", async () => {
    simularServidor();
    renderizar("/cadastro/usuario");
    preencher("CEP", "76801000");

    expect(await screen.findByDisplayValue("Porto Velho")).toBeInTheDocument();
    expect(screen.getByLabelText("Estado")).toHaveValue("RO");
    expect(screen.getByLabelText("Logradouro")).toHaveValue(
      "Avenida Sete de Setembro",
    );
    expect(screen.getByLabelText("CEP")).toHaveValue("76801-000");
  });

  test("avisa quando o CEP não existe", async () => {
    simularServidor({ cep: resposta(200, { erro: "true" }) });
    renderizar("/cadastro/usuario");
    preencher("CEP", "00000000");

    expect(
      await screen.findByText("CEP não encontrado. Confira os números."),
    ).toBeInTheDocument();
  });

  test("não envia com as senhas diferentes", async () => {
    simularServidor();
    renderizar("/cadastro/usuario");
    await preencherTudo();
    preencherSenhas("senhaSegura1", "outraSenha1");
    fireEvent.click(screen.getByRole("button", { name: "Criar conta" }));

    expect(screen.getByText("As senhas não conferem.")).toBeInTheDocument();
    expect(screen.getByLabelText("Confirmar senha")).toHaveFocus();
    expect(chamadaDaApi("/api/usuarios")).toBeUndefined();
  });

  test("envia só números e entra logada na vitrine", async () => {
    simularServidor();
    renderizar("/cadastro/usuario");
    await preencherTudo();
    fireEvent.click(screen.getByRole("button", { name: "Criar conta" }));

    expect(await screen.findByText("Vitrine")).toBeInTheDocument();
    const [, opcoes] = chamadaDaApi("/api/usuarios");
    expect(JSON.parse(opcoes.body)).toEqual({
      nome: "Marina Prado",
      cpf: "52998224725",
      email: "marina@email.com",
      telefone: "69999998888",
      senha: "senhaSegura1",
      confirmacaoSenha: "senhaSegura1",
      endereco: {
        cep: "76801000",
        cidade: "Porto Velho",
        estado: "RO",
        logradouro: "Avenida Sete de Setembro",
        bairro: "Centro",
        numero: "1040",
      },
    });
    expect(sessionStorage.getItem("adotaaqui.sessao")).toContain(
      "token-de-teste",
    );
  });

  test("CPF já cadastrado aparece embaixo do campo CPF", async () => {
    simularServidor({
      api: resposta(409, {
        status: 409,
        erro: "Conflito",
        mensagem: "Já existe uma conta cadastrada com este CPF",
      }),
    });
    renderizar("/cadastro/usuario");
    await preencherTudo();
    fireEvent.click(screen.getByRole("button", { name: "Criar conta" }));

    expect(
      await screen.findByText("Já existe uma conta cadastrada com este CPF"),
    ).toBeInTheDocument();
    expect(screen.getByLabelText("CPF")).toHaveAttribute(
      "aria-invalid",
      "true",
    );
  });

  test("os erros de campo que vêm da API aparecem no lugar certo", async () => {
    simularServidor({
      api: resposta(400, {
        status: 400,
        erro: "Requisição inválida",
        mensagem: "Existem campos preenchidos de forma incorreta",
        campos: { "endereco.cep": "O CEP deve ter 8 dígitos numéricos" },
      }),
    });
    renderizar("/cadastro/usuario");
    await preencherTudo();
    fireEvent.click(screen.getByRole("button", { name: "Criar conta" }));

    expect(
      await screen.findByText("O CEP deve ter 8 dígitos numéricos"),
    ).toBeInTheDocument();
  });
});

describe("cadastro de abrigo", () => {
  test("envia CNPJ e razão social pro endpoint de abrigos", async () => {
    simularServidor({ api: resposta(201, { ...sessao, tipoConta: "ABRIGO" }) });
    renderizar("/cadastro/abrigo");

    preencher("CNPJ", "11222333000181");
    preencher("Nome institucional", "Instituto Quatro Patas");
    preencher("Razão social", "Instituto Quatro Patas Ltda");
    preencher("E-mail institucional", "contato@quatropatas.org");
    preencher("Telefone (DDD)", "6932221111");
    preencherSenhas();
    await preencherEndereco();
    fireEvent.click(screen.getByRole("button", { name: "Cadastrar abrigo" }));

    expect(await screen.findByText("Vitrine")).toBeInTheDocument();
    const [, opcoes] = chamadaDaApi("/api/abrigos");
    expect(JSON.parse(opcoes.body)).toMatchObject({
      cnpj: "11222333000181",
      razaoSocial: "Instituto Quatro Patas Ltda",
      telefone: "6932221111",
    });
  });

  test("mostra um erro geral quando a mensagem não é de um campo", async () => {
    simularServidor({
      api: resposta(500, {
        status: 500,
        erro: "Erro interno",
        mensagem: "Não foi possível concluir o cadastro",
      }),
    });
    renderizar("/cadastro/abrigo");

    preencher("CNPJ", "11222333000181");
    preencher("Nome institucional", "Instituto Quatro Patas");
    preencher("Razão social", "Instituto Quatro Patas Ltda");
    preencher("E-mail institucional", "contato@quatropatas.org");
    preencher("Telefone (DDD)", "6932221111");
    preencherSenhas();
    await preencherEndereco();
    fireEvent.click(screen.getByRole("button", { name: "Cadastrar abrigo" }));

    expect(await screen.findByRole("alert")).toHaveTextContent(
      "Não foi possível concluir o cadastro",
    );
  });
});

describe("escolha do tipo de conta", () => {
  test("leva aos dois formulários de cadastro", () => {
    render(
      <MemoryRouter>
        <EscolhaCadastro />
      </MemoryRouter>,
    );
    expect(
      screen.getByRole("link", { name: /Pessoa física \(CPF\)/ }),
    ).toHaveAttribute("href", "/cadastro/usuario");
    expect(
      screen.getByRole("link", { name: /ONG ou abrigo \(CNPJ\)/ }),
    ).toHaveAttribute("href", "/cadastro/abrigo");
  });
});
