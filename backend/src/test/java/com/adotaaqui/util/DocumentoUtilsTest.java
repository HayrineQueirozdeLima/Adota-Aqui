package com.adotaaqui.util;

import org.junit.jupiter.api.Test;
import org.junit.jupiter.params.ParameterizedTest;
import org.junit.jupiter.params.provider.NullAndEmptySource;
import org.junit.jupiter.params.provider.ValueSource;

import static org.assertj.core.api.Assertions.assertThat;

// Validação de CPF e CNPJ (RF01, RF02 e RF03). É a mesma conta do front (utils/validacoes.js):
// os dois lados precisam aceitar e recusar os mesmos documentos
class DocumentoUtilsTest {

    @Test
    void normalizarTiraAMascaraEDeixaSoOsNumeros() {
        assertThat(DocumentoUtils.normalizar("123.456.789-09")).isEqualTo("12345678909");
        assertThat(DocumentoUtils.normalizar("12.345.678/0001-95")).isEqualTo("12345678000195");
        assertThat(DocumentoUtils.normalizar(null)).isEmpty();
    }

    @ParameterizedTest
    @ValueSource(strings = {"12345678909", "529.982.247-25", "111.444.777-35"})
    void aceitaCpfComDigitosVerificadoresCertos(String cpf) {
        assertThat(DocumentoUtils.isCpfValido(cpf)).isTrue();
    }

    @ParameterizedTest
    @NullAndEmptySource
    @ValueSource(strings = {
            "12345678901",   // dígito verificador errado
            "11111111111",   // todos os números iguais passam na conta, mas não são CPF
            "1234567890",    // 10 dígitos
            "123456789012",  // 12 dígitos
            "abc.def.ghi-jk" // sem nenhum número
    })
    void recusaCpfInvalido(String cpf) {
        assertThat(DocumentoUtils.isCpfValido(cpf)).isFalse();
    }

    @ParameterizedTest
    @ValueSource(strings = {"12345678000195", "11.222.333/0001-81"})
    void aceitaCnpjComDigitosVerificadoresCertos(String cnpj) {
        assertThat(DocumentoUtils.isCnpjValido(cnpj)).isTrue();
    }

    @ParameterizedTest
    @NullAndEmptySource
    @ValueSource(strings = {
            "12345678000199",  // dígito verificador errado
            "11111111111111",  // todos os números iguais
            "1234567800019",   // 13 dígitos
            "12345678909"      // um CPF não vale como CNPJ
    })
    void recusaCnpjInvalido(String cnpj) {
        assertThat(DocumentoUtils.isCnpjValido(cnpj)).isFalse();
    }
}
