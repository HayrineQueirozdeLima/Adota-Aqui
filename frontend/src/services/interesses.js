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