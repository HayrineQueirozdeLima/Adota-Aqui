package com.adotaaqui;

import com.adotaaqui.model.Endereco;
import com.adotaaqui.model.Usuario;
import com.adotaaqui.model.enums.TipoConta;
import com.adotaaqui.repository.UsuarioRepository;
import com.adotaaqui.security.JwtService;
import com.adotaaqui.service.ArmazenamentoEmMemoria;
import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.mock.web.MockMultipartFile;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.request.MockHttpServletRequestBuilder;

import java.nio.charset.StandardCharsets;
import java.time.Instant;
import java.util.Arrays;
import java.util.UUID;

import static org.assertj.core.api.Assertions.assertThat;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.multipart;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

// POST /api/fotos (issue #74). Nos testes as fotos vão pro ArmazenamentoEmMemoria: não precisa de conta na AWS
@SpringBootTest
@AutoConfigureMockMvc
class FotoIntegrationTest {

    // Os primeiros bytes de cada formato bastam: é por eles que o back reconhece a imagem
    private static final byte[] JPEG = {(byte) 0xFF, (byte) 0xD8, (byte) 0xFF, (byte) 0xE0, 'J', 'F', 'I', 'F'};
    private static final byte[] PNG = {(byte) 0x89, 'P', 'N', 'G', 0x0D, 0x0A, 0x1A, 0x0A, 'f', 'i', 'm'};
    private static final byte[] WEBP = "RIFF\0\0\0\0WEBPVP8 ".getBytes(StandardCharsets.ISO_8859_1);

    @Autowired MockMvc mvc;
    @Autowired ObjectMapper mapper;
    @Autowired UsuarioRepository usuarios;
    @Autowired JwtService jwt;
    @Autowired ArmazenamentoEmMemoria armazenamento;

    private UUID contaId;
    private String token;

    @BeforeEach
    void criarConta() {
        Endereco endereco = new Endereco();
        endereco.setCep("76801000");
        endereco.setEstado("RO");
        endereco.setCidade("Porto Velho");
        endereco.setNumero("1");

        Usuario usuario = new Usuario();
        usuario.setCpf(String.format("%011d", Math.floorMod(UUID.randomUUID().getMostSignificantBits(), 100_000_000_000L)));
        usuario.setNome("Teste de Fotos");
        usuario.setEmail("fotos-" + UUID.randomUUID() + "@example.com");
        usuario.setTelefone("69999998888");
        usuario.setSenha("hash-de-fixture");
        usuario.setEndereco(endereco);
        contaId = usuarios.saveAndFlush(usuario).getId();
        token = "Bearer " + jwt.gerarToken(contaId, TipoConta.USUARIO, Instant.now().plusSeconds(600));
    }

    @AfterEach
    void apagarConta() {
        usuarios.deleteById(contaId);
    }

    private MockHttpServletRequestBuilder enviar(MockMultipartFile arquivo) {
        return multipart("/api/fotos").file(arquivo).header("Authorization", token);
    }

    private JsonNode resposta(MockHttpServletRequestBuilder requisicao, int statusEsperado) throws Exception {
        String corpo = mvc.perform(requisicao)
                .andExpect(status().is(statusEsperado))
                .andReturn().getResponse().getContentAsString(StandardCharsets.UTF_8);
        return mapper.readTree(corpo);
    }

    @Test
    void guardaAImagemEDevolveAUrlComNomeNovo() throws Exception {
        String url = resposta(enviar(new MockMultipartFile("arquivo", "minha foto.jpg", "image/jpeg", JPEG)), 201)
                .path("url").asText();

        assertThat(url).startsWith("http://localhost:8080/fotos/animais/").endsWith(".jpg")
                .doesNotContain("minha foto");
        assertThat(armazenamento.contem(url.substring("http://localhost:8080/fotos/".length()))).isTrue();
    }

    @Test
    void reconhecePngEWebpPeloConteudo() throws Exception {
        assertThat(resposta(enviar(new MockMultipartFile("arquivo", "a", null, PNG)), 201).path("url").asText())
                .endsWith(".png");
        assertThat(resposta(enviar(new MockMultipartFile("arquivo", "b", null, WEBP)), 201).path("url").asText())
                .endsWith(".webp");
    }

    @Test
    void recusaArquivoQueSoTemNomeDeImagem() throws Exception {
        byte[] programa = "MZ isto nao e uma imagem".getBytes(StandardCharsets.US_ASCII);
        JsonNode erro = resposta(enviar(new MockMultipartFile("arquivo", "gato.jpg", "image/jpeg", programa)), 400);

        assertThat(erro.path("mensagem").asText()).isEqualTo("Envie uma imagem JPG, PNG ou WEBP");
    }

    @Test
    void recusaImagemMaiorQue5MB() throws Exception {
        byte[] grande = Arrays.copyOf(JPEG, 5 * 1024 * 1024 + 1);
        JsonNode erro = resposta(enviar(new MockMultipartFile("arquivo", "grande.jpg", "image/jpeg", grande)), 400);

        assertThat(erro.path("mensagem").asText()).isEqualTo("A imagem pode ter no máximo 5 MB");
    }

    @Test
    void recusaRequisicaoSemArquivo() throws Exception {
        JsonNode erro = resposta(multipart("/api/fotos").header("Authorization", token), 400);

        assertThat(erro.path("mensagem").asText()).isEqualTo("Envie uma imagem no campo arquivo");
    }

    @Test
    void exigeLogin() throws Exception {
        mvc.perform(multipart("/api/fotos").file(new MockMultipartFile("arquivo", "a.jpg", "image/jpeg", JPEG)))
                .andExpect(status().isUnauthorized());
    }
}