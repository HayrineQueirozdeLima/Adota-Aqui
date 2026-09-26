/**
 * Segurança: login com JWT.
 *
 * Aqui fica gerar o token, validar o token que chega no cabeçalho Authorization
 * e descobrir se é um Usuario (CPF, 11 dígitos) ou um Abrigo (CNPJ, 14 dígitos).
 * O token vale 24h (jwt.expiration-ms no application.properties).
 *
 * Senha sempre com BCrypt (RNF02).
 */
package com.adotaaqui.security;
