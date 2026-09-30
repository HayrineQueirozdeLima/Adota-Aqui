package com.adotaaqui.security;

import com.adotaaqui.exception.ErroResponse;
import com.fasterxml.jackson.databind.ObjectMapper;
import jakarta.servlet.http.HttpServletResponse;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.stereotype.Component;

import java.io.IOException;
import java.nio.charset.StandardCharsets;

@Component
public class ErroSegurancaHandler {
    private final ObjectMapper objectMapper;

    public ErroSegurancaHandler(ObjectMapper objectMapper) {
        this.objectMapper = objectMapper;
    }

    public void escrever(HttpServletResponse response, HttpStatus status, String mensagem) throws IOException {
        response.setStatus(status.value());
        response.setContentType(MediaType.APPLICATION_JSON_VALUE);
        response.setCharacterEncoding(StandardCharsets.UTF_8.name());
        objectMapper.writeValue(response.getWriter(),
                ErroResponse.de(status.value(), nomeDoErro(status), mensagem));
    }

    // Mesmos nomes do GlobalExceptionHandler, pra todo erro da API vir em português
    private String nomeDoErro(HttpStatus status) {
        return switch (status) {
            case UNAUTHORIZED -> "Não autorizado";
            case FORBIDDEN -> "Acesso negado";
            default -> status.getReasonPhrase();
        };
    }
}
