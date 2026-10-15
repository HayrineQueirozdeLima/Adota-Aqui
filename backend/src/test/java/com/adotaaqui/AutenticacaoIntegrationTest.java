package com.adotaaqui;

import com.adotaaqui.model.enums.TipoConta;
import com.adotaaqui.repository.AbrigoRepository;
import com.adotaaqui.repository.UsuarioRepository;
import com.adotaaqui.security.JwtService;
import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.fasterxml.jackson.databind.node.ObjectNode;
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
import org.springframework.test.web.servlet.ResultActions;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RestController;

import java.time.Instant;
import java.util.LinkedHashMap;
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
    private static final String OUTRO_CPF = "52998224725";

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
        assertThat(mapper.readTree(senhaIncorreta).path("mensagem").asText()).isEqualTo("Documento ou senha inválidos");
    }

    // O documento pode chegar com máscara: o back fica só com os números
    @Test
    void loginAceitaDocumentoComMascara() throws Exception {
        cadastrar(false);
        cadastrar(true);
        assertThat(login("123.456.789-09").path("tipoConta").asText()).isEqualTo("USUARIO");
        assertThat(login("12.345.678/0001-95").path("tipoConta").asText()).isEqualTo("ABRIGO");
    }

    @Test
    void documentoSemOnzeNemQuatorzeDigitosExplicaOFormatoNoLogin() throws Exception {
        mvc.perform(post("/api/auth/login").contentType(MediaType.APPLICATION_JSON)
                        .content(mapper.writeValueAsString(Map.of("documento", "123456789", "senha", SENHA))))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("mensagem").value(
                        "Documento com formato inválido: informe um CPF (11 dígitos) ou um CNPJ (14 dígitos)"));
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
    void cpfRepetidoNaoCriaOutraContaEDizOMotivo() throws Exception {
        cadastrar(false);
        ObjectNode outraPessoa = corpo(false);
        outraPessoa.put("email", "outra@example.com");
        enviarCadastro(false, outraPessoa)
                .andExpect(status().isConflict())
                .andExpect(jsonPath("mensagem").value("Já existe uma conta cadastrada com este CPF"));
        assertThat(usuarios.count()).isEqualTo(1);
    }

    @Test
    void cnpjRepetidoNaoCriaOutroAbrigoEDizOMotivo() throws Exception {
        cadastrar(true);
        ObjectNode outroAbrigo = corpo(true);
        outroAbrigo.put("email", "outro@example.com");
        enviarCadastro(true, outroAbrigo)
                .andExpect(status().isConflict())
                .andExpect(jsonPath("mensagem").value("Já existe uma conta cadastrada com este CNPJ"));
        assertThat(abrigos.count()).isEqualTo(1);
    }

    // O e-mail é único nas duas tabelas e é comparado sem diferença entre maiúsculas e minúsculas
    @Test
    void emailRepetidoValeParaAsDuasContasEIgnoraMaiusculas() throws Exception {
        cadastrar(true);
        ObjectNode usuarioComEmailDoAbrigo = corpo(false);
        usuarioComEmailDoAbrigo.put("email", "ABRIGO@Example.com");
        enviarCadastro(false, usuarioComEmailDoAbrigo)
                .andExpect(status().isConflict())
                .andExpect(jsonPath("mensagem").value("Já existe uma conta cadastrada com este e-mail"));

        cadastrar(false);
        ObjectNode outroUsuario = corpo(false);
        outroUsuario.put("cpf", OUTRO_CPF);
        outroUsuario.put("email", "USUARIO@EXAMPLE.COM");
        enviarCadastro(false, outroUsuario).andExpect(status().isConflict());

        assertThat(usuarios.count()).isEqualTo(1);
        assertThat(abrigos.count()).isEqualTo(1);
    }

    @Test
    void cpfOuCnpjComFormatoInvalidoNaoCriaConta() throws Exception {
        for (String cpf : new String[]{"1234567890", "123456789012", "abcdefghijk", "11111111111"}) {
            ObjectNode corpo = corpo(false);
            corpo.put("cpf", cpf);
            enviarCadastro(false, corpo)
                    .andExpect(status().isBadRequest())
                    .andExpect(jsonPath("mensagem").value("CPF inválido"));
        }
        for (String cnpj : new String[]{"1234567800019", "abcdefghijklmn", "11111111111111"}) {
            ObjectNode corpo = corpo(true);
            corpo.put("cnpj", cnpj);
            enviarCadastro(true, corpo)
                    .andExpect(status().isBadRequest())
                    .andExpect(jsonPath("mensagem").value("CNPJ inválido"));
        }
        assertThat(usuarios.count()).isZero();
        assertThat(abrigos.count()).isZero();
    }

    // Cada campo com problema volta em "campos", com o mesmo nome que o front usa pra mostrar o erro no lugar certo
    @Test
    void campoObrigatorioVazioOuInvalidoApontaOCampo() throws Exception {
        Map<String, String> comuns = new LinkedHashMap<>();
        comuns.put("nome", "");
        comuns.put("email", "nao-e-um-email");
        comuns.put("telefone", "123");
        comuns.put("senha", "curta");
        comuns.put("endereco.cep", "123");
        comuns.put("endereco.estado", "Rondonia");
        comuns.put("endereco.cidade", "");
        comuns.put("endereco.numero", "");
        for (boolean abrigo : new boolean[]{false, true}) {
            Map<String, String> casos = new LinkedHashMap<>(comuns);
            casos.put(abrigo ? "cnpj" : "cpf", "");
            if (abrigo) casos.put("razaoSocial", "");
            for (Map.Entry<String, String> caso : casos.entrySet()) {
                ObjectNode corpo = corpo(abrigo);
                trocarCampo(corpo, caso.getKey(), caso.getValue());
                // a confirmação acompanha a senha, pra que o erro seja só o tamanho
                if (caso.getKey().equals("senha")) corpo.put("confirmacaoSenha", caso.getValue());
                enviarCadastro(abrigo, corpo)
                        .andExpect(status().isBadRequest())
                        .andExpect(jsonPath("mensagem").value("Existem campos preenchidos de forma incorreta"))
                        .andExpect(jsonPath("$.campos['" + caso.getKey() + "']").isNotEmpty());
            }
        }
        assertThat(usuarios.count()).isZero();
        assertThat(abrigos.count()).isZero();
    }

    @Test
    void rejeitaTokenInvalidoOuExpiradoInclusiveNoLogin() throws Exception {
        String expirado = jwt.gerarToken(UUID.randomUUID(), TipoConta.USUARIO, Instant.now().minusSeconds(60));
        for (String token : new String[]{"invalido", expirado}) {
            mvc.perform(get("/api/teste-autenticacao").header("Authorization", "Bearer " + token))
                    .andExpect(status().isUnauthorized()).andExpect(jsonPath("status").value(401));
            mvc.perform(post("/api/auth/login").header("Authorization", "Bearer " + token)
                            .contentType(MediaType.APPLICATION_JSON).content("{}"))
                    .andExpect(status().isUnauthorized()).andExpect(jsonPath("status").value(401));
        }
    }

    @Test
    void tokenNaoLevaCpfNemCnpj() throws Exception {
        JsonNode cadastro = cadastrar(false);
        var claims = jwt.extrairClaims(cadastro.path("token").asText());
        assertThat(claims).doesNotContainKey("documento");
        assertThat(claims.values()).doesNotContain(CPF);
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

    private ObjectNode corpo(boolean abrigo) throws Exception {
        return (ObjectNode) mapper.readTree(corpoCadastro(abrigo));
    }

    private ResultActions enviarCadastro(boolean abrigo, ObjectNode corpo) throws Exception {
        return mvc.perform(post(abrigo ? "/api/abrigos" : "/api/usuarios")
                .contentType(MediaType.APPLICATION_JSON).content(corpo.toString()));
    }

    // "endereco.cep" mexe dentro do objeto endereco; o resto, direto no corpo
    private static void trocarCampo(ObjectNode corpo, String campo, String valor) {
        if (campo.startsWith("endereco.")) {
            ((ObjectNode) corpo.path("endereco")).put(campo.substring("endereco.".length()), valor);
        } else {
            corpo.put(campo, valor);
        }
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
