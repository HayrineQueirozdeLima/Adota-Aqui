// As perguntas da triagem (RF15), com os mesmos valores do back (enums do dicionário de domínios).
// A tela é montada a partir desta lista: pra mudar uma pergunta ou opção, mexe só aqui.

export const PREFIRO_RESPONDER = 'PREFIRO_RESPONDER_DIRETAMENTE_AO_PROTETOR';

const prefiroResponder = { valor: PREFIRO_RESPONDER, nome: 'Prefiro responder diretamente ao Protetor' };

export const partesDaTriagem = [
    {
        titulo: 'Parte 1: Moradia e família',
        perguntas: [
            {
                campo: 'moradia',
                legenda: 'Tipo de moradia',
                opcoes: [
                    { valor: 'CASA_COM_QUINTAL', nome: 'Casa com quintal' },
                    { valor: 'CASA_SEM_QUINTAL', nome: 'Casa sem quintal' },
                    { valor: 'APARTAMENTO_TELADO', nome: 'Apartamento com tela' },
                    { valor: 'APARTAMENTO_NAO_TELADO', nome: 'Apartamento sem tela' },
                    prefiroResponder,
                ],
            },
            {
                campo: 'criancas',
                legenda: 'Convivência com crianças',
                opcoes: [
                    { valor: 'SIM', nome: 'Há crianças em casa' },
                    { valor: 'NAO', nome: 'Não há crianças em casa' },
                    prefiroResponder,
                ],
            },
        ],
    },
    {
        titulo: 'Parte 2: Rotina',
        perguntas: [
            {
                campo: 'tempoSozinho',
                legenda: 'Tempo que o animal ficará sozinho',
                opcoes: [
                    { valor: 'O_ANIMAL_NAO_FICARA_SOZINHO_EM_CASA', nome: 'Não vai ficar sozinho' },
                    { valor: 'ATE_2_HORAS', nome: 'Até 2 horas' },
                    { valor: 'ATE_4_HORAS', nome: 'Até 4 horas' },
                    { valor: 'ATE_8_HORAS', nome: 'Até 8 horas' },
                    { valor: 'MAIS_DE_8_HORAS', nome: 'Mais de 8 horas' },
                    prefiroResponder,
                ],
            },
            {
                campo: 'outrosAnimais',
                legenda: 'Convivência com outros animais',
                opcoes: [
                    { valor: 'NAO_TENHO_OUTROS_ANIMAIS_EM_CASA', nome: 'Não tenho outros animais' },
                    { valor: 'SIM_CACHORROS', nome: 'Tenho cães' },
                    { valor: 'SIM_GATOS', nome: 'Tenho gatos' },
                    { valor: 'SIM_GATOS_E_CACHORROS', nome: 'Tenho cães e gatos' },
                    { valor: 'SIM_OUTRAS_ESPECIES', nome: 'Tenho outras espécies' },
                    prefiroResponder,
                ],
            },
            {
                campo: 'programacaoViagem',
                legenda: 'Quando viajar',
                opcoes: [
                    { valor: 'LEVO_O_ANIMAL_COMIGO', nome: 'Levo o animal comigo' },
                    { valor: 'DEIXO_NOS_CUIDADOS_DE_ALGUEM_DE_CONFIANCA', nome: 'Deixo com alguém de confiança' },
                    prefiroResponder,
                ],
            },
        ],
    },
    {
        titulo: 'Parte 3: Contato',
        explicacao:
            'Esta pergunta não tem a opção de responder depois: é por ela que o Protetor sabe quando falar com você.',
        perguntas: [
            {
                campo: 'momentoContato',
                legenda: 'Melhor momento para contato',
                opcoes: [
                    { valor: 'MANHA', nome: 'Manhã' },
                    { valor: 'TARDE', nome: 'Tarde' },
                    { valor: 'NOITE', nome: 'Noite' },
                    { valor: 'QUALQUER_HORARIO', nome: 'Qualquer horário' },
                ],
            },
        ],
    },
];

// Todos os campos da triagem, vazios: o formulário começa assim
export const triagemVazia = Object.fromEntries(
    partesDaTriagem.flatMap((parte) => parte.perguntas).map((pergunta) => [pergunta.campo, '']),
);

// Versão curta de cada resposta, pra triagem caber numa linha do painel do protetor
const respostasCurtas = {
    moradia: {
        CASA_COM_QUINTAL: 'casa com quintal',
        CASA_SEM_QUINTAL: 'casa sem quintal',
        APARTAMENTO_TELADO: 'apartamento com tela',
        APARTAMENTO_NAO_TELADO: 'apartamento sem tela',
    },
    criancas: { SIM: 'com crianças', NAO: 'sem crianças' },
    tempoSozinho: {
        O_ANIMAL_NAO_FICARA_SOZINHO_EM_CASA: 'nunca fica sozinho',
        ATE_2_HORAS: 'até 2h sozinho',
        ATE_4_HORAS: 'até 4h sozinho',
        ATE_8_HORAS: 'até 8h sozinho',
        MAIS_DE_8_HORAS: 'mais de 8h sozinho',
    },
    outrosAnimais: {
        NAO_TENHO_OUTROS_ANIMAIS_EM_CASA: 'sem outros animais',
        SIM_CACHORROS: 'tem cães',
        SIM_GATOS: 'tem gatos',
        SIM_GATOS_E_CACHORROS: 'tem cães e gatos',
        SIM_OUTRAS_ESPECIES: 'tem outras espécies',
    },
    programacaoViagem: {
        LEVO_O_ANIMAL_COMIGO: 'leva o animal nas viagens',
        DEIXO_NOS_CUIDADOS_DE_ALGUEM_DE_CONFIANCA: 'deixa com alguém nas viagens',
    },
};

// A triagem numa frase: "Casa com quintal, sem crianças, até 4h sozinho, tem gatos, leva o animal nas viagens".
// O que a pessoa preferiu responder na conversa sai da lista e vira um aviso no final.
// O melhor momento pra contato fica de fora: o painel mostra ele junto dos contatos
export function resumoDaTriagem(triagem) {
    const partes = [];
    let prefereConversar = false;

    Object.entries(respostasCurtas).forEach(([campo, textos]) => {
        const valor = triagem?.[campo];
        if (valor === PREFIRO_RESPONDER) prefereConversar = true;
        else if (textos[valor]) partes.push(textos[valor]);
    });
    if (prefereConversar) {
        partes.push(partes.length > 0 ? 'prefere falar do resto na conversa' : 'prefere responder na conversa');
    }

    const texto = partes.join(', ');
    return texto.charAt(0).toUpperCase() + texto.slice(1);
}

// As respostas da triagem como o protetor lê: [{ campo, pergunta, resposta }], na ordem das perguntas.
// "Prefiro responder diretamente ao Protetor" vira um aviso de que o assunto fica pra conversa
export function respostasDaTriagem(triagem) {
    return partesDaTriagem
        .flatMap((parte) => parte.perguntas)
        .map(({ campo, legenda, opcoes }) => {
            const valor = triagem?.[campo];
            const opcao = opcoes.find((item) => item.valor === valor);
            let resposta = opcao ? opcao.nome : 'Não informado';
            if (valor === PREFIRO_RESPONDER) resposta = 'Prefere responder na conversa';
            return { campo, pergunta: legenda, resposta };
        });
}
