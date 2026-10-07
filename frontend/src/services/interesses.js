import { requisicao } from './api';

// Chamadas da API sobre interesses (docs/api.md, seção 9)

// POST /api/animais/{id}/interesses: o Usuario logado demonstra interesse (RF08, RF13, RF15)
// a resposta traz o contatoProtetor (RF09)
export function demonstrarInteresse(animalId, { aceiteTermo, triagem }, token) {
    return requisicao(`/api/animais/${encodeURIComponent(animalId)}/interesses`, {
        metodo: 'POST',
        corpo: { aceiteTermo, triagem },
        token,
    });
}

// DELETE /api/interesses/{id}: o candidato desiste (UC07 FA01). Responde 204, sem corpo
export function desistirDoInteresse(interesseId, token) {
    return requisicao(`/api/interesses/${encodeURIComponent(interesseId)}`, {
        metodo: 'DELETE',
        token,
    });
}

// GET /api/interesses/recebidos: o painel do protetor, com os interesses de todos os animais da conta.
// Cada item vem com o "candidato" (nome, telefone e e-mail de quem demonstrou interesse)
export function listarInteressesRecebidos(token) {
    return requisicao('/api/interesses/recebidos', { token });
}

// PATCH /api/interesses/{id}/status: o protetor muda o andamento (RF10, UC08).
// Aprovar adota o animal e descontinua os outros interesses dele na mesma operação.
// O motivo só é obrigatório (e só é enviado) ao descontinuar
export function atualizarStatusInteresse(interesseId, statusAndamento, motivoDescontinuacao, token) {
    const corpo = { statusAndamento };
    if (statusAndamento === 'DESCONTINUADO') corpo.motivoDescontinuacao = motivoDescontinuacao;
    return requisicao(`/api/interesses/${encodeURIComponent(interesseId)}/status`, {
        metodo: 'PATCH',
        corpo,
        token,
    });
}
