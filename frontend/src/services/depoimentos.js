import { requisicao } from './api';

// Depoimentos e mural de histórias de adoção (docs/api.md, seção 11)

// GET /api/depoimentos: o mural, aberto pra qualquer pessoa, das histórias mais novas pras mais antigas.
// Vem em páginas: { itens, pagina, tamanho, totalItens, totalPaginas }
export function listarDepoimentos(pagina = 0, tamanho) {
    const parametros = new URLSearchParams();
    if (pagina > 0) parametros.append('pagina', pagina);
    if (tamanho) parametros.append('tamanho', tamanho);
    const consulta = parametros.toString();
    return requisicao(`/api/depoimentos${consulta ? `?${consulta}` : ''}`);
}

// POST /api/interesses/{id}/depoimento: quem adotou conta como foi (RF11, UC09)
// dados = { texto, fotoUrl, autorizaPublicacao }
export function escreverDepoimento(interesseId, dados, token) {
    return requisicao(`/api/interesses/${encodeURIComponent(interesseId)}/depoimento`, {
        metodo: 'POST',
        corpo: dados,
        token,
    });
}

// DELETE /api/depoimentos/{id}: só quem escreveu pode tirar do mural
export function apagarDepoimento(id, token) {
    return requisicao(`/api/depoimentos/${encodeURIComponent(id)}`, { metodo: 'DELETE', token });
}
