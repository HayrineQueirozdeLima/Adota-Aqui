package com.adotaaqui.exception;

import java.time.Instant;
import java.util.Map;

public record ErroResponse(
        int status,
        String erro,
        String mensagem,
        Map<String, String> campos,
        Instant timestamp) {

    public static ErroResponse de(int status, String erro, String mensagem) {
        return new ErroResponse(status, erro, mensagem, null, Instant.now());
    }

    public static ErroResponse de(int status, String erro, String mensagem, Map<String, String> campos) {
        return new ErroResponse(status, erro, mensagem, campos, Instant.now());
    }
}
