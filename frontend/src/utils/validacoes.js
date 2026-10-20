import { somenteNumeros } from './mascaras';

// Mesma conta do back (DocumentoUtils.java): confere os dois dígitos verificadores do CPF
export function cpfValido(cpf) {
    const d = somenteNumeros(cpf);
    // 11 dígitos iguais (111.111.111-11) passam na conta, mas não existem
    if (d.length !== 11 || /^(\d)\1+$/.test(d)) return false;

    const digito = (quantidade) => {
        let soma = 0;
        for (let i = 0; i < quantidade; i += 1) {
            soma += Number(d[i]) * (quantidade + 1 - i);
        }
        const resto = soma % 11;
        return resto < 2 ? 0 : 11 - resto;
    };

    return digito(9) === Number(d[9]) && digito(10) === Number(d[10]);
}

// Mesma conta do back pro CNPJ, que usa pesos fixos
export function cnpjValido(cnpj) {
    const d = somenteNumeros(cnpj);
    if (d.length !== 14 || /^(\d)\1+$/.test(d)) return false;

    const digito = (pesos) => {
        const soma = pesos.reduce((total, peso, i) => total + Number(d[i]) * peso, 0);
        const resto = soma % 11;
        return resto < 2 ? 0 : 11 - resto;
    };

    const primeiro = digito([5, 4, 3, 2, 9, 8, 7, 6, 5, 4, 3, 2]);
    const segundo = digito([6, 5, 4, 3, 2, 9, 8, 7, 6, 5, 4, 3, 2]);
    return primeiro === Number(d[12]) && segundo === Number(d[13]);
}

export function emailValido(email) {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim());
}

// Cada função devolve um objeto { campo: mensagem }. Objeto vazio = tudo certo.
// Os nomes dos campos são os mesmos da API, assim o erro que vem do back
// (no "campos" da resposta) aparece no mesmo lugar que o erro da validação daqui.

export function validarLogin({ documento, senha }) {
    const erros = {};
    const digitos = somenteNumeros(documento);
    if (!digitos) {
        erros.documento = 'Informe seu CPF ou CNPJ.';
    } else if (digitos.length !== 11 && digitos.length !== 14) {
        erros.documento = 'O CPF tem 11 dígitos e o CNPJ tem 14. Confira o número.';
    }
    if (!senha) erros.senha = 'Informe sua senha.';
    return erros;
}

export function validarCadastro(dados, tipo) {
    const erros = {};
    const vazio = (valor) => !String(valor ?? '').trim();

    if (tipo === 'ABRIGO') {
        if (!cnpjValido(dados.cnpj)) {
            erros.cnpj = vazio(dados.cnpj) ? 'Informe o CNPJ.' : 'CNPJ inválido. Confira os números.';
        }
        if (vazio(dados.razaoSocial)) erros.razaoSocial = 'Informe a razão social.';
        if (vazio(dados.nome)) erros.nome = 'Informe o nome da instituição.';
    } else {
        if (!cpfValido(dados.cpf)) {
            erros.cpf = vazio(dados.cpf) ? 'Informe o CPF.' : 'CPF inválido. Confira os números.';
        }
        if (vazio(dados.nome)) erros.nome = 'Informe seu nome.';
    }

    if (!emailValido(dados.email)) {
        erros.email = vazio(dados.email) ? 'Informe o e-mail.' : 'E-mail inválido. Confira o endereço.';
    }

    const telefone = somenteNumeros(dados.telefone);
    if (telefone.length < 10) {
        erros.telefone = telefone ? 'Informe DDD e número: 10 ou 11 dígitos.' : 'Informe o telefone com DDD.';
    }

    if (dados.senha.length < 8) {
        erros.senha = 'A senha precisa ter pelo menos 8 caracteres.';
    } else if (dados.senha.length > 72) {
        erros.senha = 'A senha pode ter no máximo 72 caracteres.';
    }
    if (!dados.confirmacaoSenha) {
        erros.confirmacaoSenha = 'Repita a senha.';
    } else if (dados.confirmacaoSenha !== dados.senha) {
        erros.confirmacaoSenha = 'As senhas não conferem.';
    }

    const { endereco } = dados;
    if (somenteNumeros(endereco.cep).length !== 8) erros['endereco.cep'] = 'Informe o CEP com 8 dígitos.';
    if (vazio(endereco.cidade)) erros['endereco.cidade'] = 'Informe a cidade.';
    if (!/^[A-Za-z]{2}$/.test(endereco.estado.trim())) {
        erros['endereco.estado'] = 'Use a sigla do estado, com 2 letras.';
    }
    if (vazio(endereco.numero)) erros['endereco.numero'] = 'Informe o número (ou "s/n").';

    return erros;
}