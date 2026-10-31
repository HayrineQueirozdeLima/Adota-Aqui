import { requisicao } from './api';

// Blog de dicas (docs/api.md, seção 12): protetores escrevem, qualquer pessoa lê

// GET /api/dicas?categoria=SAUDE&pagina=1: das mais novas pras mais antigas, em páginas de 12
export function listarDicas({ categoria = '', pagina = 0 } = {}) {
    const parametros = new URLSearchParams();
    if (categoria) parametros.append('categoria', categoria);
    if (pagina > 0) parametros.append('pagina', pagina);
    const consulta = parametros.toString();
    return requisicao(`/api/dicas${consulta ? `?${consulta}` : ''}`);
}

// GET /api/dicas/{id}: a dica inteira. Com token, "ehMinha" diz se dá pra editar e apagar
export function buscarDica(id, token = null) {
    return requisicao(`/api/dicas/${encodeURIComponent(id)}`, { token });
}

// GET /api/dicas/minhas: { podePublicar, dicas }
export function minhasDicas(token) {
    return requisicao('/api/dicas/minhas', { token });
}

// POST /api/dicas: { titulo, conteudo, categoria, fotoCapa }
export function publicarDica(dados, token) {
    return requisicao('/api/dicas', { metodo: 'POST', corpo: dados, token });
}

// PUT /api/dicas/{id}: manda todos os campos de novo
export function editarDica(id, dados, token) {
    return requisicao(`/api/dicas/${encodeURIComponent(id)}`, { metodo: 'PUT', corpo: dados, token });
}

// DELETE /api/dicas/{id}
export function apagarDica(id, token) {
    return requisicao(`/api/dicas/${encodeURIComponent(id)}`, { metodo: 'DELETE', token });
}
