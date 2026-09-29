package com.adotaaqui;

import com.adotaaqui.model.enums.TipoConta;
import com.adotaaqui.repository.AbrigoRepository;
import com.adotaaqui.repository.UsuarioRepository;
import com.adotaaqui.security.JwtService;
import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.test.context.TestConfiguration;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Import;
import org.springframework.http.MediaType;
import org.springframework.security.core.Authentication;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RestController;

import java.time.Instant;
import java.util.Map;
import java.util.UUID;

import static org.assertj.core.api.Assertions.assertThat;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

@SpringBootTest
@AutoConfigureMockMvc
@Import(AutenticacaoIntegrationTest.Config.class)
class AutenticacaoIntegrationTest {
    @Autowired MockMvc mvc;
    @Autowired ObjectMapper mapper;
    @Autowired UsuarioRepository usuarios;
    @Autowired AbrigoRepository abrigos;
    @Autowired PasswordEncoder encoder;
    @Autowired JwtService jwt;

    private static final String SENHA = "minhaSenha123";
    private static final String CPF = "12345678909";
    private static final String CNPJ = "12345678000195";

    @BeforeEach
    void limparContas() {
        usuarios.deleteAll();
        abrigos.deleteAll();
    }

    @Test
    void cadastraUsuarioFazLoginEAutenticaToken() throws Exception {
        JsonNode cadastro = cadastrar(false);
        assertThat(cadastro.path("token").asText()).isNotBlank();
        assertThat(cadastro.path("tipoConta").asText()).isEqualTo("USUARIO");
        assertThat(cadastro.has("senha")).isFalse();
        String hash = usuarios.findByCpf(CPF).orElseThrow().getSenha();
        assertThat(hash).isNotEqualTo(SENHA);
        assertThat(encoder.matches(SENHA, hash)).isTrue();
        conferirAcesso(cadastro);
        conferirAcesso(login(CPF));
    }

    @Test
    void cadastraAbrigoFazLoginEAutenticaToken() throws Exception {
        JsonNode cadastro = cadastrar(true);
        assertThat(cadastro.path("tipoConta").asText()).isEqualTo("ABRIGO");
        assertThat(encoder.matches(SENHA, abrigos.findByCnpj(CNPJ).orElseThrow().getSenha())).isTrue();
        conferirAcesso(cadastro);
        conferirAcesso(login(CNPJ));
    }

    @Test
    void senhaIncorretaEContaInexistenteRetornamMesmoErro() throws Exception {
        cadastrar(false);
        String senhaIncorreta = mvc.perform(post("/api/auth/login").contentType(MediaType.APPLICATION_JSON)
                        .content(mapper.writeValueAsString(Map.of("documento", CPF, "senha", "incorreta"))))
                .andExpect(status().isUnauthorized()).andExpect(jsonPath("status").value(401))
                .andReturn().getResponse().getContentAsString();
        String inexistente = mvc.perform(post("/api/auth/login").contentType(MediaType.APPLICATION_JSON)
                        .content(mapper.writeValueAsString(Map.of("documento", CNPJ, "senha", SENHA))))
                .andExpect(status().isUnauthorized()).andReturn().getResponse().getContentAsString();
        assertThat(mapper.readTree(senhaIncorreta).path("mensagem"))
                .isEqualTo(mapper.readTree(inexistente).path("mensagem"));
    }

    @Test
    void rejeitaLoginSemCamposOuDocumentoComTamanhoInvalido() throws Exception {
        for (String body : new String[]{"{}", "{\"documento\":\"123\",\"senha\":\"teste\"}"}) {
            mvc.perform(post("/api/auth/login").contentType(MediaType.APPLICATION_JSON).content(body))
                    .andExpect(status().isBadRequest()).andExpect(jsonPath("status").value(400));
        }
    }

    @Test
    void rejeitaConfirmacaoAusenteOuDiferenteParaAmbasContas() throws Exception {
        for (boolean abrigo : new boolean[]{false, true}) {
            for (String confirmacao : new String[]{null, "outraSenha"}) {
                var body = mapper.readTree(corpoCadastro(abrigo));
                if (confirmacao == null) ((com.fasterxml.jackson.databind.node.ObjectNode) body).remove("confirmacaoSenha");
                else ((com.fasterxml.jackson.databind.node.ObjectNode) body).put("confirmacaoSenha", confirmacao);
                mvc.perform(post(abrigo ? "/api/abrigos" : "/api/usuarios")
                                .contentType(MediaType.APPLICATION_JSON).content(body.toString()))
                        .andExpect(status().isBadRequest()).andExpect(jsonPath("campos.confirmacaoSenha").isNotEmpty());
            }
        }
        assertThat(usuarios.count()).isZero();
        assertThat(abrigos.count()).isZero();
    }

