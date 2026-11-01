import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { MemoryRouter, Route, Routes } from "react-router-dom";
import { AuthProvider } from "../src/contexts/AuthContext";
import { perfilAbrigoExemplo, perfilUsuarioExemplo } from "../src/mocks/perfil";
import Perfil from "../src/pages/Perfil/Perfil";
import RotaProtegida from "../src/routes/RotaProtegida";
import { resposta, simularApi } from "./utils/apiFalsa";

// Meu perfil (RF17, UC10). A API de mentira devolve os perfis de src/mocks/perfil.js,
// e o PUT responde com os dados que chegaram, como o back faz

const CHAVE = "adotaaqui.sessao";

function entrar(tipoConta = "USUARIO", armazenamento = localStorage) {
  armazenamento.setItem(
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

// "respostaDoGet", "recusarPerfil" e "recusarSenha" trocam a resposta do GET, do PUT e do PATCH
function simularPerfil({ respostaDoGet, recusarPerfil, recusarSenha } = {}) {
  simularApi({
    outras: (metodo, caminho, opcoes) => {
      if (caminho === "/api/usuarios/me" || caminho === "/api/abrigos/me") {
        if (metodo === "GET") return respostaDoGet;
        const perfil =
          caminho === "/api/abrigos/me"
            ? perfilAbrigoExemplo
            : perfilUsuarioExemplo;
        return (
          recusarPerfil ??
          resposta(200, { ...perfil, ...JSON.parse(opcoes.body) })
        );
      }
      if (caminho.endsWith("/me/senha"))
        return recusarSenha ?? resposta(204, null);
      // ViaCEP
      if (caminho.startsWith("/ws/")) {
        return resposta(200, {
          logradouro: "Avenida Paulista",
          bairro: "Bela Vista",
          localidade: "São Paulo",
          uf: "SP",
        });
      }
      return undefined;
    },
  });
}

function abrir() {
  render(
    <MemoryRouter initialEntries={["/perfil"]}>
      <AuthProvider>
        <Routes>
          <Route element={<RotaProtegida />}>
            <Route path="/perfil" element={<Perfil />} />
          </Route>
          <Route path="/" element={<h1>Página inicial</h1>} />
          <Route path="/login" element={<h1>Entrar na sua conta</h1>} />
        </Routes>
      </AuthProvider>
    </MemoryRouter>,
  );
}

async function esperarFormulario() {
  await screen.findByRole("button", { name: "Salvar alterações" });
}

const chamadas = (metodo, final) =>
  fetch.mock.calls.filter(
    ([url, opcoes]) =>
      (opcoes?.method ?? "GET") === metodo && url.endsWith(final),
  );

const corpoDe = ([, opcoes]) => JSON.parse(opcoes.body);

function digitar(rotulo, valor) {
  fireEvent.change(screen.getByLabelText(rotulo), { target: { value: valor } });
}

function salvar() {
  fireEvent.click(screen.getByRole("button", { name: "Salvar alterações" }));
}

function preencherSenhas(atual, nova, confirmacao = nova) {
  digitar("Senha atual", atual);
  digitar("Nova senha", nova);
  digitar("Confirmar nova senha", confirmacao);
}

const nomeNaSessao = (armazenamento = localStorage) =>
  JSON.parse(armazenamento.getItem(CHAVE))?.nome;

afterEach(() => {
  localStorage.clear();
  sessionStorage.clear();
});

describe("carregar", () => {
  test("pessoa: busca o perfil com o token e preenche o formulário", async () => {
    entrar();
    simularPerfil();
    abrir();
    expect(screen.getByText("Carregando seu perfil...")).toBeInTheDocument();
    await esperarFormulario();

    const [[url, opcoes]] = chamadas("GET", "/api/usuarios/me");
    expect(url).toBe("http://api.teste/api/usuarios/me");
    expect(opcoes.headers.Authorization).toBe("Bearer token-de-teste");
    expect(screen.getByLabelText("CPF")).toHaveValue("529.982.247-25");
    expect(screen.getByLabelText("CPF")).toHaveAttribute("readonly");
    expect(screen.getByLabelText("Nome completo")).toHaveValue("Marina Prado");
    expect(screen.getByLabelText("Telefone")).toHaveValue("(69) 98877-1122");
    expect(screen.getByLabelText("E-mail")).toHaveValue("marina@example.com");
    expect(screen.getByLabelText("CEP")).toHaveValue("76801-000");
    expect(screen.getByLabelText("Cidade")).toHaveValue("Porto Velho");
    expect(screen.getByLabelText("Estado")).toHaveValue("RO");
    expect(screen.getByLabelText("Número")).toHaveValue("1040");
    expect(screen.getByText("Pessoa física")).toBeInTheDocument();
    expect(
      screen.getByText(/Mudar o estado muda o que você vê/),
    ).toBeInTheDocument();
    expect(screen.queryByLabelText("Razão social")).toBeNull();
  });

  test("abrigo: usa o perfil do abrigo, com CNPJ e razão social", async () => {
    entrar("ABRIGO");
    simularPerfil();
    abrir();
    await esperarFormulario();

    expect(chamadas("GET", "/api/abrigos/me")).toHaveLength(1);
    expect(chamadas("GET", "/api/usuarios/me")).toHaveLength(0);
    expect(screen.getByLabelText("CNPJ")).toHaveValue("12.345.678/0001-95");
    expect(screen.getByLabelText("Nome institucional")).toHaveValue(
      "Instituto Quatro Patas",
    );
    expect(screen.getByLabelText("Razão social")).toHaveValue(
      "Instituto Quatro Patas de Proteção Animal",
    );
    expect(screen.getByText("Abrigo ou ONG")).toBeInTheDocument();
    expect(
      screen.getByText(/Mudar o estado muda quem vê os seus animais/),
    ).toBeInTheDocument();
  });

  test("erro ao carregar oferece tentar de novo", async () => {
    let tentativas = 0;
    simularApi({
      outras: (metodo, caminho) => {
        if (caminho !== "/api/usuarios/me") return undefined;
        tentativas += 1;
        // na segunda vez, a resposta padrão (o perfil de exemplo)
        return tentativas === 1
          ? resposta(500, { status: 500, mensagem: "Erro interno" })
          : undefined;
      },
    });
    entrar();
    abrir();

    fireEvent.click(
      await screen.findByRole("button", { name: "Tentar de novo" }),
    );

    await esperarFormulario();
    expect(tentativas).toBe(2);
  });

  test("com o token vencido, encerra a sessão e vai pro login", async () => {
    entrar();
    simularPerfil({
      respostaDoGet: resposta(401, {
        status: 401,
        mensagem: "Token inválido ou expirado",
      }),
    });
    abrir();

    expect(
      await screen.findByRole("heading", { name: "Entrar na sua conta" }),
    ).toBeInTheDocument();
    expect(localStorage.getItem(CHAVE)).toBeNull();
  });

  test("sair da conta apaga a sessão e volta pra página inicial", async () => {
    entrar();
    simularPerfil();
    abrir();
    await esperarFormulario();

    fireEvent.click(screen.getByRole("button", { name: "Sair da conta" }));

    expect(
      screen.getByRole("heading", { name: "Página inicial" }),
    ).toBeInTheDocument();
    expect(localStorage.getItem(CHAVE)).toBeNull();
  });
});

describe("salvar os dados", () => {
  beforeEach(() => entrar());

  test("envia os campos editáveis sem máscara e sem o CPF, e o nome novo vai pra sessão", async () => {
    simularPerfil();
    abrir();
    await esperarFormulario();

    digitar("Nome completo", "Marina Prado Souza");
    digitar("Telefone", "69977776666");
    salvar();

    expect(await screen.findByText("Perfil atualizado.")).toBeInTheDocument();
    const [envio] = chamadas("PUT", "/api/usuarios/me");
    expect(envio[1].headers.Authorization).toBe("Bearer token-de-teste");
    expect(corpoDe(envio)).toEqual({
      nome: "Marina Prado Souza",
      telefone: "69977776666",
      email: "marina@example.com",
      endereco: {
        cep: "76801000",
        cidade: "Porto Velho",
        estado: "RO",
        logradouro: "Avenida Sete de Setembro",
        bairro: "Centro",
        numero: "1040",
      },
    });
    expect(nomeNaSessao()).toBe("Marina Prado Souza");
    expect(chamadas("PATCH", "/me/senha")).toHaveLength(0);
  });

  test("com a sessão no sessionStorage, o nome novo fica lá", async () => {
    localStorage.clear();
    entrar("USUARIO", sessionStorage);
    simularPerfil();
    abrir();
    await esperarFormulario();

    digitar("Nome completo", "Marina P.");
    salvar();

    await screen.findByText("Perfil atualizado.");
    expect(nomeNaSessao(sessionStorage)).toBe("Marina P.");
    expect(localStorage.getItem(CHAVE)).toBeNull();
  });

  test("o abrigo envia a razão social, e o CNPJ não vai", async () => {
    localStorage.clear();
    entrar("ABRIGO");
    simularPerfil();
    abrir();
    await esperarFormulario();

    digitar("Razão social", "Associação Quatro Patas");
    salvar();

    await screen.findByText("Perfil atualizado.");
    const corpo = corpoDe(chamadas("PUT", "/api/abrigos/me")[0]);
    expect(corpo.razaoSocial).toBe("Associação Quatro Patas");
    expect(corpo).not.toHaveProperty("cnpj");
  });

  test("trocar o CEP preenche o endereço e o estado novo vai no PUT", async () => {
    simularPerfil();
    abrir();
    await esperarFormulario();

    digitar("CEP", "01310100");
    await waitFor(() =>
      expect(screen.getByLabelText("Estado")).toHaveValue("SP"),
    );
    expect(screen.getByLabelText("Cidade")).toHaveValue("São Paulo");
    digitar("Número", "1578");
    salvar();

    await screen.findByText("Perfil atualizado.");
    expect(corpoDe(chamadas("PUT", "/api/usuarios/me")[0]).endereco).toEqual({
      cep: "01310100",
      cidade: "São Paulo",
      estado: "SP",
      logradouro: "Avenida Paulista",
      bairro: "Bela Vista",
      numero: "1578",
    });
  });

  test("campo inválido não chama a API e leva o foco pro primeiro erro", async () => {
    simularPerfil();
    abrir();
    await esperarFormulario();

    digitar("Nome completo", " ");
    digitar("E-mail", "marina@");
    salvar();

    expect(screen.getByText("Informe seu nome.")).toBeInTheDocument();
    expect(
      screen.getByText("E-mail inválido. Confira o endereço."),
    ).toBeInTheDocument();
    expect(screen.getByLabelText("Nome completo")).toHaveFocus();
    expect(chamadas("PUT", "/api/usuarios/me")).toHaveLength(0);
  });

  test("e-mail de outra conta aparece embaixo do e-mail", async () => {
    simularPerfil({
      recusarPerfil: resposta(409, {
        status: 409,
        mensagem: "Já existe uma conta cadastrada com este e-mail",
      }),
    });
    abrir();
    await esperarFormulario();

    digitar("E-mail", "joao@example.com");
    salvar();

    expect(
      await screen.findByText("Já existe uma conta cadastrada com este e-mail"),
    ).toBeInTheDocument();
    expect(screen.getByLabelText("E-mail")).toHaveAttribute(
      "aria-invalid",
      "true",
    );
    expect(nomeNaSessao()).toBe("Marina Prado");
  });

  test("os erros de campo que a API devolve aparecem no campo", async () => {
    simularPerfil({
      recusarPerfil: resposta(400, {
        status: 400,
        mensagem: "Existem campos preenchidos de forma incorreta",
        campos: { nome: "Deve ter no máximo 120 caracteres" },
      }),
    });
    abrir();
    await esperarFormulario();

    digitar("Nome completo", "Marina com um nome comprido");
    salvar();

    expect(
      await screen.findByText("Deve ter no máximo 120 caracteres"),
    ).toBeInTheDocument();
    expect(screen.getByLabelText("Nome completo")).toHaveAttribute(
      "aria-invalid",
      "true",
    );
  });

  test("sem mudança, avisa que não tem o que salvar e não chama a API", async () => {
    simularPerfil();
    abrir();
    await esperarFormulario();

    expect(screen.getByRole("button", { name: "Cancelar" })).toBeDisabled();
    salvar();

    expect(
      screen.getByText("Nada para salvar: nenhum dado foi alterado."),
    ).toBeInTheDocument();
    expect(chamadas("PUT", "/api/usuarios/me")).toHaveLength(0);
  });

  test("cancelar desfaz as alterações e limpa as senhas", async () => {
    simularPerfil();
    abrir();
    await esperarFormulario();

    digitar("Nome completo", "Outro nome");
    digitar("Senha atual", "abc");
    const cancelar = screen.getByRole("button", { name: "Cancelar" });
    expect(cancelar).toBeEnabled();
    fireEvent.click(cancelar);

    expect(screen.getByLabelText("Nome completo")).toHaveValue("Marina Prado");
    expect(screen.getByLabelText("Senha atual")).toHaveValue("");
    expect(cancelar).toBeDisabled();
  });

  test("com a sessão vencida ao salvar, encerra a sessão", async () => {
    simularPerfil({
      recusarPerfil: resposta(401, {
        status: 401,
        mensagem: "Token inválido ou expirado",
      }),
    });
    abrir();
    await esperarFormulario();

    digitar("Nome completo", "Marina P.");
    salvar();

    expect(
      await screen.findByRole("heading", { name: "Entrar na sua conta" }),
    ).toBeInTheDocument();
    expect(localStorage.getItem(CHAVE)).toBeNull();
  });
});

describe("trocar a senha", () => {
  beforeEach(() => entrar());

  test("só a senha: troca, avisa e limpa os campos", async () => {
    simularPerfil();
    abrir();
    await esperarFormulario();

    preencherSenhas("minhaSenha123", "novaSenha456");
    salvar();

    expect(
      await screen.findByText(
        "Senha trocada. Use a nova senha na próxima vez que entrar.",
      ),
    ).toBeInTheDocument();
    const [envio] = chamadas("PATCH", "/api/usuarios/me/senha");
    expect(corpoDe(envio)).toEqual({
      senhaAtual: "minhaSenha123",
      novaSenha: "novaSenha456",
      confirmacaoNovaSenha: "novaSenha456",
    });
    expect(chamadas("PUT", "/api/usuarios/me")).toHaveLength(0);
    expect(screen.getByLabelText("Senha atual")).toHaveValue("");
    expect(screen.getByLabelText("Nova senha")).toHaveValue("");
  });

  test("dados e senha juntos: primeiro o PUT, depois o PATCH", async () => {
    simularPerfil();
    abrir();
    await esperarFormulario();

    digitar("Nome completo", "Marina Prado Souza");
    preencherSenhas("minhaSenha123", "novaSenha456");
    salvar();

    expect(
      await screen.findByText("Perfil atualizado e senha trocada."),
    ).toBeInTheDocument();
    const metodos = fetch.mock.calls
      .filter(([url]) => url.includes("/api/usuarios/me"))
      .map(([, opcoes]) => opcoes?.method ?? "GET");
    expect(metodos).toEqual(["GET", "PUT", "PATCH"]);
  });

  test("começou a preencher, os três campos passam a ser obrigatórios", async () => {
    simularPerfil();
    abrir();
    await esperarFormulario();

    digitar("Nova senha", "curta");
    salvar();

    expect(screen.getByText("Informe a senha atual.")).toBeInTheDocument();
    expect(
      screen.getByText("A nova senha precisa ter pelo menos 8 caracteres."),
    ).toBeInTheDocument();
    expect(screen.getByText("Repita a nova senha.")).toBeInTheDocument();
    expect(chamadas("PATCH", "/me/senha")).toHaveLength(0);
  });

  test("senha atual errada aparece no campo e a pessoa continua logada", async () => {
    simularPerfil({
      recusarSenha: resposta(400, {
        status: 400,
        mensagem: "A senha atual está incorreta",
        campos: { senhaAtual: "A senha atual está incorreta" },
      }),
    });
    abrir();
    await esperarFormulario();

    preencherSenhas("senhaErrada1", "novaSenha456");
    salvar();

    expect(
      await screen.findByText("A senha atual está incorreta"),
    ).toBeInTheDocument();
    expect(screen.getByLabelText("Senha atual")).toHaveAttribute(
      "aria-invalid",
      "true",
    );
    expect(localStorage.getItem(CHAVE)).not.toBeNull();
  });

  test("se os dados salvam e a senha não, diz o que aconteceu", async () => {
    simularPerfil({
      recusarSenha: resposta(400, {
        status: 400,
        mensagem: "A senha atual está incorreta",
        campos: { senhaAtual: "A senha atual está incorreta" },
      }),
    });
    abrir();
    await esperarFormulario();

    digitar("Nome completo", "Marina Prado Souza");
    preencherSenhas("senhaErrada1", "novaSenha456");
    salvar();

    expect(await screen.findByRole("alert")).toHaveTextContent(
      "Seus dados foram salvos, mas a senha não foi trocada.",
    );
    expect(
      screen.getByText("A senha atual está incorreta"),
    ).toBeInTheDocument();
    expect(nomeNaSessao()).toBe("Marina Prado Souza");
  });
});
