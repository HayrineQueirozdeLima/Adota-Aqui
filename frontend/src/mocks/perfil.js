// Exemplos do GET /api/usuarios/me e do GET /api/abrigos/me (docs/api.md, seção 7), usados nos testes
// O documento vem só com os números, como a API devolve
export const perfilUsuarioExemplo = {
    id: 'u1',
    nome: 'Marina Prado',
    cpf: '52998224725',
    telefone: '69988771122',
    email: 'marina@example.com',
    endereco: {
        cep: '76801000',
        numero: '1040',
        logradouro: 'Avenida Sete de Setembro',
        bairro: 'Centro',
        cidade: 'Porto Velho',
        estado: 'RO',
    },
};

export const perfilAbrigoExemplo = {
    id: 'a1',
    nome: 'Instituto Quatro Patas',
    cnpj: '12345678000195',
    razaoSocial: 'Instituto Quatro Patas de Proteção Animal',
    telefone: '1132221111',
    email: 'contato@quatropatas.org',
    endereco: {
        cep: '09010000',
        numero: '200',
        logradouro: 'Rua das Flores',
        bairro: 'Centro',
        cidade: 'Santo André',
        estado: 'SP',
    },
};