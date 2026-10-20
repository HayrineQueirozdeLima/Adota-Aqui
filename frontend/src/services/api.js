import { URL_API } from '../config/ambiente';

// Erro que as telas recebem quando a chamada não dá certo.
// status 0 quer dizer que nem chegou na API (sem internet ou servidor fora do ar).
export class ErroApi extends Error {
    constructor(status, mensagem, campos) {
        super(mensagem);
        this.status = status;
        this.campos = campos ?? {};
    }
}

// Todas as chamadas à API passam por aqui (monta o endereço, manda o token quando tem
// e transforma a resposta de erro (docs/api.md, seção 4) num ErroApi)
export async function requisicao(caminho, { metodo = 'GET', corpo, token } = {}) {
    // Arquivo (FormData) vai como está, e o navegador monta o Content-Type sozinho, com o "boundary"
    // que separa as partes. O resto vai como JSON
    const ehArquivo = corpo instanceof FormData;
    const cabecalhos = {};
    if (corpo !== undefined && !ehArquivo) cabecalhos['Content-Type'] = 'application/json';
    if (token) cabecalhos.Authorization = `Bearer ${token}`;

    let corpoDaRequisicao;
    if (ehArquivo) corpoDaRequisicao = corpo;
    else if (corpo !== undefined) corpoDaRequisicao = JSON.stringify(corpo);

    let resposta;
    try {
        resposta = await fetch(`${URL_API}${caminho}`, {
            method: metodo,
            headers: cabecalhos,
            body: corpoDaRequisicao,
        });
    } catch {
        throw new ErroApi(
            0,
            'Não foi possível falar com o servidor. Confira sua conexão e tente de novo em alguns segundos.',
        );
    }

    const dados = await lerJson(resposta);
    if (!resposta.ok) {
        throw new ErroApi(
            resposta.status,
            dados?.mensagem ?? 'Algo deu errado do lado do servidor. Tente de novo em instantes.',
            dados?.campos,
        );
    }
    return dados;
}

// Nem toda resposta tem JSON
//  204 vem vazia, e um erro do servidor pode vir em HTML
async function lerJson(resposta) {
    const texto = await resposta.text();
    try {
        return texto ? JSON.parse(texto) : null;
    } catch {
        return null;
    }
}