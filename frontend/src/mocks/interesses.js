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