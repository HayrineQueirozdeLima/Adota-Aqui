package com.adotaaqui;

import com.adotaaqui.model.Abrigo;
import com.adotaaqui.model.Endereco;
import com.adotaaqui.model.Usuario;
import com.adotaaqui.model.enums.TipoConta;
import com.adotaaqui.repository.AbrigoRepository;
import com.adotaaqui.repository.AnimalRepository;
import com.adotaaqui.repository.DicaRepository;
import com.adotaaqui.repository.UsuarioRepository;
import com.adotaaqui.security.JwtService;
import com.adotaaqui.service.ArmazenamentoEmMemoria;
import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.fasterxml.jackson.databind.node.ObjectNode;
import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.http.MediaType;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.mock.web.MockMultipartFile;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.request.MockHttpServletRequestBuilder;

import java.sql.Timestamp;
import java.time.Instant;
import java.time.LocalDateTime;
import java.util.UUID;

import static org.assertj.core.api.Assertions.assertThat;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.delete;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.multipart;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.put;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.header;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

// Blog de dicas: protetores escrevem, qualquer pessoa lê
@SpringBootTest
@AutoConfigureMockMvc
class DicaIntegrationTest {
    @Autowired MockMvc mvc;
    @Autowired ObjectMapper mapper;
    @Autowired DicaRepository dicas;
    @Autowired AnimalRepository animais;
    @Autowired UsuarioRepository usuarios;
    @Autowired AbrigoRepository abrigos;
    @Autowired JwtService jwt;
    @Autowired JdbcTemplate jdbc;
    @Autowired ArmazenamentoEmMemoria armazenamento;
    private int sequencia;

    private static final byte[] JPEG = {(byte) 0xFF, (byte) 0xD8, (byte) 0xFF, (byte) 0xE0, 'J', 'F', 'I', 'F'};
    private static final String TEXTO = "Nos primeiros dias, deixe o animal explorar a casa no tempo dele, "
            + "com água, comida e um cantinho tranquilo pra dormir.";

    private record Conta(UUID id, String token) {}

    @BeforeEach
    @AfterEach
    void limpar() {
        dicas.deleteAll();
        animais.deleteAll();
        usuarios.deleteAll();
        abrigos.deleteAll();
        sequencia = 0;
    }

    @Test
    void abrigoPublicaEQualquerPessoaLe() throws Exception {
        Conta abrigo = abrigo();
        String id = mapper.readTree(mvc.perform(publicar(abrigo, dica("Os primeiros dias em casa", "PRIMEIROS_DIAS")))
                        .andExpect(status().isCreated()).andExpect(header().exists("Location"))
                        .andReturn().getResponse().getContentAsString())
                .path("id").asText();

        // Na lista, sem login: o resumo e o autor, sem e-mail nem telefone
        String lista = mvc.perform(get("/api/dicas")).andExpect(status().isOk())
                .andExpect(jsonPath("$.totalItens").value(1))
                .andExpect(jsonPath("$.itens[0].titulo").value("Os primeiros dias em casa"))
                .andExpect(jsonPath("$.itens[0].categoriaNome").value("Primeiros dias em casa"))
                .andExpect(jsonPath("$.itens[0].autor.nome").value("Abrigo 1"))
                .andExpect(jsonPath("$.itens[0].autor.tipo").value("ABRIGO"))
                .andExpect(jsonPath("$.itens[0].autor.estado").value("RO"))
                .andReturn().getResponse().getContentAsString();
        assertThat(lista).doesNotContain("@example.com", "6932221111");

        mvc.perform(get("/api/dicas/" + id)).andExpect(status().isOk())
                .andExpect(jsonPath("$.conteudo").value(TEXTO))
                .andExpect(jsonPath("$.ehMinha").value(false))
                .andExpect(jsonPath("$.atualizadaEm").isEmpty());
        mvc.perform(auth(get("/api/dicas/" + id), abrigo)).andExpect(jsonPath("$.ehMinha").value(true));
        mvc.perform(get("/api/dicas/" + UUID.randomUUID())).andExpect(status().isNotFound());
    }

    @Test
    void textoGrandeViraResumoSemCortarPalavra() throws Exception {
        Conta abrigo = abrigo();
        String longo = (TEXTO + " ").repeat(5).strip();
        mvc.perform(publicar(abrigo, dica("Um texto bem comprido", "SAUDE").put("conteudo", longo)))
                .andExpect(status().isCreated());

        String resumo = mapper.readTree(mvc.perform(get("/api/dicas")).andReturn().getResponse().getContentAsString())
                .path("itens").get(0).path("resumo").asText();
        assertThat(resumo).endsWith("...").hasSizeLessThanOrEqualTo(183);
        assertThat(longo).startsWith(resumo.substring(0, resumo.length() - 3));
        assertThat(longo.charAt(resumo.length() - 3)).isEqualTo(' ');
    }

