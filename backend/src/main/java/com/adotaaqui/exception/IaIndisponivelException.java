package com.adotaaqui.exception;

/**
 * A IA não está ligada (sem chave no servidor) ou não respondeu direito (HTTP 503).
 * A tela mostra a mensagem e o resto do site continua funcionando.
 */
public class IaIndisponivelException extends RuntimeException {
    public IaIndisponivelException() {
        super("A ajuda com IA não está disponível agora. Tente de novo em instantes.");
    }

    public IaIndisponivelException(String mensagem) {
        super(mensagem);
    }
}
