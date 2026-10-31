import { animaisExemplo, perfilExemplo } from "../../src/mocks/animais";
import { depoimentosExemplo } from "../../src/mocks/depoimentos";
import { dicaExemplo, dicasExemplo } from "../../src/mocks/dicas";
import { estatisticasExemplo } from "../../src/mocks/estatisticas";
import { interesseExemplo } from "../../src/mocks/interesses";
import { perfilAbrigoExemplo, perfilUsuarioExemplo } from "../../src/mocks/perfil";
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

// Monta uma página da API, como o GET /api/animais devolve: { itens, pagina, tamanho, totalItens, totalPaginas }
export function paginaDe(itens, { pagina = 0, tamanho = 12, totalItens = itens.length } = {}) {
    return { itens, pagina, tamanho, totalItens, totalPaginas: Math.ceil(totalItens / tamanho) };
}

// /api/racas devolve as raças de exemplo da espécie pedida.
// /api/animais devolve uma página com os animais de exemplo, ou o que "responderAnimais" decidir
// (recebe os parâmetros da busca e as opções do fetch, e devolve uma resposta).
// /api/animais/{id} devolve o perfil de exemplo, ou o que "responderAnimal" decidir
// (recebe o id e as opções do fetch)
// POST /api/animais/{id}/interesses devolve 201 com o interesse de exemplo, ou o que "responderInteresse"
// decidir (recebe o id do animal, o corpo enviado e as opções do fetch)
// DELETE /api/interesses/{id} devolve 204, ou o que "responderDesistencia" decidir
// "outras" atende qualquer outra rota: recebe (método, caminho, opções do fetch) e devolve
// uma resposta, ou undefined pra deixar as respostas padrão daqui de baixo cuidarem
// POST /api/fotos devolve 201 com uma URL nova a cada foto (fotos.teste/animais/1.jpg, 2.jpg...)
// GET /api/usuarios/me e /api/abrigos/me devolvem os perfis de exemplo (src/mocks/perfil.js)
// GET /api/estatisticas devolve os números de exemplo (src/mocks/estatisticas.js)
// GET /api/depoimentos devolve uma página com as histórias de exemplo (src/mocks/depoimentos.js)
// GET /api/dicas devolve uma página com as dicas de exemplo, /api/dicas/minhas diz que a conta não
// pode publicar e /api/dicas/{id} devolve a dica de exemplo (src/mocks/dicas.js)
export function simularApi({
    responderAnimais,
    responderAnimal,
    responderInteresse,
    responderDesistencia,
    outras,
} = {}) {
    let fotosEnviadas = 0;
    global.fetch = jest.fn((url, opcoes = {}) => {
        const endereco = new URL(url);
        const metodo = opcoes.method ?? "GET";

        const daOutra = outras?.(metodo, endereco.pathname, opcoes);
        if (daOutra) return Promise.resolve(daOutra);

        // vem antes do perfil: senão "meus" seria lido como o id de um animal
        if (endereco.pathname === "/api/animais/meus") {
            return Promise.resolve(resposta(200, []));
        }

        // painel do protetor e minhas candidaturas: por padrão, nenhum interesse
        if (endereco.pathname === "/api/interesses/recebidos" || endereco.pathname === "/api/interesses/meus") {
            return Promise.resolve(resposta(200, []));
        }

        // perfil da conta: por padrão, os exemplos de src/mocks/perfil.js
        if (endereco.pathname === "/api/usuarios/me" && metodo === "GET") {
            return Promise.resolve(resposta(200, perfilUsuarioExemplo));
        }
        if (endereco.pathname === "/api/abrigos/me" && metodo === "GET") {
            return Promise.resolve(resposta(200, perfilAbrigoExemplo));
        }

        if (endereco.pathname === "/api/dicas" && metodo === "GET") {
            return Promise.resolve(resposta(200, paginaDe(dicasExemplo)));
        }
        if (endereco.pathname === "/api/dicas/minhas") {
            return Promise.resolve(resposta(200, { podePublicar: false, dicas: [] }));
        }
        const dica = endereco.pathname.match(/^\/api\/dicas\/([^/]+)$/);
        if (dica && metodo === "GET") {
            return Promise.resolve(resposta(200, { ...dicaExemplo, id: decodeURIComponent(dica[1]) }));
        }

        if (endereco.pathname === "/api/depoimentos" && metodo === "GET") {
            return Promise.resolve(resposta(200, paginaDe(depoimentosExemplo)));
        }

        if (endereco.pathname === "/api/estatisticas") {
            return Promise.resolve(resposta(200, estatisticasExemplo));
        }

        if (endereco.pathname === "/api/fotos" && metodo === "POST") {
            fotosEnviadas += 1;
            return Promise.resolve(resposta(201, { url: `https://fotos.teste/animais/${fotosEnviadas}.jpg` }));
        }

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
            : resposta(200, paginaDe(animaisExemplo));
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