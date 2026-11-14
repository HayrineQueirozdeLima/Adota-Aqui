// Exemplo do GET /api/estatisticas, usado nos testes
export const estatisticasExemplo = {
    adocoes: 27,
    animaisDisponiveis: 43,
    abrigos: 12,
};

// Exemplo do GET /api/estatisticas/estados: os 27 estados, quase todos zerados, como num site que está começando
const comNumeros = {
    RO: { adocoes: 3, animaisDisponiveis: 12, abrigos: 2 },
    SP: { adocoes: 5, animaisDisponiveis: 20, abrigos: 4 },
    RS: { adocoes: 1, animaisDisponiveis: 6, abrigos: 1 },
};
export const estatisticasPorEstadoExemplo = [
    'AC', 'AL', 'AM', 'AP', 'BA', 'CE', 'DF', 'ES', 'GO', 'MA', 'MG', 'MS', 'MT', 'PA',
    'PB', 'PE', 'PI', 'PR', 'RJ', 'RN', 'RO', 'RR', 'RS', 'SC', 'SE', 'SP', 'TO',
].map((estado) => ({ estado, adocoes: 0, animaisDisponiveis: 0, abrigos: 0, ...comNumeros[estado] }));
