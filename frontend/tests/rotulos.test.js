import { artigoDefinido, formatarData, idadeEstimada } from "../src/utils/rotulos";

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