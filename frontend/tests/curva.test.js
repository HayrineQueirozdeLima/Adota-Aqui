import { pegadasNaCurva, pontoNaCurva } from "../src/utils/curva";

// A conta que espalha as pegadas num caminho curvo (ponte do Quem somos e trilhas de patas)

const reta = { inicio: { x: 0, y: 0 }, controle: { x: 50, y: 0 }, fim: { x: 100, y: 0 } };

test("a curva começa no início, termina no fim e aponta pra onde vai", () => {
  expect(pontoNaCurva(0, reta)).toEqual({ x: 0, y: 0, angulo: 0 });
  expect(pontoNaCurva(1, reta)).toEqual({ x: 100, y: 0, angulo: 0 });
  expect(pontoNaCurva(0.5, reta).x).toBe(50);
});

test("as pegadas alternam de lado, como quem anda, com os dedos pra frente", () => {
  const [esquerda, direita] = pegadasNaCurva(reta, [0.25, 0.75], 10);
  expect(esquerda).toEqual({ x: 25, y: -10, giro: 90 });
  expect(direita).toEqual({ x: 75, y: 10, giro: 90 });
});
