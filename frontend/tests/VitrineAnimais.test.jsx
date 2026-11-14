import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import VitrineAnimais from "../src/components/VitrineAnimais/VitrineAnimais";
import { AuthProvider } from "../src/contexts/AuthContext";
import { animaisExemplo } from "../src/mocks/animais";
import {
  buscasDeAnimais,
  paginaDe,
  resposta,
  simularApi,
  ultimaBuscaDeAnimais,
} from "./utils/apiFalsa";

// A API é quem filtra (estado, espécie, cidade...). Aqui o teste confere o que é trabalho do front:
// mandar os filtros certos, mandar o token, mostrar a resposta e as mensagens de cada situação.

const CHAVE = "adotaaqui.sessao";

function entrarComo(tipoConta) {
  localStorage.setItem(
    CHAVE,
    JSON.stringify({
      token: "token-de-teste",
      tipoConta,
      id: "1",
      nome: "Marina Prado",
      expiraEm: "2999-01-01T00:00:00Z",
    }),
  );
}

function renderizar() {
  render(
    <MemoryRouter>
      <AuthProvider>
        <VitrineAnimais />
      </AuthProvider>
    </MemoryRouter>,
  );
}

// Espera a grade aparecer e devolve o nome dos animais, na ordem da tela
async function nomesNaTela() {
  const titulos = await screen.findAllByRole("heading", { level: 3 });
  return titulos.map((titulo) => titulo.textContent);
}

function clicar(nome) {
  fireEvent.click(screen.getByRole("button", { name: nome }));
}

function escolher(rotulo, valor) {
  fireEvent.change(screen.getByLabelText(rotulo), { target: { value: valor } });
}

beforeEach(() => {
  simularApi();
});

afterEach(() => {
  localStorage.clear();
  sessionStorage.clear();
});

