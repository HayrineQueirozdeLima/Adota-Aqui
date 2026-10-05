package com.adotaaqui.exception;

/**
 * A pessoa está logada, mas a regra de negócio não deixa ela fazer isso (HTTP 403).
 * Diferente do AccessDeniedException do Spring, a mensagem chega como está pra quem chamou a API,
 * pra tela explicar o motivo (ex.: "Só é possível demonstrar interesse em animais do seu estado").
 */
public class AcessoNegadoException extends RuntimeException {
    public AcessoNegadoException(String mensagem) {
        super(mensagem);
    }
}