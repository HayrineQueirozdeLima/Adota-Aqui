import { requisicao } from './api';

// Perfil da conta logada (docs/api.md, seção 7). A API sabe a conta pelo token:
// pessoa física usa /api/usuarios/me e abrigo usa /api/abrigos/me
function rotaDoPerfil(tipoConta) {
    return tipoConta === 'ABRIGO' ? '/api/abrigos/me' : '/api/usuarios/me';
}

export function buscarPerfil(tipoConta, token) {
    return requisicao(rotaDoPerfil(tipoConta), { token });
}

// PUT: vão todos os campos editáveis, mesmo os que não mudaram. CPF e CNPJ não vão, porque não mudam
export function atualizarPerfil(tipoConta, dados, token) {
    return requisicao(rotaDoPerfil(tipoConta), { metodo: 'PUT', corpo: dados, token });
}

// PATCH .../senha responde 204. A senha atual errada volta como 400 (e não 401), então a pessoa continua logada
export function alterarSenha(tipoConta, { senhaAtual, novaSenha, confirmacaoNovaSenha }, token) {
    return requisicao(`${rotaDoPerfil(tipoConta)}/senha`, {
        metodo: 'PATCH',
        corpo: { senhaAtual, novaSenha, confirmacaoNovaSenha },
        token,
    });
}