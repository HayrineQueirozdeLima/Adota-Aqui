package com.adotaaqui.security;

import io.jsonwebtoken.Claims;
import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpStatus;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.web.authentication.WebAuthenticationDetailsSource;
import org.springframework.stereotype.Component;
import org.springframework.web.filter.OncePerRequestFilter;

import java.io.IOException;
import java.util.List;

@Component
public class JwtAuthenticationFilter extends OncePerRequestFilter {

    private static final String PREFIXO_BEARER = "Bearer ";

    private final JwtService jwtService;
    private final ErroSegurancaHandler erros;

    public JwtAuthenticationFilter(JwtService jwtService, ErroSegurancaHandler erros) {
        this.jwtService = jwtService;
        this.erros = erros;
    }

    @Override
    protected void doFilterInternal(HttpServletRequest request, HttpServletResponse response,
                                    FilterChain filterChain) throws ServletException, IOException {
        String header = request.getHeader(HttpHeaders.AUTHORIZATION);
        if (header != null) {
            Claims claims = header.startsWith(PREFIXO_BEARER)
                    ? jwtService.extrairClaims(header.substring(PREFIXO_BEARER.length())) : null;
            if (claims == null) {
                SecurityContextHolder.clearContext();
                erros.escrever(response, HttpStatus.UNAUTHORIZED, "Token inválido ou expirado");
                return;
            }
            String tipoConta = claims.get(JwtService.CLAIM_TIPO_CONTA, String.class);
            var authorities = tipoConta == null
                    ? List.<SimpleGrantedAuthority>of()
                    : List.of(new SimpleGrantedAuthority("ROLE_" + tipoConta));
            var autenticacao = new UsernamePasswordAuthenticationToken(
                    claims.getSubject(), null, authorities);
            autenticacao.setDetails(new WebAuthenticationDetailsSource().buildDetails(request));
            SecurityContextHolder.getContext().setAuthentication(autenticacao);
        }
        filterChain.doFilter(request, response);
    }
}