    @Test
    void pessoaSoPublicaDepoisDeCadastrarUmAnimal() throws Exception {
        Conta pessoa = usuario();
        mvc.perform(auth(get("/api/dicas/minhas"), pessoa))
                .andExpect(jsonPath("$.podePublicar").value(false))
                .andExpect(jsonPath("$.dicas").isEmpty());
        mvc.perform(publicar(pessoa, dica("Ainda não sou protetora", "COMPORTAMENTO")))
                .andExpect(status().isForbidden())
                .andExpect(jsonPath("$.mensagem")
                        .value("Só protetores publicam dicas. Cadastre um animal antes de escrever a sua"));

        animal(pessoa);
        mvc.perform(auth(get("/api/dicas/minhas"), pessoa)).andExpect(jsonPath("$.podePublicar").value(true));
        mvc.perform(publicar(pessoa, dica("Agora já sou protetora", "COMPORTAMENTO")))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.autor.tipo").value("USUARIO"));
        mvc.perform(auth(get("/api/dicas/minhas"), pessoa)).andExpect(jsonPath("$.dicas.length()").value(1));
    }

    @Test
    void soQuemEscreveuEditaEApaga() throws Exception {
        Conta autor = abrigo();
        Conta outro = abrigo();
        String id = criar(autor, dica("Vacinas do primeiro ano", "SAUDE"));
        ObjectNode alterada = dica("Vacinas do primeiro ano, atualizado", "SAUDE");

        mvc.perform(auth(put("/api/dicas/" + id), outro).contentType(MediaType.APPLICATION_JSON)
                .content(alterada.toString())).andExpect(status().isForbidden());
        mvc.perform(auth(put("/api/dicas/" + id), autor).contentType(MediaType.APPLICATION_JSON)
                        .content(alterada.toString())).andExpect(status().isOk())
                .andExpect(jsonPath("$.titulo").value("Vacinas do primeiro ano, atualizado"))
                .andExpect(jsonPath("$.atualizadaEm").isNotEmpty());

        mvc.perform(auth(delete("/api/dicas/" + id), outro)).andExpect(status().isForbidden());
        mvc.perform(auth(delete("/api/dicas/" + id), autor)).andExpect(status().isNoContent());
        mvc.perform(get("/api/dicas/" + id)).andExpect(status().isNotFound());
    }

    @Test
    void camposSaoConferidos() throws Exception {
        Conta abrigo = abrigo();
        mvc.perform(publicar(abrigo, dica("Oi", "SAUDE"))).andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.campos.titulo").value("O título deve ter de 5 a 120 caracteres"));
        mvc.perform(publicar(abrigo, dica("Título bom", "SAUDE").put("conteudo", "Curto demais.")))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.campos.conteudo").value("A dica deve ter de 50 a 10000 caracteres"));
        ObjectNode semCategoria = dica("Título bom", "SAUDE");
        semCategoria.remove("categoria");
        mvc.perform(publicar(abrigo, semCategoria)).andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.campos.categoria").value("Escolha o assunto da dica"));
        mvc.perform(publicar(abrigo, dica("Título bom", "ASTROLOGIA"))).andExpect(status().isBadRequest());
        mvc.perform(publicar(abrigo, dica("Capa de fora", "SAUDE").put("fotoCapa", "https://example.com/capa.jpg")))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.mensagem").value("Envie a foto pelo próprio site"));
        assertThat(dicas.count()).isZero();
    }

    @Test
    void filtraPorAssuntoEVemEmPaginasDaMaisNovaPraMaisAntiga() throws Exception {
        Conta abrigo = abrigo();
        String antiga = criar(abrigo, dica("Vacinas do filhote", "SAUDE"));
        String nova = criar(abrigo, dica("Vermífugo em dia", "SAUDE"));
        criar(abrigo, dica("Ração ou comida caseira", "ALIMENTACAO"));
        jdbc.update("update dica set publicada_em = ? where id = ?",
                Timestamp.valueOf(LocalDateTime.now().minusDays(2)), UUID.fromString(antiga));

        mvc.perform(get("/api/dicas").param("categoria", "SAUDE").param("tamanho", "1"))
                .andExpect(jsonPath("$.itens[0].id").value(nova))
                .andExpect(jsonPath("$.totalItens").value(2))
                .andExpect(jsonPath("$.totalPaginas").value(2));
        mvc.perform(get("/api/dicas").param("categoria", "SAUDE").param("tamanho", "1").param("pagina", "1"))
                .andExpect(jsonPath("$.itens[0].id").value(antiga));
        mvc.perform(get("/api/dicas")).andExpect(jsonPath("$.totalItens").value(3));
        mvc.perform(get("/api/dicas").param("categoria", "ASTROLOGIA")).andExpect(status().isBadRequest());
        mvc.perform(get("/api/dicas").param("pagina", "-1")).andExpect(status().isBadRequest());
    }

