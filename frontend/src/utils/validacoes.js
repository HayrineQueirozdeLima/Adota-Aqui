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

const vazio = (valor) => !String(valor ?? '').trim();

// Os pedaços que o cadastro e a edição do perfil conferem do mesmo jeito.
// Cada um acrescenta os erros que achar no objeto "erros", na ordem dos campos na tela

function conferirNome(dados, tipo, erros) {
    if (tipo === 'ABRIGO') {
        if (vazio(dados.razaoSocial)) erros.razaoSocial = 'Informe a razão social.';
        if (vazio(dados.nome)) erros.nome = 'Informe o nome da instituição.';
    } else if (vazio(dados.nome)) {
        erros.nome = 'Informe seu nome.';
    }
}

function conferirContato(dados, erros) {
    if (!emailValido(dados.email)) {
        erros.email = vazio(dados.email) ? 'Informe o e-mail.' : 'E-mail inválido. Confira o endereço.';
    }

    const telefone = somenteNumeros(dados.telefone);
    if (telefone.length < 10) {
        erros.telefone = telefone ? 'Informe DDD e número: 10 ou 11 dígitos.' : 'Informe o telefone com DDD.';
    }
}

function conferirEndereco({ endereco }, erros) {
    if (somenteNumeros(endereco.cep).length !== 8) erros['endereco.cep'] = 'Informe o CEP com 8 dígitos.';
    if (vazio(endereco.cidade)) erros['endereco.cidade'] = 'Informe a cidade.';
    if (!/^[A-Za-z]{2}$/.test(endereco.estado.trim())) {
        erros['endereco.estado'] = 'Use a sigla do estado, com 2 letras.';
    }
    if (vazio(endereco.numero)) erros['endereco.numero'] = 'Informe o número (ou "s/n").';
}

export function validarCadastro(dados, tipo) {
    const erros = {};

    if (tipo === 'ABRIGO') {
        if (!cnpjValido(dados.cnpj)) {
            erros.cnpj = vazio(dados.cnpj) ? 'Informe o CNPJ.' : 'CNPJ inválido. Confira os números.';
        }
    } else if (!cpfValido(dados.cpf)) {
        erros.cpf = vazio(dados.cpf) ? 'Informe o CPF.' : 'CPF inválido. Confira os números.';
    }
    conferirNome(dados, tipo, erros);
    conferirContato(dados, erros);

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

    conferirEndereco(dados, erros);
    return erros;
}

// Editar perfil (UC10): os mesmos campos do cadastro, menos o documento, que não muda, e a senha,
// que tem a conferência dela logo abaixo
export function validarPerfil(dados, tipo) {
    const erros = {};
    conferirNome(dados, tipo, erros);
    conferirContato(dados, erros);
    conferirEndereco(dados, erros);
    return erros;
}

// Trocar a senha é opcional: com os três campos vazios, não troca.
// Começou a preencher, os três passam a ser obrigatórios (UC10 FA01 e FA05)
export function validarTrocaDeSenha({ senhaAtual, novaSenha, confirmacaoNovaSenha }) {
    const erros = {};
    if (!senhaAtual && !novaSenha && !confirmacaoNovaSenha) return erros;

    if (!senhaAtual) erros.senhaAtual = 'Informe a senha atual.';
    if (!novaSenha) {
        erros.novaSenha = 'Informe a nova senha.';
    } else if (novaSenha.length < 8) {
        erros.novaSenha = 'A nova senha precisa ter pelo menos 8 caracteres.';
    } else if (novaSenha.length > 72) {
        erros.novaSenha = 'A senha pode ter no máximo 72 caracteres.';
    }
    if (!confirmacaoNovaSenha) {
        erros.confirmacaoNovaSenha = 'Repita a nova senha.';
    } else if (confirmacaoNovaSenha !== novaSenha) {
        erros.confirmacaoNovaSenha = 'As senhas não conferem.';
    }
    return erros;
}