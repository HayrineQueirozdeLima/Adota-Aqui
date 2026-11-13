import {
  enderecoDoMapa,
  enderecoNoGoogleMaps,
  linkDasClinicas,
  nomeDoLugar,
  textoDaBusca,
} from "../src/utils/clinicas";

// Endereços do Google Maps da página de clínicas (/clinicas)

const portoVelho = { cidade: " Porto Velho ", estado: "RO" };
const aqui = { latitude: -8.761234, longitude: -63.903876 };

describe("textoDaBusca", () => {
  test("pela cidade, sem os espaços que a pessoa deixou", () => {
    expect(textoDaBusca("todas", portoVelho)).toBe(
      "veterinário em Porto Velho RO",
    );
    expect(textoDaBusca("plantao", portoVelho)).toBe(
      "veterinário 24 horas em Porto Velho RO",
    );
  });

  test("pela localização, com o ponto arredondado em uns 100 metros", () => {
    expect(textoDaBusca("todas", aqui)).toBe(
      "veterinário perto de -8.761,-63.904",
    );
  });

  test("tipo desconhecido procura todas as clínicas", () => {
    expect(textoDaBusca("outro", portoVelho)).toBe(
      "veterinário em Porto Velho RO",
    );
  });
});

describe("enderecos do Google Maps", () => {
  test("o mapa embutido vai com a busca e abre mais perto pela localização", () => {
    const pelaCidade = new URL(enderecoDoMapa("todas", portoVelho));
    expect(pelaCidade.origin).toBe("https://maps.google.com");
    expect(pelaCidade.searchParams.get("q")).toBe(
      "veterinário em Porto Velho RO",
    );
    expect(pelaCidade.searchParams.get("output")).toBe("embed");
    expect(pelaCidade.searchParams.get("z")).toBe("12");

    const pelaLocalizacao = new URL(enderecoDoMapa("todas", aqui));
    expect(pelaLocalizacao.searchParams.get("z")).toBe("14");
  });

  test("o botão usa o link oficial do Maps", () => {
    const link = new URL(enderecoNoGoogleMaps("plantao", portoVelho));
    expect(link.origin + link.pathname).toBe(
      "https://www.google.com/maps/search/",
    );
    expect(link.searchParams.get("api")).toBe("1");
    expect(link.searchParams.get("query")).toBe(
      "veterinário 24 horas em Porto Velho RO",
    );
  });
});

test("nomeDoLugar", () => {
  expect(nomeDoLugar(portoVelho)).toBe("Porto Velho/RO");
  expect(nomeDoLugar(aqui)).toBe("você");
});

describe("linkDasClinicas", () => {
  test("usa a cidade do animal", () => {
    expect(
      linkDasClinicas({
        cidade: "Ji-Paraná",
        estado: "RO",
        protetor: { cidade: "Porto Velho", estado: "RO" },
      }),
    ).toBe("/clinicas?cidade=Ji-Paran%C3%A1&estado=RO");
  });

  test("sem a cidade do animal, usa a do protetor", () => {
    expect(
      linkDasClinicas({ protetor: { cidade: "Porto Velho", estado: "RO" } }),
    ).toBe("/clinicas?cidade=Porto+Velho&estado=RO");
  });

  test("sem cidade nenhuma, abre a página sem lugar", () => {
    expect(linkDasClinicas({})).toBe("/clinicas");
  });
});