describe("busca na API", () => {
  test("mostra os animais que a API devolve, sem mandar filtro vazio", async () => {
    renderizar();

    expect(await nomesNaTela()).toEqual([
      "Mel",
      "Tobias",
      "Amora",
      "Bento",
      "Miau",
      "Tuca",
    ]);
    expect(fetch).toHaveBeenCalledWith(
      "http://api.teste/api/animais",
      expect.anything(),
    );
  });

  test("manda os filtros escolhidos como parâmetros", async () => {
    renderizar();
    await nomesNaTela();

    clicar("Gatos");
    clicar("Macho");
    escolher("Energia", "MAIS_CALMO");
    clicar("Bom com crianças");

    await waitFor(() =>
      expect(ultimaBuscaDeAnimais().parametros).toEqual({
        especie: "GATO",
        sexo: "MACHO",
        energia: "MAIS_CALMO",
        convivenciaCrianca: "CONVIVE_BEM",
      }),
    );
  });

  test("espera a pessoa parar de digitar a cidade pra buscar uma vez só", async () => {
    renderizar();
    await nomesNaTela();

    escolher("Cidade", "p");
    escolher("Cidade", "por");
    escolher("Cidade", "porto velho");

    await waitFor(() =>
      expect(ultimaBuscaDeAnimais().parametros).toEqual({
        cidade: "porto velho",
      }),
    );
    // a primeira busca (ao abrir) + uma só pras três mudanças
    expect(buscasDeAnimais()).toHaveLength(2);
  });

  test("busca pelo nome do animal ou do protetor, esperando a pessoa parar de digitar", async () => {
    renderizar();
    await nomesNaTela();

    escolher("Buscar por nome", "q");
    escolher("Buscar por nome", "quatro");
    escolher("Buscar por nome", "quatro patas");

    await waitFor(() =>
      expect(ultimaBuscaDeAnimais().parametros).toEqual({
        busca: "quatro patas",
      }),
    );
    expect(buscasDeAnimais()).toHaveLength(2);
  });

  test("limpar filtros apaga a busca e os filtros e traz todos de novo", async () => {
    renderizar();
    await nomesNaTela();

    escolher("Buscar por nome", "mel");
    clicar("Gatos");
    await waitFor(() =>
      expect(ultimaBuscaDeAnimais().parametros).toEqual({
        busca: "mel",
        especie: "GATO",
      }),
    );

    clicar("Limpar filtros");

    expect(screen.getByLabelText("Buscar por nome").value).toBe("");
    expect(screen.queryByRole("button", { name: "Limpar filtros" })).toBeNull();
    await waitFor(() => expect(ultimaBuscaDeAnimais().parametros).toEqual({}));
    expect(await nomesNaTela()).toHaveLength(6);
  });

  test("a primeira opção de cada lista é o todos, já marcado", async () => {
    renderizar();
    await nomesNaTela();
    expect(screen.getByLabelText("Porte")).toHaveDisplayValue("Todos os portes");
    expect(screen.getByLabelText("Energia")).toHaveDisplayValue("Qualquer energia");
    // sem espécie a raça fica travada e mostra só o nome do filtro
    expect(screen.getByLabelText("Raça")).toHaveDisplayValue("Raça");

    clicar("Gatos");
    expect(await screen.findByRole("option", { name: "Todas as raças" })).toBeInTheDocument();
    expect(screen.getByLabelText("Raça")).toHaveDisplayValue("Todas as raças");
    expect(screen.queryByRole("option", { name: "Raça" })).toBeNull();
  });

  test("a raça Outra aparece no filtro como Outras raças", async () => {
    simularApi({
      outras: (metodo, caminho) =>
        caminho === "/api/racas"
          ? resposta(200, [
              { valor: "SRD_GATO", nome: "Sem raça definida" },
              { valor: "OUTRA_GATO", nome: "Outra" },
            ])
          : undefined,
    });
    renderizar();
    await nomesNaTela();

    clicar("Gatos");
    expect(await screen.findByRole("option", { name: "Outras raças" })).toBeInTheDocument();
    expect(screen.queryByRole("option", { name: "Outra" })).toBeNull();
    escolher("Raça", "OUTRA_GATO");
    await waitFor(() =>
      expect(ultimaBuscaDeAnimais().parametros).toEqual({
        especie: "GATO",
        raca: "OUTRA_GATO",
      }),
    );
  });

  test("a raça vem da API e só libera depois de escolher a espécie", async () => {
    renderizar();
    await nomesNaTela();
    expect(screen.getByLabelText("Raça")).toBeDisabled();

    clicar("Gatos");
    await screen.findByRole("option", { name: "Siamês" });
    escolher("Raça", "SIAMES");
    await waitFor(() =>
      expect(ultimaBuscaDeAnimais().parametros).toEqual({
        especie: "GATO",
        raca: "SIAMES",
      }),
    );

    // trocou a espécie: a raça volta pra "qualquer uma"
    clicar("Cães");
    expect(screen.getByLabelText("Raça").value).toBe("");
    await waitFor(() =>
      expect(ultimaBuscaDeAnimais().parametros).toEqual({ especie: "CAO" }),
    );
  });

  test("avisa quando nada combina com o filtro e deixa ver todos de novo", async () => {
    simularApi({
      responderAnimais: (parametros) =>
        resposta(200, paginaDe(parametros.porte ? [] : animaisExemplo)),
    });
    renderizar();
    await nomesNaTela();

    escolher("Porte", "GRANDE");
    expect(
      await screen.findByText(
        "Nenhum resultado encontrado com essas informações.",
      ),
    ).toBeInTheDocument();

    clicar("Ver todos os animais");
    expect(await nomesNaTela()).toHaveLength(6);
  });

  // Quem usa leitor de tela não vê a grade mudar: a quantidade é anunciada depois de cada busca
  test("anuncia quantos animais a busca trouxe", async () => {
    simularApi({
      responderAnimais: (parametros) =>
        resposta(200, paginaDe(parametros.porte ? [] : animaisExemplo)),
    });
    renderizar();
    await nomesNaTela();
    expect(screen.getByText("6 animais encontrados")).toHaveAttribute(
      "role",
      "status",
    );

    escolher("Porte", "GRANDE");
    expect(await screen.findByText("Nenhum animal encontrado")).toHaveAttribute(
      "role",
      "status",
    );
  });

  test("avisa quando a API falha e deixa tentar de novo", async () => {
    let tentativas = 0;
    simularApi({
      responderAnimais: () => {
        tentativas += 1;
        return tentativas === 1
          ? resposta(500, { status: 500, mensagem: "Erro interno" })
          : resposta(200, paginaDe(animaisExemplo));
      },
    });
    renderizar();

    expect(await screen.findByRole("alert")).toHaveTextContent(
      "Não foi possível carregar os animais",
    );
    clicar("Tentar de novo");
    expect(await nomesNaTela()).toHaveLength(6);
  });
});

