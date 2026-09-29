package com.adotaaqui.util;

public final class DocumentoUtils {

    public static final int TAMANHO_CPF = 11;
    public static final int TAMANHO_CNPJ = 14;

    private DocumentoUtils() {
    }

    /**
     * Remove tudo que não for dígito, permitindo que o documento chegue com ou sem máscara.
     */
    public static String normalizar(String documento) {
        if (documento == null) {
            return "";
        }
        return documento.replaceAll("\\D", "");
    }

    public static boolean isCpfValido(String documento) {
        String digitos = normalizar(documento);
        if (digitos.length() != TAMANHO_CPF || todosDigitosIguais(digitos)) {
            return false;
        }
        int primeiro = calcularDigitoCpf(digitos, 9, 10);
        int segundo = calcularDigitoCpf(digitos, 10, 11);
        return primeiro == charToInt(digitos, 9) && segundo == charToInt(digitos, 10);
    }

    public static boolean isCnpjValido(String documento) {
        String digitos = normalizar(documento);
        if (digitos.length() != TAMANHO_CNPJ || todosDigitosIguais(digitos)) {
            return false;
        }
        int[] pesosPrimeiro = {5, 4, 3, 2, 9, 8, 7, 6, 5, 4, 3, 2};
        int[] pesosSegundo = {6, 5, 4, 3, 2, 9, 8, 7, 6, 5, 4, 3, 2};
        int primeiro = calcularDigitoCnpj(digitos, pesosPrimeiro);
        int segundo = calcularDigitoCnpj(digitos, pesosSegundo);
        return primeiro == charToInt(digitos, 12) && segundo == charToInt(digitos, 13);
    }

    private static int calcularDigitoCpf(String digitos, int quantidade, int pesoInicial) {
        int soma = 0;
        int peso = pesoInicial;
        for (int i = 0; i < quantidade; i++) {
            soma += charToInt(digitos, i) * peso;
            peso--;
        }
        int resto = soma % 11;
        return resto < 2 ? 0 : 11 - resto;
    }

    private static int calcularDigitoCnpj(String digitos, int[] pesos) {
        int soma = 0;
        for (int i = 0; i < pesos.length; i++) {
            soma += charToInt(digitos, i) * pesos[i];
        }
        int resto = soma % 11;
        return resto < 2 ? 0 : 11 - resto;
    }

    private static boolean todosDigitosIguais(String digitos) {
        return digitos.chars().distinct().count() == 1;
    }

    private static int charToInt(String digitos, int indice) {
        return Character.getNumericValue(digitos.charAt(indice));
    }
}
