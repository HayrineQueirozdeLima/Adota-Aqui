package com.adotaaqui.exception;

/**
 * A mesma conta (ou o mesmo endereço, pra visitante) pediu muitas vezes num intervalo curto (HTTP 429).
 * Protege a cota gratuita da IA de cliques repetidos e de robôs.
 */
public class LimiteDeUsoException extends RuntimeException {
    public LimiteDeUsoException(String mensagem) {
        super(mensagem);
    }
}
