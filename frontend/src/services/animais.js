import { requisicao } from './api';

// tudo que as telas pedem ao back sobre animais passa por aqui
// as telas não sabem o endereço da API nem o formato da URL: só chamam estas funções

// Os filtros da listagem, com os mesmos nomes dos parâmetros do GET /api/animais
// Vazio ('') basicamente quer dizer "qualquer um"
export const filtrosVazios = {
    cidade: '',
    especie: '',
    raca: '',
    sexo: '',
    porte: '',
    energia: '',
    convivenciaCrianca: '',
    convivenciaCao: '',
    convivenciaGato: '',
};

// GET /api/animais
// com o token de um Usuario, a própria API já devolve só os animais do estado dele (RF14)
export function listarAnimais(filtros = filtrosVazios, token = null) {
    return requisicao(`/api/animais${montarConsulta(filtros)}`, { token });
}

// GET /api/animais/{id}: o perfil completo de um animal
// com token, a resposta diz o que a pessoa logada pode fazer (ehMeu, podeDemonstrarInteresse, meuInteresse)
export function buscarAnimal(id, token = null) {
    return requisicao(`/api/animais/${encodeURIComponent(id)}`, { token });
}

// GET /api/racas?especie=GATO
export function listarRacas(especie) {
    return requisicao(`/api/racas${montarConsulta({ especie })}`);
}

// { especie: 'GATO', porte: '', cidade: ' porto ' } vira "?especie=GATO&cidade=porto"
// filtro vazio fica de fora: pra API, parâmetro que não veio quer dizer "qualquer um"
// o URLSearchParams cuida de acento e espaço ("são paulo" vira "s%C3%A3o+paulo")
function montarConsulta(filtros) {
    const parametros = new URLSearchParams();
    Object.entries(filtros).forEach(([nome, valor]) => {
        const texto = String(valor ?? '').trim();
        if (texto) parametros.append(nome, texto);
    });
    const consulta = parametros.toString();
    return consulta ? `?${consulta}` : '';
}