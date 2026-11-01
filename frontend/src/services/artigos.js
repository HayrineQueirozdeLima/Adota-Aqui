import { requisicao } from './api';

// Blog para tutores (docs/api.md, seção 12): protetores escrevem, qualquer pessoa lê

// GET /api/artigos?categoria=SAUDE&pagina=1: dos mais novos pros mais antigos, em páginas de 12
export function listarArtigos({ categoria = '', pagina = 0 } = {}) {
    const parametros = new URLSearchParams();
    if (categoria) parametros.append('categoria', categoria);
    if (pagina > 0) parametros.append('pagina', pagina);
    const consulta = parametros.toString();
    return requisicao(`/api/artigos${consulta ? `?${consulta}` : ''}`);
}

// GET /api/artigos/{id}: o artigo inteiro. Com token, "ehMeu" diz se dá pra editar e apagar
export function buscarArtigo(id, token = null) {
    return requisicao(`/api/artigos/${encodeURIComponent(id)}`, { token });
}

// GET /api/artigos/meus: { podePublicar, artigos }
export function meusArtigos(token) {
    return requisicao('/api/artigos/meus', { token });
}

// POST /api/artigos: { titulo, conteudo, categoria, fotoCapa }
export function publicarArtigo(dados, token) {
    return requisicao('/api/artigos', { metodo: 'POST', corpo: dados, token });
}

// PUT /api/artigos/{id}: manda todos os campos de novo
export function editarArtigo(id, dados, token) {
    return requisicao(`/api/artigos/${encodeURIComponent(id)}`, { metodo: 'PUT', corpo: dados, token });
}

// DELETE /api/artigos/{id}
export function apagarArtigo(id, token) {
    return requisicao(`/api/artigos/${encodeURIComponent(id)}`, { metodo: 'DELETE', token });
}
