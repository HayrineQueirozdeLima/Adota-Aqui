import {
  artigoDefinido,
  descricaoDaVacina,
  formatarData,
  idadeEstimada,
  resumoDoAnimal,
} from "../src/utils/rotulos";

describe("idadeEstimada", () => {
    const hoje = new Date(2026, 9, 4); // 4 de outubro de 2026 (no JavaScript, janeiro é o mês 0)

    test("em anos", () => {
        expect(idadeEstimada("2024-03-10", hoje)).toBe("2 anos");
        expect(idadeEstimada("2025-10-04", hoje)).toBe("1 ano");
    });

    test("em meses, abaixo de 1 ano", () => {
        expect(idadeEstimada("2026-02-01", hoje)).toBe("8 meses");
        expect(idadeEstimada("2026-09-04", hoje)).toBe("1 mês");
        expect(idadeEstimada("2026-09-20", hoje)).toBe("Menos de 1 mês");
    });

    test("ainda não fez aniversário este ano", () => {
        expect(idadeEstimada("2024-10-05", hoje)).toBe("1 ano");
    });

    test("sem data, não mostra idade", () => {
        expect(idadeEstimada(null, hoje)).toBeNull();
    });
});

test("formatarData troca o formato da API pelo brasileiro", () => {
    expect(formatarData("2026-03-12")).toBe("12/03/2026");
    expect(formatarData(null)).toBe("");
});

test("artigoDefinido acompanha o sexo do animal", () => {
    expect(artigoDefinido("FEMEA")).toBe("a");
    expect(artigoDefinido("MACHO")).toBe("o");
});

test("resumoDoAnimal monta uma frase, e o peso é opcional", () => {
  expect(
    resumoDoAnimal({ especie: "CAO", racaNome: "Sem raça definida", porte: "MEDIO", peso: 14 }),
  ).toBe("Cão, sem raça definida, porte médio, 14 kg");
  expect(resumoDoAnimal({ especie: "GATO", racaNome: "Siamês", porte: "PEQUENO", peso: null })).toBe(
    "Gato, siamês, porte pequeno",
  );
});

test("descricaoDaVacina junta dose e data, e funciona com só uma das duas", () => {
  expect(descricaoDaVacina({ dose: 2, dataAplicacao: "2026-03-12" })).toBe("2ª dose, aplicada em 12/03/2026");
  expect(descricaoDaVacina({ dose: 1, dataAplicacao: null })).toBe("1ª dose");
  expect(descricaoDaVacina({ dose: null, dataAplicacao: "2026-04-20" })).toBe("Aplicada em 20/04/2026");
});
