package com.adotaaqui.exception;

/**
 * Documento que não é um CPF (11 dígitos) nem um CNPJ (14 dígitos) válido (HTTP 400).
 */
public class DocumentoInvalidoException extends RuntimeException {

    public DocumentoInvalidoException(String mensagem) {
        super(mensagem);
    }
}