describe("ordem da vitrine", () => {
  test("começa pelos mais recentes e pode mostrar primeiro quem espera há mais tempo", async () => {
    renderizar();
    await nomesNaTela();
    expect(screen.getByLabelText("Ordenar por")).toHaveDisplayValue("Mais recentes");

    escolher("Ordenar por", "MAIS_ANTIGOS");

    await waitFor(() =>
      expect(ultimaBuscaDeAnimais().parametros).toEqual({ ordem: "MAIS_ANTIGOS" }),
    );
    // A ordem não é filtro: não aparece o "Limpar filtros"
    expect(screen.queryByRole("button", { name: "Limpar filtros" })).toBeNull();
  });

  test("limpar os filtros mantém a ordem escolhida", async () => {
    renderizar();
    await nomesNaTela();

    escolher("Ordenar por", "MAIS_ANTIGOS");
    clicar("Gatos");
    await waitFor(() =>
      expect(ultimaBuscaDeAnimais().parametros).toEqual({
        ordem: "MAIS_ANTIGOS",
        especie: "GATO",
      }),
    );

    clicar("Limpar filtros");

    await waitFor(() =>
      expect(ultimaBuscaDeAnimais().parametros).toEqual({ ordem: "MAIS_ANTIGOS" }),
    );
    expect(screen.getByLabelText("Ordenar por")).toHaveDisplayValue(
      "Esperando há mais tempo",
    );
  });
});

describe("quem está vendo", () => {
  test("visitante: busca sem token e é convidado a entrar", async () => {
    renderizar();
    await nomesNaTela();

    expect(ultimaBuscaDeAnimais().opcoes.headers.Authorization).toBeUndefined();
    expect(
      screen.getByRole("link", { name: "entre para filtrar pelo seu" }),
    ).toHaveAttribute("href", "/login");
  });

  test("Usuario: busca com o token e vê o aviso do estado dele", async () => {
    entrarComo("USUARIO");
    renderizar();
    await nomesNaTela();

    expect(ultimaBuscaDeAnimais().opcoes.headers.Authorization).toBe(
      "Bearer token-de-teste",
    );
    expect(
      screen.getByText("Exibindo animais do seu estado."),
    ).toBeInTheDocument();
    expect(
      screen.queryByRole("link", { name: "entre para filtrar pelo seu" }),
    ).not.toBeInTheDocument();
  });

  test("Usuario sem animais no estado vê a mensagem do UC06 FA01", async () => {
    entrarComo("USUARIO");
    simularApi({ responderAnimais: () => resposta(200, paginaDe([])) });
    renderizar();

    expect(
      await screen.findByText(
        "Nenhum animal disponível no seu estado no momento.",
      ),
    ).toBeInTheDocument();
  });

  test("Abrigo: vê todos os estados, sem o convite pra entrar", async () => {
    entrarComo("ABRIGO");
    renderizar();
    await nomesNaTela();

    expect(
      screen.getByText("Exibindo animais de todos os estados brasileiros."),
    ).toBeInTheDocument();
    expect(
      screen.queryByRole("link", { name: "entre para filtrar pelo seu" }),
    ).not.toBeInTheDocument();
  });

  test("token vencido: sai da conta e mostra a vitrine como visitante", async () => {
    entrarComo("USUARIO");
    simularApi({
      responderAnimais: (parametros, opcoes) =>
        opcoes.headers.Authorization
          ? resposta(401, { status: 401, mensagem: "Autenticação necessária" })
          : resposta(200, paginaDe(animaisExemplo)),
    });
    renderizar();

    expect(
      await screen.findByRole("link", { name: "entre para filtrar pelo seu" }),
    ).toBeInTheDocument();
    expect(await nomesNaTela()).toHaveLength(6);
    expect(localStorage.getItem(CHAVE)).toBeNull();
  });
});

