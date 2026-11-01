// Exemplos do GET /api/depoimentos (o mural de histórias de adoção), usados nos testes e nos prints
export const depoimentosExemplo = [
    {
        id: 'd1a2b3c4-0000-4000-8000-000000000001',
        texto: 'A Mel chegou tímida e em uma semana já dormia no sofá. Hoje ela espera a gente no portão todo dia.',
        fotoUrl: null,
        dataHora: '2026-10-28T19:30:00',
        autor: 'Ana',
        estado: 'RO',
        animal: { nome: 'Mel', especie: 'CAO', fotoCapa: null },
        protetor: 'Instituto Quatro Patas',
    },
    {
        id: 'd1a2b3c4-0000-4000-8000-000000000002',
        texto: 'O Miau se deu bem com o nosso cachorro logo no primeiro dia. Obrigado ao abrigo pela paciência com as nossas perguntas.',
        fotoUrl: null,
        dataHora: '2026-10-20T10:00:00',
        autor: 'Bruno',
        estado: 'SP',
        animal: { nome: 'Miau', especie: 'GATO', fotoCapa: null },
        protetor: 'Maria Pinheiro',
    },
];
