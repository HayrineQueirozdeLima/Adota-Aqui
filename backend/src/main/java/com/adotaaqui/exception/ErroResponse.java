package com.adotaaqui.exception;

import org.springframework.http.HttpStatus;

import java.time.Instant;
import java.util.Map;

// Formato único de erro da API (docs/api.md, seção 4).
// Quem cria o erro escolhe só o status e a mensagem: o nome do erro sai daqui, sempre em português.
public record ErroResponse(
        int status,
        String erro,
        String mensagem,
        Map<String, String> campos,
        Instant timestamp) {

    public static ErroResponse de(HttpStatus status, String mensagem) {
        return de(status, mensagem, null);
    }

    public static ErroResponse de(HttpStatus status, String mensagem, Map<String, String> campos) {
        return new ErroResponse(status.value(), nomeDoErro(status), mensagem, campos, Instant.now());
    }

    // O que o front recebe no campo "erro". Apareceu um status novo? É só acrescentar aqui.
    static String nomeDoErro(HttpStatus status) {
        return switch (status) {
            case BAD_REQUEST -> "Requisição inválida";
            case UNAUTHORIZED -> "Não autorizado";
            case FORBIDDEN -> "Acesso negado";
            case NOT_FOUND -> "Não encontrado";
            case METHOD_NOT_ALLOWED -> "Método não permitido";
            case CONFLICT -> "Conflito";
            case UNSUPPORTED_MEDIA_TYPE -> "Formato não suportado";
            default -> status.is5xxServerError() ? "Erro interno" : status.getReasonPhrase();
        };
    }
}