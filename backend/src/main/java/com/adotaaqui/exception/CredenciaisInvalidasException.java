package com.adotaaqui.exception;

/**
 * Documento inexistente ou senha incorreta (HTTP 401). A mensagem é sempre genérica
 * para não revelar se o documento está cadastrado.
 */
public class CredenciaisInvalidasException extends RuntimeException {

    public CredenciaisInvalidasException() {
        super("Documento ou senha inválidos");
    }
}
