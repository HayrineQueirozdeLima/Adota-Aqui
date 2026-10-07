import {
  animalParaFormulario,
  animalVazio,
  dataParaMesAno,
  errosDaApiParaFormulario,
  formularioParaApi,
  mascaraMesAno,
  mesAnoParaData,
  validarAnimal,
} from "../src/utils/formularioAnimal";

const hoje = new Date(2026, 9, 6); // 6 de outubro de 2026 (no JavaScript, janeiro é o mês 0)

const preenchido = {
  ...animalVazio,
  nome: " Mingau ",
  especie: "GATO",
  raca: "SRD_GATO",
  porte: "PEQUENO",
  sexo: "MACHO",
  peso: "4,2",
  nascimento: "06/2024",
  castrado: "SIM",
  energia: "MAIS_CALMO",
  historia: "Resgatado na chuva.",
  fotos: ["https://fotos.teste/1.jpg"],
  vacinas: [{ nome: "V4", dose: 1, dataAplicacao: "2026-08-10" }],
};

test("a máscara de nascimento monta MM/AAAA enquanto a pessoa digita", () => {
  expect(mascaraMesAno("0")).toBe("0");
  expect(mascaraMesAno("062")).toBe("06/2");
  expect(mascaraMesAno("06/2024")).toBe("06/2024");
  expect(mascaraMesAno("0620245")).toBe("06/2024");
});

test("converte o nascimento entre a tela e a API", () => {
  expect(mesAnoParaData("06/2024")).toBe("2024-06-01");
  expect(dataParaMesAno("2024-06-15")).toBe("06/2024");
  expect(dataParaMesAno(null)).toBe("");
});

test("monta o corpo da API: peso com vírgula, castrado como booleano, nome sem espaços", () => {
  expect(formularioParaApi(preenchido)).toEqual({
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
      cao: "NAO_TESTADO",
      gato: "NAO_TESTADO",
    },
    historia: "Resgatado na chuva.",
    fotos: ["https://fotos.teste/1.jpg"],
    vacinas: [{ nome: "V4", dose: 1, dataAplicacao: "2026-08-10" }],
  });
  expect(formularioParaApi({ ...preenchido, peso: "" }).peso).toBeNull();
});

test("a resposta da API volta pro formulário (ida e volta dão o mesmo corpo)", () => {
  const daApi = {
    ...formularioParaApi(preenchido),
    vacinas: [{ id: "v1", nome: "V4", dose: 1, dataAplicacao: "2026-08-10" }],
  };
  const formulario = animalParaFormulario(daApi);
  expect(formulario.peso).toBe("4,2");
  expect(formulario.castrado).toBe("SIM");
  expect(formulario.nascimento).toBe("06/2024");
  expect(formulario.vacinas).toEqual([
    { nome: "V4", dose: 1, dataAplicacao: "2026-08-10" },
  ]);
  expect(formularioParaApi(formulario)).toEqual(formularioParaApi(preenchido));
});

test("o formulário em branco acusa todos os obrigatórios", () => {
  expect(Object.keys(validarAnimal(animalVazio, hoje)).sort()).toEqual(
    [
      "castrado",
      "energia",
      "especie",
      "fotos",
      "historia",
      "nascimento",
      "nome",
      "porte",
      "raca",
      "sexo",
    ].sort(),
  );
  expect(validarAnimal(preenchido, hoje)).toEqual({});
});

test("confere peso e nascimento", () => {
  expect(validarAnimal({ ...preenchido, peso: "0" }, hoje).peso).toBeDefined();
  expect(
    validarAnimal({ ...preenchido, peso: "abc" }, hoje).peso,
  ).toBeDefined();
  expect(
    validarAnimal({ ...preenchido, nascimento: "13/2024" }, hoje).nascimento,
  ).toBe("O mês vai de 01 a 12.");
  expect(
    validarAnimal({ ...preenchido, nascimento: "11/2026" }, hoje).nascimento,
  ).toBe("A data não pode ser no futuro.");
  expect(
    validarAnimal({ ...preenchido, nascimento: "10/2026" }, hoje).nascimento,
  ).toBeUndefined();
  expect(
    validarAnimal({ ...preenchido, nascimento: "6/2024" }, hoje).nascimento,
  ).toMatch(/MM\/AAAA/);
});

test("os erros de campo da API chegam no campo certo do formulário", () => {
  expect(
    errosDaApiParaFormulario({
      "convivencia.crianca": "obrigatório",
      dataNascEstimada: "não pode ser futura",
      "fotos[0]": "URL inválida",
      racaDaEspecie: "A raça não pertence à espécie informada",
      nome: "obrigatório",
    }),
  ).toEqual({
    convivenciaCrianca: "obrigatório",
    nascimento: "não pode ser futura",
    fotos: "URL inválida",
    raca: "A raça não pertence à espécie informada",
    nome: "obrigatório",
  });
});