// A API manda 12 animais por vez. Aqui, pra encurtar, cada página tem os 6 de exemplo
describe("paginação", () => {
  const segundaPagina = animaisExemplo.map((animal) => ({
    ...animal,
    id: `${animal.id}-2`,
    nome: `${animal.nome} 2`,
  }));

  function simularDuasPaginas({ falharUmaVez = false } = {}) {
    let falhas = falharUmaVez ? 1 : 0;
    simularApi({
      responderAnimais: (parametros) => {
        if (!parametros.pagina) {
          return resposta(200, paginaDe(animaisExemplo, { tamanho: 6, totalItens: 12 }));
        }
        if (falhas > 0) {
          falhas -= 1;
          return resposta(500, { status: 500, mensagem: "Erro interno" });
        }
        return resposta(
          200,
          paginaDe(segundaPagina, { pagina: 1, tamanho: 6, totalItens: 12 }),
        );
      },
    });
  }

  test("o Ver mais traz a próxima página e leva o foco pro primeiro animal novo", async () => {
    simularDuasPaginas();
    renderizar();
    expect(await nomesNaTela()).toHaveLength(6);
    expect(screen.getByText("Mostrando 6 de 12 animais")).toBeInTheDocument();
    expect(screen.getByText("12 animais encontrados")).toBeInTheDocument();

    clicar("Ver mais animais");
    await waitFor(() =>
      expect(screen.getAllByRole("heading", { level: 3 })).toHaveLength(12),
    );
    expect(ultimaBuscaDeAnimais().parametros).toEqual({ pagina: "1" });
    expect(screen.getAllByRole("heading", { level: 3 })[6]).toHaveTextContent("Mel 2");
    expect(document.activeElement).toBe(
      screen.getByRole("link", { name: "Quero conhecer Mel 2" }),
    );
    // Chegou no fim: o botão some
    expect(
      screen.queryByRole("button", { name: "Ver mais animais" }),
    ).not.toBeInTheDocument();
  });

  test("se a próxima página falhar, avisa e deixa tentar de novo sem perder o que já apareceu", async () => {
    simularDuasPaginas({ falharUmaVez: true });
    renderizar();
    await nomesNaTela();

    clicar("Ver mais animais");
    expect(await screen.findByRole("alert")).toHaveTextContent(
      "Não foi possível carregar mais animais",
    );
    expect(screen.getAllByRole("heading", { level: 3 })).toHaveLength(6);

    clicar("Ver mais animais");
    await waitFor(() =>
      expect(screen.getAllByRole("heading", { level: 3 })).toHaveLength(12),
    );
    expect(screen.queryByRole("alert")).not.toBeInTheDocument();
  });

  test("mudar um filtro volta pra primeira página", async () => {
    simularDuasPaginas();
    renderizar();
    await nomesNaTela();
    clicar("Ver mais animais");
    await waitFor(() =>
      expect(screen.getAllByRole("heading", { level: 3 })).toHaveLength(12),
    );

    clicar("Cães");
    await waitFor(() =>
      expect(ultimaBuscaDeAnimais().parametros).toEqual({ especie: "CAO" }),
    );
    await waitFor(() =>
      expect(screen.getAllByRole("heading", { level: 3 })).toHaveLength(6),
    );
    expect(screen.getByText("Mostrando 6 de 12 animais")).toBeInTheDocument();
  });

  test("um animal que já apareceu não entra duas vezes", async () => {
    // Alguém cadastrou um animal no meio: a segunda página repete a Amora
    simularApi({
      responderAnimais: (parametros) =>
        parametros.pagina
          ? resposta(200, paginaDe([animaisExemplo[2], ...segundaPagina.slice(0, 2)], {
              pagina: 1,
              tamanho: 6,
              totalItens: 9,
            }))
          : resposta(200, paginaDe(animaisExemplo, { tamanho: 6, totalItens: 9 })),
    });
    renderizar();
    await nomesNaTela();

    clicar("Ver mais animais");
    await waitFor(() =>
      expect(screen.getAllByRole("heading", { level: 3 })).toHaveLength(8),
    );
    expect(screen.getAllByRole("heading", { level: 3, name: "Amora" })).toHaveLength(1);
  });
});
