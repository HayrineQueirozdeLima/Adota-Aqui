// Conta da curva de Bézier quadrática: o ponto e a direção da curva em t (de 0 a 1).
// Usada pra espalhar pegadas num caminho (a ponte do Quem somos e as trilhas de patas no fundo)
export function pontoNaCurva(t, { inicio, controle, fim }) {
    const u = 1 - t;
    const x = u * u * inicio.x + 2 * u * t * controle.x + t * t * fim.x;
    const y = u * u * inicio.y + 2 * u * t * controle.y + t * t * fim.y;
    const dx = 2 * u * (controle.x - inicio.x) + 2 * t * (fim.x - controle.x);
    const dy = 2 * u * (controle.y - inicio.y) + 2 * t * (fim.y - controle.y);
    return { x, y, angulo: (Math.atan2(dy, dx) * 180) / Math.PI };
}

// Pegadas ao longo da curva, alternando um pouco pra cada lado, como quem anda.
// O desenho da pata tem os dedos pra cima, por isso o giro é a direção da curva + 90 graus
export function pegadasNaCurva(curva, posicoes, afastamento) {
    return posicoes.map((t, posicao) => {
        const { x, y, angulo } = pontoNaCurva(t, curva);
        const lado = posicao % 2 === 0 ? -1 : 1;
        const radianos = (angulo * Math.PI) / 180;
        return {
            x: x + lado * afastamento * -Math.sin(radianos),
            y: y + lado * afastamento * Math.cos(radianos),
            giro: angulo + 90,
        };
    });
}