    @Test
    void rejeitaDocumentoDuplicadoEEmailEntreTiposDeConta() throws Exception {
        cadastrar(false);
        mvc.perform(post("/api/usuarios").contentType(MediaType.APPLICATION_JSON).content(corpoCadastro(false)))
                .andExpect(status().isConflict());
        mvc.perform(post("/api/abrigos").contentType(MediaType.APPLICATION_JSON)
                        .content(corpoCadastro(true).replace("abrigo@example.com", "usuario@example.com")))
                .andExpect(status().isConflict());
    }

    @Test
    void rejeitaTokenInvalidoOuExpiradoInclusiveNoLogin() throws Exception {
        String expirado = jwt.gerarToken(UUID.randomUUID(), TipoConta.USUARIO, CPF, Instant.now().minusSeconds(60));
        for (String token : new String[]{"invalido", expirado}) {
            mvc.perform(get("/api/teste-autenticacao").header("Authorization", "Bearer " + token))
                    .andExpect(status().isUnauthorized()).andExpect(jsonPath("status").value(401));
            mvc.perform(post("/api/auth/login").header("Authorization", "Bearer " + token)
                            .contentType(MediaType.APPLICATION_JSON).content("{}"))
                    .andExpect(status().isUnauthorized()).andExpect(jsonPath("status").value(401));
        }
    }

    @Test
    void rejeitaDocumentosComDigitosVerificadoresInvalidos() throws Exception {
        mvc.perform(post("/api/usuarios").contentType(MediaType.APPLICATION_JSON)
                        .content(corpoCadastro(false).replace(CPF, "12345678901")))
                .andExpect(status().isBadRequest());
        mvc.perform(post("/api/abrigos").contentType(MediaType.APPLICATION_JSON)
                        .content(corpoCadastro(true).replace(CNPJ, "12345678000199")))
                .andExpect(status().isBadRequest());
        assertThat(usuarios.count()).isZero();
        assertThat(abrigos.count()).isZero();
    }

    @Test
    void exigeTokenParaRotaProtegida() throws Exception {
        mvc.perform(get("/api/teste-autenticacao"))
                .andExpect(status().isUnauthorized()).andExpect(jsonPath("status").value(401));
    }

    @Test
    void permitePreflightDoFrontend() throws Exception {
        mvc.perform(options("/api/auth/login").header("Origin", "http://localhost:5173")
                        .header("Access-Control-Request-Method", "POST")
                        .header("Access-Control-Request-Headers", "content-type,authorization"))
                .andExpect(status().isOk())
                .andExpect(header().string("Access-Control-Allow-Origin", "http://localhost:5173"));
    }

    private JsonNode cadastrar(boolean abrigo) throws Exception {
        return mapper.readTree(mvc.perform(post(abrigo ? "/api/abrigos" : "/api/usuarios")
                        .contentType(MediaType.APPLICATION_JSON).content(corpoCadastro(abrigo)))
                .andExpect(status().isCreated()).andReturn().getResponse().getContentAsString());
    }

    private JsonNode login(String documento) throws Exception {
        return mapper.readTree(mvc.perform(post("/api/auth/login").contentType(MediaType.APPLICATION_JSON)
                        .content(mapper.writeValueAsString(Map.of("documento", documento, "senha", SENHA))))
                .andExpect(status().isOk()).andExpect(jsonPath("token").isNotEmpty())
                .andReturn().getResponse().getContentAsString());
    }

    private void conferirAcesso(JsonNode resposta) throws Exception {
        mvc.perform(get("/api/teste-autenticacao").header("Authorization", "Bearer " + resposta.path("token").asText()))
                .andExpect(status().isOk()).andExpect(jsonPath("id").value(resposta.path("id").asText()))
                .andExpect(jsonPath("perfil").value("ROLE_" + resposta.path("tipoConta").asText()));
    }

    private String corpoCadastro(boolean abrigo) throws Exception {
        var body = mapper.createObjectNode();
        body.put("nome", "Conta de teste");
        body.put(abrigo ? "cnpj" : "cpf", abrigo ? CNPJ : CPF);
        if (abrigo) body.put("razaoSocial", "Abrigo de teste");
        body.put("email", abrigo ? "abrigo@example.com" : "usuario@example.com");
        body.put("telefone", "69999998888");
        body.put("senha", SENHA);
        body.put("confirmacaoSenha", SENHA);
        body.set("endereco", mapper.valueToTree(Map.of("cep", "76801000", "numero", "123",
                "cidade", "Porto Velho", "estado", "RO")));
        return body.toString();
    }

    @TestConfiguration
    static class Config {
        @Bean EndpointTeste endpointTeste() { return new EndpointTeste(); }
    }

    @RestController
    static class EndpointTeste {
        @GetMapping("/api/teste-autenticacao")
        Map<String, String> autenticacao(Authentication auth) {
            return Map.of("id", auth.getName(), "perfil", auth.getAuthorities().iterator().next().getAuthority());
        }
    }
}
