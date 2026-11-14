import { render, screen, waitFor, within } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import Rodape from "../src/components/Rodape/Rodape";
import { esquecerIaDisponivel } from "../src/hooks/useIaDisponivel";
import { resposta, simularApi } from "./utils/apiFalsa";

// O rodapé pergunta pra API se a IA está ligada (pro link do "Me ajuda a escolher")
function simularIa(ligada) {
  simularApi({
    outras: (metodo, caminho) =>
      caminho === "/api/ia/disponivel" ? resposta(200, { disponivel: ligada }) : undefined,
  });
}

function renderizar() {
  render(
    <MemoryRouter>
      <Rodape />
    </MemoryRouter>,
  );
}

const grupo = (nome) => screen.getByRole("list", { name: nome });

beforeEach(() => {
  esquecerIaDisponivel();
  simularIa(true);
});

test("os links ficam em grupos pelo que a pessoa quer fazer, e cada um leva pra tela certa", async () => {
  renderizar();
  // espera a resposta da IA, pra tela terminar de carregar dentro do teste
  await within(grupo("Adotar")).findByRole("link", { name: "Me ajuda a escolher" });

  const destinos = {
    Adotar: {
      "Explorar animais": "/animais",
      "Me ajuda a escolher": "/me-ajuda-a-escolher",
      "Como adotar": "/#como-funciona",
      "Feiras de adoção": "/feiras",
      "Histórias de adoção": "/historias",
    },
    Cuidar: {
      "Clínicas veterinárias": "/clinicas",
      "Blog para tutores": "/blog",
    },
    "Para protetores": {
      "Abrigos e protetores independentes": "/protetores",
      "Cadastrar um animal": "/meus-animais/novo",
      "Divulgar uma feira": "/feiras/nova",
    },
    "O projeto": {
      "Quem somos": "/quem-somos",
      "Observatório da adoção": "/observatorio",
    },
  };
  for (const [nomeDoGrupo, links] of Object.entries(destinos)) {
    expect(screen.getByRole("heading", { level: 2, name: nomeDoGrupo })).toBeInTheDocument();
    for (const [nome, destino] of Object.entries(links)) {
      expect(within(grupo(nomeDoGrupo)).getByRole("link", { name: nome })).toHaveAttribute("href", destino);
    }
  }
});

test("a documentação da API e o código no GitHub abrem em outra aba", async () => {
  renderizar();
  await waitFor(() => expect(fetch).toHaveBeenCalled());

  const api = within(grupo("O projeto")).getByRole("link", { name: "Documentação da API (abre em outra aba)" });
  expect(api).toHaveAttribute("href", "http://api.teste/swagger-ui.html");
  expect(api).toHaveAttribute("target", "_blank");
  expect(api).toHaveAttribute("rel", "noreferrer");

  const codigo = within(grupo("O projeto")).getByRole("link", { name: "Código no GitHub (abre em outra aba)" });
  expect(codigo).toHaveAttribute("href", "https://github.com/HayrineQueirozdeLima/Adota-Aqui");
  expect(codigo).toHaveAttribute("target", "_blank");
});

test("sem a IA ligada, o Me ajuda a escolher sai do rodapé", async () => {
  simularIa(false);
  renderizar();
  await waitFor(() =>
    expect(screen.queryByRole("link", { name: "Me ajuda a escolher" })).not.toBeInTheDocument(),
  );
  expect(within(grupo("Adotar")).getByRole("link", { name: "Explorar animais" })).toBeInTheDocument();
});
