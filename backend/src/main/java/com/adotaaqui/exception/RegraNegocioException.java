package com.adotaaqui.exception;

/**
 * Violação de regra de negócio, como CPF/CNPJ ou e-mail já cadastrado (HTTP 409).
 */
public class RegraNegocioException extends RuntimeException {

    public RegraNegocioException(String mensagem) {
        super(mensagem);
    }
}
