import {
  descreverValor,
  grade,
  laresComPet,
  medidas,
  porcentagem,
  ranking,
  tomDoValor,
  valoresDaMedida,
} from "../src/utils/observatorio";
import { estatisticasPorEstadoExemplo } from "../src/mocks/estatisticas";
import { estados } from "../src/utils/rotulos";

// As contas do Observatório da adoção (/observatorio)

const medida = (id) => medidas.find((opcao) => opcao.id === id);

test("o mosaico tem os 27 estados, cada um num quadrado diferente", () => {
  expect(Object.keys(grade).sort()).toEqual(Object.keys(estados).sort());
  const lugares = Object.values(grade).map(([coluna, linha]) => `${coluna},${linha}`);
  expect(new Set(lugares).size).toBe(27);
});

test("a tabela do IBGE tem os 27 estados, com porcentagens que fazem sentido", () => {
  expect(Object.keys(laresComPet).sort()).toEqual(Object.keys(estados).sort());
  Object.values(laresComPet).forEach(({ cachorro, gato }) => {
    expect(cachorro > 30 && cachorro < 70).toBe(true);
    expect(gato > 10 && gato < 35).toBe(true);
  });
});

test("os tons: zero é nenhum ainda, e o resto vai de 1 a 5", () => {
  const doSite = { minimo: 0, maximo: 20 };
  expect(tomDoValor(0, doSite)).toBe(0);
  expect(tomDoValor(1, doSite)).toBe(1);
  expect(tomDoValor(12, doSite)).toBe(3);
  expect(tomDoValor(20, doSite)).toBe(5);
  // Porcentagem do IBGE: do menor estado ao maior, e o menor ainda ganha cor
  const doIbge = { minimo: 34, maximo: 64.8 };
  expect(tomDoValor(34, doIbge)).toBe(1);
  expect(tomDoValor(64.8, doIbge)).toBe(5);
  // Todos iguais: tudo no tom mais forte
  expect(tomDoValor(3, { minimo: 3, maximo: 3 })).toBe(5);
});

test("os valores de cada medida vêm do site ou do IBGE", () => {
  const animais = valoresDaMedida(medida("animaisDisponiveis"), estatisticasPorEstadoExemplo);
  expect(animais.RO).toBe(12);
  expect(animais.AC).toBe(0);
  expect(valoresDaMedida(medida("gato")).PI).toBe(32.6);
});

test("o ranking vai do maior pro menor, sem os zerados, e o empate fica em ordem alfabética", () => {
  expect(ranking({ RO: 12, SP: 20, AC: 0, RS: 12 })).toEqual([
    ["SP", 20],
    ["RO", 12],
    ["RS", 12],
  ]);
});

test("os textos dos números", () => {
  expect(descreverValor(medida("animaisDisponiveis"), 1)).toBe("1 animal esperando");
  expect(descreverValor(medida("adocoes"), 3)).toBe("3 adoções");
  expect(descreverValor(medida("cachorro"), 64.8)).toBe("64,8% dos lares têm cachorro");
  expect(porcentagem(16)).toBe("16,0%");
});
