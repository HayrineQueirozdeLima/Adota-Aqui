import { animaisExemplo, perfilExemplo } from "../../src/mocks/animais";
import { interesseExemplo } from "../../src/mocks/interesses";
import { racasExemplo } from "../../src/mocks/racas";

// "API de mentira" pros testes: troca o fetch do navegador por uma função que responde na hora,
// sem internet e sem back rodando. Assim o teste confere só o que é trabalho do front.

// Imita a resposta do fetch
export function resposta(status, corpo) {
    return {
        ok: status >= 200 && status < 300,
        status,
        json: async () => corpo,
        text: async () => JSON.stringify(corpo),
    };
}

// /api/racas devolve as raças de exemplo da espécie pedida.
// /api/animais devolve os animais de exemplo, ou o que "responderAnimais" decidir
// (recebe os parâmetros da busca e as opções do fetch, e devolve uma resposta).
// /api/animais/{id} devolve o perfil de exemplo, ou o que "responderAnimal" decidir
// (recebe o id e as opções do fetch)
// POST /api/animais/{id}/interesses devolve 201 com o interesse de exemplo, ou o que "responderInteresse"
// decidir (recebe o id do animal, o corpo enviado e as opções do fetch)
// DELETE /api/interesses/{id} devolve 204, ou o que "responderDesistencia" decidir
export function simularApi({
    responderAnimais,
    responderAnimal,
    responderInteresse,
    responderDesistencia,
} = {}) {
    global.fetch = jest.fn((url, opcoes = {}) => {
        const endereco = new URL(url);

        const novoInteresse = endereco.pathname.match(/^\/api\/animais\/([^/]+)\/interesses$/);
        if (novoInteresse) {
            const corpo = JSON.parse(opcoes.body);
            return Promise.resolve(
                responderInteresse
                    ? responderInteresse(novoInteresse[1], corpo, opcoes)
                    : resposta(201, interesseExemplo),
            );
        }

        const desistencia = endereco.pathname.match(/^\/api\/interesses\/([^/]+)$/);
        if (desistencia && opcoes.method === "DELETE") {
            return Promise.resolve(
                responderDesistencia ? responderDesistencia(desistencia[1], opcoes) : resposta(204, null),
            );
        }

        const perfil = endereco.pathname.match(/^\/api\/animais\/([^/]+)$/);
        if (perfil) {
            const id = decodeURIComponent(perfil[1]);
            return Promise.resolve(
                responderAnimal ? responderAnimal(id, opcoes) : resposta(200, { ...perfilExemplo, id }),
            );
        }
        if (endereco.pathname === "/api/racas") {
            const especie = endereco.searchParams.get("especie");
            return Promise.resolve(resposta(200, racasExemplo[especie] ?? []));
        }
        const parametros = Object.fromEntries(endereco.searchParams);
        const respostaAnimais = responderAnimais
            ? responderAnimais(parametros, opcoes)
            : resposta(200, animaisExemplo);
        return Promise.resolve(respostaAnimais);
    });
}

// Todas as buscas de animais feitas até agora, na ordem: [{ parametros, opcoes }]
export function buscasDeAnimais() {
    return fetch.mock.calls
        .filter(([url]) => new URL(url).pathname === "/api/animais")
        .map(([url, opcoes]) => ({
            parametros: Object.fromEntries(new URL(url).searchParams),
            opcoes,
        }));
}

export function ultimaBuscaDeAnimais() {
    return buscasDeAnimais().at(-1);
}