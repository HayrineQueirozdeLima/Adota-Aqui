import { requisicao } from './api';

// Feiras de adoção (docs/api.md, seção 14): os abrigos divulgam, qualquer pessoa vê

// Os filtros, com os mesmos nomes dos parâmetros do GET /api/feiras. Vazio quer dizer "qualquer um"
export const filtrosDeFeiraVazios = { estado: '', cidade: '' };

// GET /api/feiras?estado=RO&cidade=porto&pagina=1: só as que ainda vão acontecer, da mais próxima
// pra mais distante. Devolve { itens, pagina, tamanho, totalItens, totalPaginas }
export function listarFeiras(filtros = filtrosDeFeiraVazios, pagina = 0, tamanho = 12) {
    const parametros = new URLSearchParams();
    Object.entries(filtros).forEach(([nome, valor]) => {
        const texto = String(valor ?? '').trim();
        if (texto) parametros.append(nome, texto);
    });
    if (pagina > 0) parametros.append('pagina', pagina);
    if (tamanho !== 12) parametros.append('tamanho', tamanho);
    const consulta = parametros.toString();
    return requisicao(`/api/feiras${consulta ? `?${consulta}` : ''}`);
}

// GET /api/feiras/{id}. Com token, "ehMinha" diz se dá pra editar e apagar
export function buscarFeira(id, token = null) {
    return requisicao(`/api/feiras/${encodeURIComponent(id)}`, { token });
}

// POST /api/feiras: só abrigo. { titulo, descricao, data, horaInicio, horaFim, local, endereco, cidade, estado }
export function divulgarFeira(dados, token) {
    return requisicao('/api/feiras', { metodo: 'POST', corpo: dados, token });
}

// PUT /api/feiras/{id}: manda todos os campos de novo
export function editarFeira(id, dados, token) {
    return requisicao(`/api/feiras/${encodeURIComponent(id)}`, { metodo: 'PUT', corpo: dados, token });
}

// DELETE /api/feiras/{id}
export function apagarFeira(id, token) {
    return requisicao(`/api/feiras/${encodeURIComponent(id)}`, { metodo: 'DELETE', token });
}