    @Test
    void capaTrocadaOuDicaApagadaSaiDoArmazenamento() throws Exception {
        Conta abrigo = abrigo();
        String primeira = enviarFoto(abrigo);
        String segunda = enviarFoto(abrigo);
        String id = criar(abrigo, dica("Com capa", "COMPORTAMENTO").put("fotoCapa", primeira));

        mvc.perform(auth(put("/api/dicas/" + id), abrigo).contentType(MediaType.APPLICATION_JSON)
                        .content(dica("Com outra capa", "COMPORTAMENTO").put("fotoCapa", segunda).toString()))
                .andExpect(status().isOk());
        assertThat(armazenamento.contem(chave(primeira))).isFalse();
        assertThat(armazenamento.contem(chave(segunda))).isTrue();

        mvc.perform(auth(delete("/api/dicas/" + id), abrigo)).andExpect(status().isNoContent());
        assertThat(armazenamento.contem(chave(segunda))).isFalse();
    }

    @Test
    void escreverEVerAsMinhasPrecisaDeLogin() throws Exception {
        mvc.perform(post("/api/dicas").contentType(MediaType.APPLICATION_JSON)
                .content(dica("Sem login", "SAUDE").toString())).andExpect(status().isUnauthorized());
        mvc.perform(get("/api/dicas/minhas")).andExpect(status().isUnauthorized());
    }

    // ---------- ajudantes ----------

    private ObjectNode dica(String titulo, String categoria) {
        ObjectNode corpo = mapper.createObjectNode();
        corpo.put("titulo", titulo);
        corpo.put("conteudo", TEXTO);
        corpo.put("categoria", categoria);
        return corpo;
    }

    private MockHttpServletRequestBuilder publicar(Conta conta, ObjectNode corpo) {
        return auth(post("/api/dicas"), conta).contentType(MediaType.APPLICATION_JSON).content(corpo.toString());
    }

    private String criar(Conta conta, ObjectNode corpo) throws Exception {
        JsonNode criada = mapper.readTree(mvc.perform(publicar(conta, corpo)).andExpect(status().isCreated())
                .andReturn().getResponse().getContentAsString());
        return criada.path("id").asText();
    }

    private void animal(Conta protetor) throws Exception {
        String corpo = """
                {"nome":"Mel","especie":"CAO","raca":"SRD_CAO","sexo":"FEMEA","porte":"MEDIO",
                 "dataNascEstimada":"2020-01-01","castrado":true,"energia":"MAIS_CALMO",
                 "convivencia":{"crianca":"NAO_TESTADO","gato":"CONVIVE_BEM","cao":"NAO_CONVIVE_BEM"},
                 "historia":"Resgatada","fotos":["https://example.com/mel.jpg"]}
                """;
        mvc.perform(auth(post("/api/animais"), protetor).contentType(MediaType.APPLICATION_JSON).content(corpo))
                .andExpect(status().isCreated());
    }

    private String enviarFoto(Conta conta) throws Exception {
        MockMultipartFile arquivo = new MockMultipartFile("arquivo", "capa.jpg", "image/jpeg", JPEG);
        return mapper.readTree(mvc.perform(auth(multipart("/api/fotos").file(arquivo), conta))
                .andExpect(status().isCreated()).andReturn().getResponse().getContentAsString()).path("url").asText();
    }

    private static String chave(String url) {
        return url.substring(url.indexOf("animais/"));
    }

    private MockHttpServletRequestBuilder auth(MockHttpServletRequestBuilder request, Conta conta) {
        return request.header("Authorization", "Bearer " + conta.token());
    }

    private Conta usuario() {
        int numero = ++sequencia;
        Usuario usuario = new Usuario();
        usuario.setCpf(String.format("%011d", numero));
        usuario.setNome("Pessoa " + numero);
        usuario.setEmail("dica" + numero + "@example.com");
        usuario.setTelefone("69999998888");
        usuario.setSenha("hash-de-fixture");
        usuario.setEndereco(endereco());
        UUID id = usuarios.saveAndFlush(usuario).getId();
        return new Conta(id, jwt.gerarToken(id, TipoConta.USUARIO, Instant.now().plusSeconds(600)));
    }

    private Conta abrigo() {
        int numero = ++sequencia;
        Abrigo abrigo = new Abrigo();
        abrigo.setCnpj(String.format("%014d", numero));
        abrigo.setNome("Abrigo " + numero);
        abrigo.setRazaoSocial("Abrigo " + numero);
        abrigo.setEmail("dica-abrigo" + numero + "@example.com");
        abrigo.setTelefone("6932221111");
        abrigo.setSenha("hash-de-fixture");
        abrigo.setEndereco(endereco());
        UUID id = abrigos.saveAndFlush(abrigo).getId();
        return new Conta(id, jwt.gerarToken(id, TipoConta.ABRIGO, Instant.now().plusSeconds(600)));
    }

    private static Endereco endereco() {
        Endereco endereco = new Endereco();
        endereco.setCep("76801000");
        endereco.setEstado("RO");
        endereco.setCidade("Porto Velho");
        endereco.setNumero("1");
        return endereco;
    }
}
