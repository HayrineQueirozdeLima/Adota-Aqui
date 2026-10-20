import { fireEvent, render, screen } from "@testing-library/react";
import { MemoryRouter, Route, Routes } from "react-router-dom";
import { AuthProvider } from "../src/contexts/AuthContext";
import Login from "../src/pages/Login/Login";

const sessao = {
  token: "token-de-teste",
  tipoConta: "USUARIO",
  id: "3f6c1a2e-8b4d-4c7a-9e1f-2a5b7c9d0e11",
  nome: "Marina Prado",
  expiraEm: "2999-01-01T00:00:00Z",
};

// Imita a resposta do fetch
function resposta(status, corpo) {
  return {
    ok: status >= 200 && status < 300,
    status,
    json: async () => corpo,
    text: async () => JSON.stringify(corpo),
  };
}

function renderizar(entrada = "/login") {
  render(
    <MemoryRouter initialEntries={[entrada]}>
      <AuthProvider>
        <Routes>
          <Route path="/login" element={<Login />} />
          <Route path="/animais" element={<p>Vitrine</p>} />
          <Route path="/meus-animais" element={<p>Meus animais</p>} />
        </Routes>
      </AuthProvider>
    </MemoryRouter>,
  );
}

function preencher(rotulo, valor) {
  fireEvent.change(screen.getByLabelText(rotulo), { target: { value: valor } });
}

beforeEach(() => {
  global.fetch = jest.fn();
});

afterEach(() => {
  localStorage.clear();
  sessionStorage.clear();
});

test("valida antes de chamar a API", () => {
  renderizar();
  fireEvent.click(screen.getByRole("button", { name: "Entrar" }));

  expect(screen.getByText("Informe seu CPF ou CNPJ.")).toBeInTheDocument();
  expect(screen.getByText("Informe sua senha.")).toBeInTheDocument();
  expect(screen.getByLabelText("CPF ou CNPJ")).toHaveFocus();
  expect(fetch).not.toHaveBeenCalled();
});

test("mostra a máscara, mas manda só os números", async () => {
  fetch.mockResolvedValueOnce(resposta(200, sessao));
  renderizar();

  preencher("CPF ou CNPJ", "52998224725");
  expect(screen.getByLabelText("CPF ou CNPJ")).toHaveValue("529.982.247-25");
  preencher("Senha", "senhaSegura1");
  fireEvent.click(screen.getByRole("button", { name: "Entrar" }));

  expect(await screen.findByText("Vitrine")).toBeInTheDocument();
  const [url, opcoes] = fetch.mock.calls[0];
  expect(url).toBe("http://api.teste/api/auth/login");
  expect(JSON.parse(opcoes.body)).toEqual({
    documento: "52998224725",
    senha: "senhaSegura1",
  });
});

test('sem "manter conectada", a sessão fica só nesta aba', async () => {
  fetch.mockResolvedValueOnce(resposta(200, sessao));
  renderizar();
  preencher("CPF ou CNPJ", "52998224725");
  preencher("Senha", "senhaSegura1");
  fireEvent.click(screen.getByRole("button", { name: "Entrar" }));
  await screen.findByText("Vitrine");

  expect(sessionStorage.getItem("adotaaqui.sessao")).toContain(
    "token-de-teste",
  );
  expect(localStorage.getItem("adotaaqui.sessao")).toBeNull();
});

test('com "manter conectada", a sessão sobrevive a fechar o navegador', async () => {
  fetch.mockResolvedValueOnce(resposta(200, sessao));
  renderizar();
  preencher("CPF ou CNPJ", "52998224725");
  preencher("Senha", "senhaSegura1");
  fireEvent.click(screen.getByLabelText("Manter conta conectada"));
  fireEvent.click(screen.getByRole("button", { name: "Entrar" }));
  await screen.findByText("Vitrine");

  expect(localStorage.getItem("adotaaqui.sessao")).toContain("token-de-teste");
});

test("volta pra tela que pediu o login", async () => {
  fetch.mockResolvedValueOnce(resposta(200, sessao));
  renderizar({ pathname: "/login", state: { de: "/meus-animais" } });
  preencher("CPF ou CNPJ", "52998224725");
  preencher("Senha", "senhaSegura1");
  fireEvent.click(screen.getByRole("button", { name: "Entrar" }));

  expect(await screen.findByText("Meus animais")).toBeInTheDocument();
});

test("mostra a mensagem da API quando a senha está errada", async () => {
  fetch.mockResolvedValueOnce(
    resposta(401, {
      status: 401,
      erro: "Não autorizado",
      mensagem: "Documento ou senha inválidos",
    }),
  );
  renderizar();
  preencher("CPF ou CNPJ", "52998224725");
  preencher("Senha", "errada123");
  fireEvent.click(screen.getByRole("button", { name: "Entrar" }));

  expect(await screen.findByRole("alert")).toHaveTextContent(
    "Documento ou senha inválidos",
  );
  expect(screen.getByRole("button", { name: "Entrar" })).toBeEnabled();
});

test("avisa quando não consegue falar com o servidor", async () => {
  fetch.mockRejectedValueOnce(new TypeError("Failed to fetch"));
  renderizar();
  preencher("CPF ou CNPJ", "11222333000181");
  preencher("Senha", "senhaSegura1");
  fireEvent.click(screen.getByRole("button", { name: "Entrar" }));

  expect(await screen.findByRole("alert")).toHaveTextContent(
    "Não foi possível falar com o servidor",
  );
});
