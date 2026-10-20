package com.adotaaqui;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.context.ApplicationContext;
import org.springframework.http.MediaType;
import org.springframework.security.core.userdetails.UserDetailsService;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.request.MockHttpServletRequestBuilder;

import java.nio.charset.StandardCharsets;
import java.util.Map;
import java.util.Random;
import java.util.UUID;

import static org.assertj.core.api.Assertions.assertThat;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.delete;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

// Todo erro da API sai no mesmo formato, com o "erro" em português e uma mensagem
// que diz o que corrigir (docs/api.md, seção 4)
@SpringBootTest
@AutoConfigureMockMvc
class ErroApiIntegrationTest {

    @Autowired MockMvc mvc;
    @Autowired ObjectMapper mapper;
    @Autowired ApplicationContext contexto;

    // Faz a requisição, confere o status e devolve o JSON do erro (lido em UTF-8, por causa dos acentos)
    private JsonNode erro(MockHttpServletRequestBuilder requisicao, int statusEsperado) throws Exception {
        String corpo = mvc.perform(requisicao)
                .andExpect(status().is(statusEsperado))
                .andReturn().getResponse().getContentAsString(StandardCharsets.UTF_8);
        return mapper.readTree(corpo);
    }

    @Test
    void animalQueNaoExisteResponde404EmPortugues() throws Exception {
        JsonNode json = erro(get("/api/animais/" + UUID.randomUUID()), 404);

        assertThat(json.path("status").asInt()).isEqualTo(404);
        assertThat(json.path("erro").asText()).isEqualTo("Não encontrado");
        assertThat(json.path("mensagem").asText()).isNotBlank();
    }

    @Test
    void parametrosInvalidosDizemQualParametroEOQueAceitam() throws Exception {
        assertThat(erro(get("/api/racas").param("especie", "PEIXE"), 400).path("mensagem").asText())
                .isEqualTo("Valor inválido para o parâmetro especie. Use um destes: CAO, GATO");
        assertThat(erro(get("/api/racas"), 400).path("mensagem").asText())
                .isEqualTo("O parâmetro especie é obrigatório");
        assertThat(erro(get("/api/animais/nao-e-um-id"), 400).path("mensagem").asText())
                .isEqualTo("Valor inválido para o parâmetro id");
    }

    @Test
    void filtroComValorQueNaoExisteApareceNoCampo() throws Exception {
        JsonNode json = erro(get("/api/animais").param("porte", "ENORME"), 400);

        assertThat(json.path("erro").asText()).isEqualTo("Requisição inválida");
        assertThat(json.path("campos").path("porte").asText())
                .isEqualTo("Valor inválido. Use um destes: PEQUENO, MEDIO, GRANDE");
    }

    @Test
    void jsonQuebradoDizQueOCorpoEstaInvalido() throws Exception {
        JsonNode json = erro(post("/api/usuarios").contentType(MediaType.APPLICATION_JSON).content("{"), 400);

        assertThat(json.path("mensagem").asText()).isEqualTo("O corpo da requisição não é um JSON válido");
    }

    @Test
    void semTokenOErroDeSegurancaVemNoMesmoFormato() throws Exception {
        JsonNode json = erro(get("/api/animais/meus"), 401);

        assertThat(json.path("erro").asText()).isEqualTo("Não autorizado");
        assertThat(json.path("mensagem").asText()).isEqualTo("Autenticação necessária");
    }

    @Test
    void errosDoProprioSpringTambemSaemEmPortugues() throws Exception {
        String token = "Bearer " + criarContaETrazerToken();

        JsonNode enderecoInexistente = erro(get("/api/nao-existe").header("Authorization", token), 404);
        assertThat(enderecoInexistente.path("mensagem").asText()).isEqualTo("Endereço não encontrado na API");

        JsonNode metodoErrado = erro(delete("/api/racas").header("Authorization", token), 405);
        assertThat(metodoErrado.path("erro").asText()).isEqualTo("Método não permitido");

        JsonNode enumNoCorpo = erro(post("/api/animais").header("Authorization", token)
                .contentType(MediaType.APPLICATION_JSON).content("{\"porte\":\"ENORME\"}"), 400);
        assertThat(enumNoCorpo.path("campos").path("porte").asText())
                .isEqualTo("Valor inválido. Use um destes: PEQUENO, MEDIO, GRANDE");
    }

    @Test
    void naoCriaOUsuarioPadraoDoSpringSecurity() {
        // Sem ele, a senha "Using generated security password" some do log
        assertThat(contexto.getBeanNamesForType(UserDetailsService.class)).isEmpty();
    }

    // ----- Ajudantes -----

    private String criarContaETrazerToken() throws Exception {
        Map<String, Object> cadastro = Map.of(
                "cpf", cpfValido(),
                "nome", "Teste de Erros",
                "email", "erros-" + UUID.randomUUID() + "@teste.com",
                "telefone", "69999998888",
                "senha", "senhaSegura1",
                "confirmacaoSenha", "senhaSegura1",
                "endereco", Map.of("cep", "76801000", "estado", "RO", "cidade", "Porto Velho", "numero", "100"));

        String resposta = mvc.perform(post("/api/usuarios").contentType(MediaType.APPLICATION_JSON)
                        .content(mapper.writeValueAsString(cadastro)))
                .andExpect(status().isCreated())
                .andReturn().getResponse().getContentAsString(StandardCharsets.UTF_8);
        return mapper.readTree(resposta).path("token").asText();
    }

    // CPF aleatório com os dígitos verificadores certos, pra não bater com o de outros testes
    private static String cpfValido() {
        int[] d = new int[11];
        Random aleatorio = new Random();
        for (int i = 0; i < 9; i++) d[i] = aleatorio.nextInt(10);
        d[9] = digitoVerificador(d, 9);
        d[10] = digitoVerificador(d, 10);
        StringBuilder cpf = new StringBuilder();
        for (int digito : d) cpf.append(digito);
        return cpf.toString();
    }

    private static int digitoVerificador(int[] d, int quantidade) {
        int soma = 0;
        for (int i = 0; i < quantidade; i++) soma += d[i] * (quantidade + 1 - i);
        int resto = soma % 11;
        return resto < 2 ? 0 : 11 - resto;
    }
}