package com.adotaaqui;

import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.test.web.servlet.MockMvc;

import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

// Swagger: a documentação abre sem login e lista as rotas da API, com o cadeado do token
@SpringBootTest
@AutoConfigureMockMvc
class DocumentacaoDaApiIntegrationTest {
    @Autowired MockMvc mvc;

    @Test
    void oJsonDaApiAbreSemLoginComAsRotasEOToken() throws Exception {
        mvc.perform(get("/v3/api-docs"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.info.title").value("API do Adota Aqui"))
                .andExpect(jsonPath("$.servers[0].url").value("/"))
                .andExpect(jsonPath("$.paths['/api/animais'].get").exists())
                .andExpect(jsonPath("$.paths['/api/auth/login'].post").exists())
                .andExpect(jsonPath("$.paths['/api/feiras'].get").exists())
                .andExpect(jsonPath("$.components.securitySchemes.token.scheme").value("bearer"))
                .andExpect(jsonPath("$.tags[?(@.name == 'Animais')]").exists());
    }

    @Test
    void aPaginaDoSwaggerAbreSemLogin() throws Exception {
        mvc.perform(get("/swagger-ui/index.html")).andExpect(status().isOk());
    }

    @Test
    void oSwaggerNaoAbreAsRotasFechadas() throws Exception {
        mvc.perform(get("/api/animais/meus")).andExpect(status().isUnauthorized());
    }
}
