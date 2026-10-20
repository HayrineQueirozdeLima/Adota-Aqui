// Só os números: "123.456.789-09" vira "12345678909". A API recebe sempre assim.
export function somenteNumeros(texto = '') {
    return texto.replace(/\D/g, '');
}

// Encaixa os dígitos num molde, onde cada "#" é um dígito.
// Para quando os dígitos acabam, pra não sobrar ponto ou traço solto no fim.
function aplicarMolde(digitos, molde) {
    let resultado = '';
    let posicao = 0;
    for (const caractere of molde) {
        if (posicao >= digitos.length) break;
        if (caractere === '#') {
            resultado += digitos[posicao];
            posicao += 1;
        } else {
            resultado += caractere;
        }
    }
    return resultado;
}

export function mascaraCpf(texto) {
    return aplicarMolde(somenteNumeros(texto).slice(0, 11), '###.###.###-##');
}

export function mascaraCnpj(texto) {
    return aplicarMolde(somenteNumeros(texto).slice(0, 14), '##.###.###/####-##');
}

// No login o mesmo campo aceita os dois: até 11 dígitos é CPF, passou disso é CNPJ
export function mascaraDocumento(texto) {
    const digitos = somenteNumeros(texto);
    return digitos.length <= 11 ? mascaraCpf(digitos) : mascaraCnpj(digitos);
}

// Fixo tem 10 dígitos e celular tem 11: o molde muda quando entra o 11º
export function mascaraTelefone(texto) {
    const digitos = somenteNumeros(texto).slice(0, 11);
    return aplicarMolde(digitos, digitos.length > 10 ? '(##) #####-####' : '(##) ####-####');
}

export function mascaraCep(texto) {
    return aplicarMolde(somenteNumeros(texto).slice(0, 8), '#####-###');
}