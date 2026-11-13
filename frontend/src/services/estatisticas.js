import { requisicao } from './api';

// GET /api/estatisticas: os números da Home, abertos pra qualquer pessoa
// devolve { adocoes, animaisDisponiveis, abrigos }
export function buscarEstatisticas() {
    return requisicao('/api/estatisticas');
}

// GET /api/estatisticas/estados: os mesmos números, estado por estado, pro observatório.
// Vêm sempre os 27, na ordem das siglas: [{ estado, adocoes, animaisDisponiveis, abrigos }]
export function buscarEstatisticasPorEstado() {
    return requisicao('/api/estatisticas/estados');
}
