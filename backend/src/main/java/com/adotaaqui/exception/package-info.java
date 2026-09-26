/**
 * Tratamento de erros.
 *
 * A ideia é ter um @ControllerAdvice que transforma as exceções no formato de erro
 * padrão do docs/api.md (status, erro, mensagem, campos, timestamp).
 * Assim o front trata todo erro do mesmo jeito, e a pessoa vê "CPF já cadastrado"
 * em vez de um erro 500 sem explicação.
 */
package com.adotaaqui.exception;
