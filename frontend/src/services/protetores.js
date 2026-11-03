import { requisicao } from './api';

// Página de abrigos e protetores (docs/api.md, seção 13): aberta pra qualquer pessoa

// Os filtros, com os mesmos nomes dos parâmetros do GET /api/protetores. Vazio quer dizer "qualquer um"
export const filtrosDeProtetorVazios = { busca: '', cidade: '', estado: '', tipo: '' };

// GET /api/protetores?tipo=ABRIGO&estado=RO&pagina=1: em ordem alfabética, de 12 em 12
// devolve { itens, pagina, tamanho, totalItens, totalPaginas }
export function listarProtetores(filtros = filtrosDeProtetorVazios, pagina = 0) {
    const parametros = new URLSearchParams();
    Object.entries(filtros).forEach(([nome, valor]) => {
        const texto = String(valor ?? '').trim();
        if (texto) parametros.append(nome, texto);
    });
    if (pagina > 0) parametros.append('pagina', pagina);
    const consulta = parametros.toString();
    return requisicao(`/api/protetores${consulta ? `?${consulta}` : ''}`);
}
