// Exemplo da resposta do POST /api/animais/{id}/interesses (docs/api.md, seção 9), usado nos testes.
// Pro candidato, o interesse vem com o contatoProtetor (RF09)
export const interesseExemplo = {
    id: 'c4d5e6f7-a8b9-4c0d-9e1f-2a3b4c5d6e7f',
    dataHora: '2026-10-04T14:30:00',
    statusAndamento: 'PENDENTE',
    motivoDescontinuacao: null,
    animal: { id: '9b2e4f10-1c3d-4a5b-8e7f-6a5b4c3d2e1f', nome: 'Mel', fotoCapa: null },
    triagem: {
        moradia: 'CASA_COM_QUINTAL',
        criancas: 'NAO',
        tempoSozinho: 'ATE_4_HORAS',
        outrosAnimais: 'PREFIRO_RESPONDER_DIRETAMENTE_AO_PROTETOR',
        programacaoViagem: 'DEIXO_NOS_CUIDADOS_DE_ALGUEM_DE_CONFIANCA',
        momentoContato: 'NOITE',
    },
    contatoProtetor: { nome: 'Marina Prado', telefone: '69999998888', email: 'marina@example.com' },
};

// Exemplo do GET /api/interesses/recebidos (painel do protetor), usado nos testes.
// Dois animais (Mel e Tobias) e um interesse em cada status. Pro protetor, vem o "candidato"
const mel = { id: '9b2e4f10-1c3d-4a5b-8e7f-6a5b4c3d2e1f', nome: 'Mel', fotoCapa: null };
const tobias = { id: '2c7d9e11-4f5a-4b6c-9d8e-1f2a3b4c5d6e', nome: 'Tobias', fotoCapa: null };

export const interessesRecebidosExemplo = [
    {
        id: 'r1',
        dataHora: '2026-10-06T09:15:00',
        statusAndamento: 'PENDENTE',
        motivoDescontinuacao: null,
        animal: mel,
        triagem: { ...interesseExemplo.triagem },
        candidato: { nome: 'Ana Souza', telefone: '69988887777', email: 'ana@example.com' },
    },
    {
        id: 'r2',
        dataHora: '2026-10-05T18:40:00',
        statusAndamento: 'EM_CONTATO',
        motivoDescontinuacao: null,
        animal: mel,
        triagem: {
            moradia: 'APARTAMENTO_TELADO',
            criancas: 'SIM',
            tempoSozinho: 'ATE_8_HORAS',
            outrosAnimais: 'SIM_GATOS',
            programacaoViagem: 'LEVO_O_ANIMAL_COMIGO',
            momentoContato: 'MANHA',
        },
        candidato: { nome: 'Bruno Lima', telefone: '69977776666', email: 'bruno@example.com' },
    },
    {
        id: 'r3',
        dataHora: '2026-10-02T11:00:00',
        statusAndamento: 'APROVADO',
        motivoDescontinuacao: null,
        animal: tobias,
        triagem: { ...interesseExemplo.triagem },
        candidato: { nome: 'Carla Dias', telefone: '69966665555', email: 'carla@example.com' },
    },
    {
        id: 'r4',
        dataHora: '2026-10-01T15:20:00',
        statusAndamento: 'DESCONTINUADO',
        motivoDescontinuacao: 'Outro candidato foi aprovado para este animal.',
        animal: tobias,
        triagem: { ...interesseExemplo.triagem },
        candidato: { nome: 'Davi Rocha', telefone: '69955554444', email: 'davi@example.com' },
    },
];

