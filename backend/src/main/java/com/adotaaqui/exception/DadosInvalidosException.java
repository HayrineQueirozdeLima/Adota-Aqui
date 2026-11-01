package com.adotaaqui.exception;

public class DadosInvalidosException extends RuntimeException {
    // Quando o erro é de um campo só, o front mostra a mensagem embaixo dele (ex.: senhaAtual)
    private final String campo;

    public DadosInvalidosException(String mensagem) {
        this(mensagem, null);
    }

    public DadosInvalidosException(String mensagem, String campo) {
        super(mensagem);
        this.campo = campo;
    }

    public String getCampo() {
        return campo;
    }
}