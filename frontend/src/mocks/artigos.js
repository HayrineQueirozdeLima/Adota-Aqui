// Exemplos do blog para tutores, usados nos testes e nos prints

const quatroPatas = { nome: 'Instituto Quatro Patas', tipo: 'ABRIGO', cidade: 'Santo André', estado: 'SP' };

export const artigoExemplo = {
    id: 'f1e2d3c4-0000-4000-8000-000000000001',
    titulo: 'Os primeiros dias do gato em casa',
    categoria: 'PRIMEIROS_DIAS',
    categoriaNome: 'Primeiros dias em casa',
    conteudo:
        'Deixe o gato começar por um cômodo só, com água, comida, caixa de areia e um esconderijo.\n\n'
        + 'Nos primeiros dias, ele pode se esconder e comer pouco. É normal: deixe ele vir até você, sem forçar o colo.\n\n'
        + 'Antes de liberar a casa toda, confira se as janelas estão teladas.',
    fotoCapa: null,
    autor: quatroPatas,
    publicadoEm: '2026-10-29T10:00:00',
    atualizadoEm: null,
    ehMeu: false,
};

export const artigosExemplo = [
    {
        id: artigoExemplo.id,
        titulo: artigoExemplo.titulo,
        categoria: artigoExemplo.categoria,
        categoriaNome: artigoExemplo.categoriaNome,
        resumo: 'Deixe o gato começar por um cômodo só, com água, comida, caixa de areia e um esconderijo. Nos primeiros dias, ele pode se esconder e comer pouco...',
        fotoCapa: null,
        autor: quatroPatas,
        publicadoEm: artigoExemplo.publicadoEm,
    },
    {
        id: 'f1e2d3c4-0000-4000-8000-000000000002',
        titulo: 'Vacinas e vermífugo no primeiro ano',
        categoria: 'SAUDE',
        categoriaNome: 'Saúde e vacinas',
        resumo: 'Filhote de cão toma a V10 em três doses, com intervalo de 21 a 30 dias. Leve a carteirinha que o protetor entregou na primeira consulta...',
        fotoCapa: null,
        autor: { nome: 'Maria Pinheiro', tipo: 'USUARIO', cidade: 'Porto Alegre', estado: 'RS' },
        publicadoEm: '2026-10-25T08:30:00',
    },
];
