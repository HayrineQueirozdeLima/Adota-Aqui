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
