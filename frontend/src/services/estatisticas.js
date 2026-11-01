import { requisicao } from './api';

// GET /api/estatisticas: os números da Home, abertos pra qualquer pessoa
// devolve { adocoes, animaisDisponiveis, abrigos }
export function buscarEstatisticas() {
    return requisicao('/api/estatisticas');
}
