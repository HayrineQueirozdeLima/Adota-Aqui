package com.adotaaqui.security;

import com.adotaaqui.model.enums.TipoConta;
import io.jsonwebtoken.Claims;
import io.jsonwebtoken.Jwts;
import io.jsonwebtoken.JwtException;
import io.jsonwebtoken.security.Keys;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;

import javax.crypto.SecretKey;
import java.nio.charset.StandardCharsets;
import java.time.Instant;
import java.util.Date;
import java.util.UUID;

@Service
public class JwtService {

    public static final String CLAIM_TIPO_CONTA = "tipoConta";
    public static final String CLAIM_DOCUMENTO = "documento";

    private final SecretKey chave;
    private final long expiracaoMs;

    public JwtService(@Value("${jwt.secret}") String segredo,
                      @Value("${jwt.expiration-ms}") long expiracaoMs) {
        this.chave = Keys.hmacShaKeyFor(segredo.getBytes(StandardCharsets.UTF_8));
        this.expiracaoMs = expiracaoMs;
    }

    // Mudei o método para gerar o token: o token leva só o id (no subject) e o tipo de conta. 
    // Bom evitar cpf e cnpj no nome, o JWT é assinado, mas NÃO é criptografado, então qualquer pessoa com o token consegue ler
    // o conteúdo (é só colar no jwt.io), e o token fica salvo no navegador.
    public String gerarToken(UUID id, TipoConta tipoConta, Instant expiraEm) {
        return Jwts.builder()
                .subject(id.toString())
                .claim(CLAIM_TIPO_CONTA, tipoConta.name())
                .issuedAt(Date.from(Instant.now()))
                .expiration(Date.from(expiraEm))
                .signWith(chave)
                .compact();
    }

    public Instant calcularExpiracao() {
        return Instant.now().plusMillis(expiracaoMs);
    }

    /**
     * Retorna as claims do token ou null quando ele é inválido/expirado.
     */
    public Claims extrairClaims(String token) {
        try {
            return Jwts.parser()
                    .verifyWith(chave)
                    .build()
                    .parseSignedClaims(token)
                    .getPayload();
        } catch (JwtException | IllegalArgumentException e) {
            return null;
        }
    }

    public boolean isValido(String token) {
        return extrairClaims(token) != null;
    }
}
