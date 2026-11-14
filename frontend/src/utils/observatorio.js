// Dados e contas do Observatório da adoção (/observatorio)

// O mapa do Brasil "em mosaico": cada estado é um quadrado, no lugar aproximado dele.
// [coluna, linha], com o norte em cima. Não precisa do desenho dos estados nem de biblioteca
export const grade = {
    RR: [1, 0], AP: [3, 0],
    AM: [1, 1], PA: [2, 1], MA: [3, 1], CE: [4, 1], RN: [5, 1],
    AC: [0, 2], RO: [1, 2], MT: [2, 2], TO: [3, 2], PI: [4, 2], PB: [5, 2],
    MS: [2, 3], GO: [3, 3], BA: [4, 3], PE: [5, 3],
    SP: [2, 4], DF: [3, 4], MG: [4, 4], AL: [5, 4],
    PR: [2, 5], RJ: [3, 5], ES: [4, 5], SE: [5, 5],
    SC: [2, 6],
    RS: [2, 7],
};

// Porcentagem dos domicílios com pelo menos um cachorro e com pelo menos um gato, por estado.
// IBGE, Pesquisa Nacional de Saúde 2019 (a última com essa pergunta).
// A tabela dos 27 estados foi tirada da compilação do Panorama PetVet, e os números de gato
// conferem com a do DCI. Os do Brasil (46,1% e 19,3%) estão na publicação do próprio IBGE
export const laresComPet = {
    AC: { cachorro: 60.0, gato: 26.4 },
    AL: { cachorro: 34.0, gato: 24.8 },
    AM: { cachorro: 49.1, gato: 21.8 },
    AP: { cachorro: 54.4, gato: 22.8 },
    BA: { cachorro: 36.4, gato: 20.2 },
    CE: { cachorro: 38.8, gato: 29.3 },
    DF: { cachorro: 41.1, gato: 10.3 },
    ES: { cachorro: 40.3, gato: 13.2 },
    GO: { cachorro: 58.2, gato: 14.7 },
    MA: { cachorro: 42.8, gato: 31.5 },
    MG: { cachorro: 47.8, gato: 14.5 },
    MS: { cachorro: 61.5, gato: 21.1 },
    MT: { cachorro: 61.2, gato: 22.6 },
    PA: { cachorro: 50.2, gato: 26.4 },
    PB: { cachorro: 35.6, gato: 21.7 },
    PE: { cachorro: 34.2, gato: 20.1 },
    PI: { cachorro: 45.8, gato: 32.6 },
    PR: { cachorro: 58.7, gato: 18.2 },
    RJ: { cachorro: 38.1, gato: 14.6 },
    RN: { cachorro: 39.3, gato: 20.6 },
    RO: { cachorro: 64.8, gato: 26.9 },
    RR: { cachorro: 58.9, gato: 23.5 },
    RS: { cachorro: 58.7, gato: 25.2 },
    SC: { cachorro: 53.3, gato: 19.5 },
    SE: { cachorro: 34.7, gato: 24.4 },
    SP: { cachorro: 45.5, gato: 16.0 },
    TO: { cachorro: 49.0, gato: 27.2 },
};

export const fonteDosLares = {
    texto: 'IBGE, Pesquisa Nacional de Saúde 2019',
    link: 'https://biblioteca.ibge.gov.br/visualizacao/livros/liv101748.pdf',
    porEstado: 'https://panoramapetvet.com.br/mapa-de-caes-e-gatos-revela-diferencas-regionais-no-mercado-pet-brasileiro/',
};

// O que o mapa pode mostrar. "doSite" vem da API; os outros, da tabela do IBGE acima
export const medidas = [
    { id: 'animaisDisponiveis', nome: 'Animais esperando', doSite: true, singular: 'animal esperando', plural: 'animais esperando' },
    { id: 'adocoes', nome: 'Adoções', doSite: true, singular: 'adoção', plural: 'adoções' },
    { id: 'abrigos', nome: 'Abrigos', doSite: true, singular: 'abrigo', plural: 'abrigos' },
    { id: 'cachorro', nome: 'Lares com cachorro', doSite: false, legenda: 'dos lares têm cachorro' },
    { id: 'gato', nome: 'Lares com gato', doSite: false, legenda: 'dos lares têm gato' },
];

// "12 animais esperando", "1 adoção", "64,8% dos lares têm cachorro"
export function descreverValor(medida, valor) {
    if (!medida.doSite) return `${porcentagem(valor)} ${medida.legenda}`;
    return `${valor.toLocaleString('pt-BR')} ${valor === 1 ? medida.singular : medida.plural}`;
}

// 64.8 vira "64,8%"
export function porcentagem(valor) {
    return `${valor.toLocaleString('pt-BR', { minimumFractionDigits: 1, maximumFractionDigits: 1 })}%`;
}

// Em qual dos 5 tons o estado fica. 0 é "nenhum ainda" (só nos números do site).
// Nos números do site a escala vai de zero até o maior; na porcentagem do IBGE, do menor estado ao maior,
// senão quase todos ficariam no mesmo tom
export function tomDoValor(valor, { minimo, maximo }) {
    if (valor <= 0 && minimo === 0) return 0;
    if (maximo <= minimo) return 5;
    const tom = Math.ceil(((valor - minimo) / (maximo - minimo)) * 5);
    return Math.min(5, Math.max(1, tom));
}

// Os valores de cada estado pra medida escolhida: { RO: 12, SP: 20, ... }
export function valoresDaMedida(medida, porEstado) {
    if (medida.doSite) {
        return Object.fromEntries(porEstado.map((linha) => [linha.estado, linha[medida.id]]));
    }
    return Object.fromEntries(Object.entries(laresComPet).map(([estado, lares]) => [estado, lares[medida.id]]));
}

// Os estados do maior pro menor (empate em ordem alfabética), sem os zerados
export function ranking(valores) {
    return Object.entries(valores)
        .filter(([, valor]) => valor > 0)
        .sort(([siglaA, a], [siglaB, b]) => b - a || siglaA.localeCompare(siglaB));
}
