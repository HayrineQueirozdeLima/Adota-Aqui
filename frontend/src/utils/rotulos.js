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
    NAO_TESTADO: 'destaqueRoxo',
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

// "a Mel", "o Bento": o artigo que acompanha o nome do animal nas frases
export function artigoDefinido(sexo) {
    return finalPorSexo(sexo);
}

// Como cada status de interesse aparece pra quem demonstrou o interesse
export const statusDoInteresse = {
    PENDENTE: 'Aguardando o Protetor',
    EM_CONTATO: 'Em contato',
    APROVADO: 'Aprovado',
    DESCONTINUADO: 'Descontinuado',
};

// "2026-03-12" (formato da API) vira "12/03/2026".
// Separa o texto em vez de usar new Date(), que pode mudar o dia por causa do fuso horário
export function formatarData(dataDaApi) {
    if (!dataDaApi) return '';
    const [ano, mes, dia] = dataDaApi.split('-');
    return `${dia}/${mes}/${ano}`;
}

// Idade a partir da data de nascimento estimada: "8 meses", "2 anos"
export function idadeEstimada(dataNascimento, hoje = new Date()) {
    if (!dataNascimento) return null;
    const [ano, mes, dia] = dataNascimento.split('-').map(Number);
    let meses = (hoje.getFullYear() - ano) * 12 + (hoje.getMonth() + 1 - mes);
    if (hoje.getDate() < dia) meses -= 1;

    if (meses < 1) return 'Menos de 1 mês';
    if (meses < 12) return `${meses} ${meses === 1 ? 'mês' : 'meses'}`;
    const anos = Math.floor(meses / 12);
    return `${anos} ${anos === 1 ? 'ano' : 'anos'}`;
}

// "Cão, sem raça definida, porte médio, 14 kg". Sem peso, a parte do peso some
export function resumoDoAnimal({ especie, racaNome, porte, peso }) {
    return [
        especies[especie],
        racaNome?.toLowerCase(),
        portes[porte] && `porte ${portes[porte].toLowerCase()}`,
        peso && `${peso.toLocaleString('pt-BR')} kg`,
    ]
        .filter(Boolean)
        .join(', ');
}

// "2ª dose, aplicada em 12/03/2026". Funciona também com só a dose ou só a data
export function descricaoDaVacina({ dose, dataAplicacao }) {
    const texto = [dose && `${dose}ª dose`, dataAplicacao && `aplicada em ${formatarData(dataAplicacao)}`]
        .filter(Boolean)
        .join(', ');
    return texto.charAt(0).toUpperCase() + texto.slice(1);
}
