import { requisicao } from './api';

// Login e cadastro (docs/api.md, seção 6). As três respostas têm o mesmo formato:
// { token, tipoConta, id, nome, expiraEm }

export function autenticar(documento, senha) {
    return requisicao('/api/auth/login', { metodo: 'POST', corpo: { documento, senha } });
}

export function cadastrarUsuario(dados) {
    return requisicao('/api/usuarios', { metodo: 'POST', corpo: dados });
}

export function cadastrarAbrigo(dados) {
    return requisicao('/api/abrigos', { metodo: 'POST', corpo: dados });
}