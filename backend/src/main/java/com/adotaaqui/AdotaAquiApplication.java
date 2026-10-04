package com.adotaaqui;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.boot.autoconfigure.security.servlet.UserDetailsServiceAutoConfiguration;

// O login é feito pelo AutenticacaoService com JWT, sem o usuário padrão do Spring Security.
// Sem esse exclude, o Spring cria um usuário "user" e escreve a senha dele no log a cada inicialização.
@SpringBootApplication(exclude = UserDetailsServiceAutoConfiguration.class)
public class AdotaAquiApplication {

    public static void main(String[] args) {
        SpringApplication.run(AdotaAquiApplication.class, args);
    }
}