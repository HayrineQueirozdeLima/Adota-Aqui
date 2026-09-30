package com.adotaaqui.config;

import org.springframework.beans.factory.annotation.Value;
import com.adotaaqui.security.JwtAuthenticationFilter;
import com.adotaaqui.security.ErroSegurancaHandler;
import org.springframework.http.HttpStatus;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.http.HttpMethod;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.config.annotation.web.configuration.EnableWebSecurity;
import org.springframework.security.config.http.SessionCreationPolicy;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.security.web.SecurityFilterChain;
import org.springframework.security.web.authentication.UsernamePasswordAuthenticationFilter;
import org.springframework.web.cors.CorsConfiguration;
import org.springframework.web.cors.CorsConfigurationSource;
import org.springframework.web.cors.UrlBasedCorsConfigurationSource;

import java.util.List;

@Configuration
@EnableWebSecurity
public class SecurityConfig {

    private final JwtAuthenticationFilter jwtAuthenticationFilter;
    private final String[] origensPermitidas;

    // As origens vêm do application.properties (app.cors.origens).
    // No deploy, a variável de ambiente CORS_ORIGENS recebe o endereço do Netlify.
    public SecurityConfig(JwtAuthenticationFilter jwtAuthenticationFilter,
                          @Value("${app.cors.origens:http://localhost:5173}") String[] origensPermitidas) {
        this.jwtAuthenticationFilter = jwtAuthenticationFilter;
        this.origensPermitidas = origensPermitidas;
    }

    // RNF02: as senhas são gravadas apenas como hash BCrypt
    @Bean
    public PasswordEncoder passwordEncoder() {
        return new BCryptPasswordEncoder();
    }

    @Bean
    public SecurityFilterChain securityFilterChain(HttpSecurity http, ErroSegurancaHandler erros) throws Exception {
        http
                .csrf(csrf -> csrf.disable())
                .cors(cors -> cors.configurationSource(corsConfigurationSource()))
                .sessionManagement(session -> session.sessionCreationPolicy(SessionCreationPolicy.STATELESS))
                .authorizeHttpRequests(auth -> auth
                        .requestMatchers(HttpMethod.OPTIONS, "/**").permitAll()
                        // Cadastro e login: qualquer pessoa
                        .requestMatchers(HttpMethod.POST, "/api/auth/login", "/api/usuarios", "/api/abrigos").permitAll()
                        // "Meus animais" precisa de login. Tem que vir antes da regra de baixo
                        // pq o spring usa a primeira regra, e /api/animais/* também pegaria o /meus
                        .requestMatchers(HttpMethod.GET, "/api/animais/meus").authenticated()
                        // Vitrine, perfil do animal e raças: visitante também vê (RF07)
                        .requestMatchers(HttpMethod.GET, "/api/animais", "/api/animais/*", "/api/racas").permitAll()
                        .requestMatchers("/error").permitAll()
                        .anyRequest().authenticated())
                .exceptionHandling(ex -> ex
                        .authenticationEntryPoint((request, response, exception) ->
                                erros.escrever(response, HttpStatus.UNAUTHORIZED, "Autenticação necessária"))
                        .accessDeniedHandler((request, response, exception) ->
                                erros.escrever(response, HttpStatus.FORBIDDEN, "Acesso não permitido")))
                .addFilterBefore(jwtAuthenticationFilter, UsernamePasswordAuthenticationFilter.class);
        return http.build();
    }

    @Bean
    public CorsConfigurationSource corsConfigurationSource() {
        CorsConfiguration configuracao = new CorsConfiguration();
        // Dev server do Vite
        configuracao.setAllowedOrigins(List.of(origensPermitidas));
        configuracao.setAllowedMethods(List.of("GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"));
        configuracao.setAllowedHeaders(List.of("*"));
        UrlBasedCorsConfigurationSource source = new UrlBasedCorsConfigurationSource();
        source.registerCorsConfiguration("/**", configuracao);
        return source;
    }
}
