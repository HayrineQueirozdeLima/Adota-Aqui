package com.adotaaqui.exception;

import org.junit.jupiter.api.Test;
import org.springframework.dao.DataIntegrityViolationException;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;

import java.sql.SQLException;

import static org.assertj.core.api.Assertions.assertThat;

// Issue #40: o que a API responde quando o banco recusa uma gravação
class GlobalExceptionHandlerTest {
    private final GlobalExceptionHandler handler = new GlobalExceptionHandler();

    // Duas contas iguais ao mesmo tempo: a segunda bate no índice único (código 23505) e vira 409
    @Test
    void valorRepetidoNoBancoViraConflito() {
        var erro = new DataIntegrityViolationException("valor repetido",
                new RuntimeException("erro do Hibernate", new SQLException("duplicate key", "23505")));

        ResponseEntity<ErroResponse> resposta = handler.tratarViolacaoNoBanco(erro);

        assertThat(resposta.getStatusCode()).isEqualTo(HttpStatus.CONFLICT);
        assertThat(resposta.getBody().mensagem()).isEqualTo("Já existe uma conta cadastrada com esses dados");
    }

    // Chave estrangeira ou CHECK recusados (23503, 23514) são falha do próprio sistema: continua 500
    @Test
    void outraRecusaDoBancoContinuaSendoErroInterno() {
        var erro = new DataIntegrityViolationException("chave estrangeira",
                new SQLException("foreign key", "23503"));

        ResponseEntity<ErroResponse> resposta = handler.tratarViolacaoNoBanco(erro);

        assertThat(resposta.getStatusCode()).isEqualTo(HttpStatus.INTERNAL_SERVER_ERROR);
    }
}