// Exemplos do GET /api/feiras (docs/api.md, seção 14), usados nos testes.
// As datas ficam bem no futuro, pra feira continuar "próxima" em qualquer dia que o teste rodar
export const feirasExemplo = [
    {
        id: 'f1',
        titulo: 'Feira de adoção do Parque da Cidade',
        descricao: 'Cães e gatos castrados, vacinados e vermifugados. Traga um documento com foto.',
        data: '2030-03-16',
        horaInicio: '09:00:00',
        horaFim: '13:00:00',
        local: 'Parque da Cidade',
        endereco: 'Avenida Jorge Teixeira, 1000, Embratel',
        cidade: 'Porto Velho',
        estado: 'RO',
        abrigo: { nome: 'Instituto Quatro Patas', cidade: 'Santo André', estado: 'SP' },
        ehMinha: false,
    },
    {
        id: 'f2',
        titulo: 'Feirinha de gatos',
        descricao: null,
        data: '2030-03-23',
        horaInicio: '14:30:00',
        horaFim: '18:00:00',
        local: 'Pet Shop Amigo Fiel',
        endereco: 'Rua das Flores, 200, Centro',
        cidade: 'Santo André',
        estado: 'SP',
        abrigo: { nome: 'Instituto Quatro Patas', cidade: 'Santo André', estado: 'SP' },
        ehMinha: false,
    },
];
