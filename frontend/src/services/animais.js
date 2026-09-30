import { animaisExemplo } from '../mocks/animais';
import { racasExemplo } from '../mocks/racas';

// tudo que as telas pedem ao back sobre animais passa por aqui
// por enquanto as funções respondem com os dados de exemplo

// quando o GET /api/animais e o GET /api/racas estiverem no ar, só o corpo delas muda
//  as telas continuam iguais

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

export async function listarAnimais(filtros = filtrosVazios) {
    return animaisExemplo.filter((animal) => atendeAosFiltros(animal, filtros));
}

export async function listarRacas(especie) {
    return racasExemplo[especie] ?? [];
}

// Daqui pra baixo é só a imitação do que o back vai fazer
// Some junto com os dados de exemplo

// Filtro vazio aceita qualquer valor; filtro preenchido tem que ser igual
function combina(valorDoAnimal, filtro) {
    return !filtro || valorDoAnimal === filtro;
}

// Cidade basta conter o texto digitado, sem ligar pra maiúsculas 
function mesmaCidade(cidadeDoAnimal, textoDigitado) {
    const texto = textoDigitado.trim().toLowerCase();
    return !texto || cidadeDoAnimal.toLowerCase().includes(texto);
}

function atendeAosFiltros(animal, filtros) {
    return (
        animal.statusAdocao === 'DISPONIVEL' &&
        mesmaCidade(animal.protetor.cidade, filtros.cidade) &&
        combina(animal.especie, filtros.especie) &&
        combina(animal.raca, filtros.raca) &&
        combina(animal.sexo, filtros.sexo) &&
        combina(animal.porte, filtros.porte) &&
        combina(animal.energia, filtros.energia) &&
        combina(animal.convivencia.crianca, filtros.convivenciaCrianca) &&
        combina(animal.convivencia.cao, filtros.convivenciaCao) &&
        combina(animal.convivencia.gato, filtros.convivenciaGato)
    );
}