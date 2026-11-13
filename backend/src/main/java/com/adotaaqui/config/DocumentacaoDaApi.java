package com.adotaaqui.config;

import io.swagger.v3.oas.models.Components;
import io.swagger.v3.oas.models.OpenAPI;
import io.swagger.v3.oas.models.info.Info;
import io.swagger.v3.oas.models.security.SecurityRequirement;
import io.swagger.v3.oas.models.security.SecurityScheme;
import io.swagger.v3.oas.models.servers.Server;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

import java.util.List;

// Swagger: a documentação da API que dá pra testar no navegador, em /swagger-ui.html.
// Quem monta a lista de endpoints é o springdoc, lendo os controllers. Aqui só vai o cabeçalho
// e o cadeado do token, pra testar as rotas que pedem login.
// O contrato completo, com as regras e os erros, continua no docs/api.md
@Configuration
public class DocumentacaoDaApi {

    static final String TOKEN = "token";

    @Bean
    public OpenAPI openApi() {
        return new OpenAPI()
                .info(new Info()
                        .title("API do Adota Aqui")
                        .version("1.4.0")
                        .description("""
                                Plataforma de adoção de cães e gatos. Projeto final da Trilha Dev. Full Stack 2026 \
                                (+praTi e Codifica).

                                Pra testar uma rota que pede login: faça o POST /api/auth/login, copie o token da \
                                resposta, clique em Authorize e cole o token (sem escrever "Bearer"). As rotas \
                                abertas funcionam sem token.

                                As regras de cada endpoint e os erros estão no docs/api.md do repositório."""))
                // "/" é o mesmo endereço da página: no Render vira https://adota-aqui.onrender.com e,
                // na máquina de vocês, http://localhost:8080. Sem isso, atrás do proxy do Render
                // o Swagger montaria o endereço com http e o navegador bloquearia o "Try it out"
                .servers(List.of(new Server().url("/").description("Esta mesma API")))
                .components(new Components().addSecuritySchemes(TOKEN, new SecurityScheme()
                        .type(SecurityScheme.Type.HTTP)
                        .scheme("bearer")
                        .bearerFormat("JWT")
                        .description("O token que o POST /api/auth/login devolve")))
                .addSecurityItem(new SecurityRequirement().addList(TOKEN));
    }
}
