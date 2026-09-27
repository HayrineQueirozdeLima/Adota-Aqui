// Traduz os valores da API (os enums) para o texto que aparece na tela.
// Os valores são os do dicionário de domínios.

export const especies = { CAO: 'Cão', GATO: 'Gato' };

export const portes = { PEQUENO: 'Pequeno', MEDIO: 'Médio', GRANDE: 'Grande' };

export const sexos = { FEMEA: 'Fêmea', MACHO: 'Macho' };

export const convivencias = {
    CONVIVE_BEM: 'convive bem',
    NAO_CONVIVE_BEM: 'não convive bem',
    NAO_TESTADO: 'não testado',
};

export const corDaConvivencia = {
    CONVIVE_BEM: 'disponivel',
    NAO_CONVIVE_BEM: 'atencao',
    NAO_TESTADO: 'destaque_roxo',
};

// Algumas palavras mudam conforme o sexo do animal: 
// "Castrada" / "Castrado", "Mais animada" / "Mais animado", 
// por isso essas duas são funções
function finalPorSexo(sexo) {
    return sexo === 'FEMEA' ? 'a' : 'o';
}

export function rotuloCastrado(sexo) {
    return `Castrad${finalPorSexo(sexo)}`;
}

export function rotuloEnergia(energia, sexo) {
    const palavra = energia === 'MAIS_ANIMADO' ? 'animad' : 'calm';
    return `Mais ${palavra}${finalPorSexo(sexo)}`;
}

// "Instituto Quatro Patas" vira "IQ": as iniciais das duas primeiras palavras
export function iniciais(nome) {
    return nome
        .split(' ')
        .slice(0, 2)
        .map((palavra) => palavra[0].toUpperCase())
        .join('');
}