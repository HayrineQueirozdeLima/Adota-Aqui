package com.adotaaqui.exception;

import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.validation.FieldError;
import org.springframework.web.bind.MethodArgumentNotValidException;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.bind.annotation.RestControllerAdvice;

import java.util.LinkedHashMap;
import java.util.Map;

@RestControllerAdvice
public class GlobalExceptionHandler {

    @ExceptionHandler(MethodArgumentNotValidException.class)
    public ResponseEntity<ErroResponse> tratarValidacao(MethodArgumentNotValidException ex) {
        Map<String, String> campos = new LinkedHashMap<>();
        for (FieldError erro : ex.getBindingResult().getFieldErrors()) {
            String campo = "senhasConferem".equals(erro.getField()) ? "confirmacaoSenha" : erro.getField();
            campos.putIfAbsent(campo, erro.getDefaultMessage());
        }
        return ResponseEntity.badRequest().body(ErroResponse.de(
                HttpStatus.BAD_REQUEST.value(),
                "Requisição inválida",
                "Existem campos preenchidos de forma incorreta",
                campos));
    }

    @ExceptionHandler(DocumentoInvalidoException.class)
    public ResponseEntity<ErroResponse> tratarDocumentoInvalido(DocumentoInvalidoException ex) {
        return ResponseEntity.badRequest().body(ErroResponse.de(
                HttpStatus.BAD_REQUEST.value(),
                "Requisição inválida",
                ex.getMessage()));
    }

    @ExceptionHandler(RegraNegocioException.class)
    public ResponseEntity<ErroResponse> tratarRegraNegocio(RegraNegocioException ex) {
        return ResponseEntity.status(HttpStatus.CONFLICT).body(ErroResponse.de(
                HttpStatus.CONFLICT.value(),
                "Conflito",
                ex.getMessage()));
    }

    @ExceptionHandler(CredenciaisInvalidasException.class)
    public ResponseEntity<ErroResponse> tratarCredenciais(CredenciaisInvalidasException ex) {
        return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body(ErroResponse.de(
                HttpStatus.UNAUTHORIZED.value(),
                "Não autorizado",
                ex.getMessage()));
    }
}
