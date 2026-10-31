package com.adotaaqui;

import com.adotaaqui.model.Abrigo;
import com.adotaaqui.model.Endereco;
import com.adotaaqui.model.Usuario;
import com.adotaaqui.model.enums.TipoConta;
import com.adotaaqui.repository.AbrigoRepository;
import com.adotaaqui.repository.AnimalRepository;
import com.adotaaqui.repository.DepoimentoRepository;
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
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.UUID;

import static org.assertj.core.api.Assertions.assertThat;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.delete;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.multipart;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.patch;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

// Depoimento de quem adotou e mural de histórias (RF11, UC09). Tudo pela API, como o site faz:
// o abrigo cadastra o animal, a pessoa demonstra interesse, o abrigo aprova e a pessoa conta como foi
@SpringBootTest
@AutoConfigureMockMvc
class DepoimentoIntegrationTest {
    @Autowired MockMvc mvc;
    @Autowired ObjectMapper mapper;
    @Autowired AnimalRepository animais;
    @Autowired UsuarioRepository usuarios;
    @Autowired AbrigoRepository abrigos;
    @Autowired DepoimentoRepository depoimentos;
    @Autowired JwtService jwt;
    @Autowired JdbcTemplate jdbc;
    @Autowired ArmazenamentoEmMemoria armazenamento;
    private int sequencia;

    private static final byte[] JPEG = {(byte) 0xFF, (byte) 0xD8, (byte) 0xFF, (byte) 0xE0, 'J', 'F', 'I', 'F'};

    private record Conta(UUID id, String token) {}

    @BeforeEach
    @AfterEach
    void limpar() {
        animais.deleteAll(); // leva junto os interesses, e o banco apaga os depoimentos deles
        usuarios.deleteAll();
        abrigos.deleteAll();
        sequencia = 0;
    }

    @Test
    void quemAdotouContaComoFoiEOMuralMostraSoOPrimeiroNomeEOEstado() throws Exception {
        Conta abrigo = abrigo();
        Conta ana = usuario("Ana Clara Souza");
        String animal = animal(abrigo);
        String interesse = adotar(animal, ana, abrigo);

        JsonNode escrito = criado(escrever(interesse, ana, depoimento("A Mel chegou tímida e hoje dorme no sofá.")));
        assertThat(escrito.path("autor").asText()).isEqualTo("Ana");
        assertThat(escrito.path("estado").asText()).isEqualTo("RO");
        assertThat(escrito.path("animal").path("nome").asText()).isEqualTo("Mel");
        assertThat(escrito.path("protetor").asText()).isEqualTo("Abrigo 1");

        // O mural é público: sem login, e sem o sobrenome, o e-mail ou o telefone de quem adotou
        String mural = mvc.perform(get("/api/depoimentos")).andExpect(status().isOk())
                .andExpect(jsonPath("$.totalItens").value(1))
                .andExpect(jsonPath("$.itens[0].texto").value("A Mel chegou tímida e hoje dorme no sofá."))
                .andReturn().getResponse().getContentAsString();
        assertThat(mural).doesNotContain("Souza", "@example.com", "69999998888");

        // Em Minhas candidaturas, a adoção mostra que a história já foi contada
        mvc.perform(auth(get("/api/interesses/meus"), ana))
                .andExpect(jsonPath("$[0].depoimentoId").value(escrito.path("id").asText()))
                .andExpect(jsonPath("$[0].podeContarAdocao").value(false));
    }

    @Test
    void aprovadoMostraOPrazoDe30DiasEAntigoSemDataNaoTemPrazo() throws Exception {
        Conta abrigo = abrigo();
        Conta ana = usuario("Ana Souza");
        String interesse = adotar(animal(abrigo), ana, abrigo);

        mvc.perform(auth(get("/api/interesses/meus"), ana))
                .andExpect(jsonPath("$[0].podeContarAdocao").value(true))
                .andExpect(jsonPath("$[0].prazoDepoimento").value(LocalDate.now().plusDays(30).toString()))
                .andExpect(jsonPath("$[0].depoimentoId").isEmpty());

        // Adoção aprovada antes de existir a data da aprovação: pode contar, sem prazo
        jdbc.update("update interesse set aprovado_em = null where id = ?", UUID.fromString(interesse));
        mvc.perform(auth(get("/api/interesses/meus"), ana))
                .andExpect(jsonPath("$[0].podeContarAdocao").value(true))
                .andExpect(jsonPath("$[0].prazoDepoimento").isEmpty());
        criado(escrever(interesse, ana, depoimento("Melhor decisão que a gente tomou.")));
    }

    @Test
    void depoisDe30DiasNaoDaMaisPraContar() throws Exception {
        Conta abrigo = abrigo();
        Conta ana = usuario("Ana Souza");
        String interesse = adotar(animal(abrigo), ana, abrigo);
        jdbc.update("update interesse set aprovado_em = ? where id = ?",
                Timestamp.valueOf(LocalDateTime.now().minusDays(31)), UUID.fromString(interesse));

        mvc.perform(escrever(interesse, ana, depoimento("Chegou tarde, mas chegou.")))
                .andExpect(status().isConflict())
                .andExpect(jsonPath("$.mensagem").value("O prazo de 30 dias pra contar como foi a adoção acabou"));
        mvc.perform(auth(get("/api/interesses/meus"), ana))
                .andExpect(jsonPath("$[0].podeContarAdocao").value(false));
    }

    @Test
    void soQuemAdotouContaEUmaVezSo() throws Exception {
        Conta abrigo = abrigo();
        Conta ana = usuario("Ana Souza");
        Conta bruno = usuario("Bruno Lima");
        String animal = animal(abrigo);
        String pendente = interesse(animal, bruno);
        String aprovado = adotar(animal, ana, abrigo);

        mvc.perform(post("/api/interesses/" + aprovado + "/depoimento").contentType(MediaType.APPLICATION_JSON)
                .content(depoimento("Sem login não dá.").toString())).andExpect(status().isUnauthorized());
        mvc.perform(escrever(aprovado, bruno, depoimento("Não fui eu que adotei.")))
                .andExpect(status().isForbidden());
        mvc.perform(escrever(aprovado, abrigo, depoimento("Abrigo não adota pelo site.")))
                .andExpect(status().isForbidden());
        // O interesse do Bruno foi descontinuado quando a Ana foi aprovada
        mvc.perform(escrever(pendente, bruno, depoimento("Ainda não adotei.")))
                .andExpect(status().isConflict())
                .andExpect(jsonPath("$.mensagem").value("Só dá pra contar como foi depois que a adoção é aprovada"));
        mvc.perform(escrever(UUID.randomUUID().toString(), ana, depoimento("Interesse que não existe.")))
                .andExpect(status().isNotFound());

        criado(escrever(aprovado, ana, depoimento("Primeira vez contando.")));
        mvc.perform(escrever(aprovado, ana, depoimento("Segunda vez contando.")))
                .andExpect(status().isConflict())
                .andExpect(jsonPath("$.mensagem").value("Você já contou como foi essa adoção"));
        assertThat(depoimentos.count()).isEqualTo(1);
    }

    @Test
    void depoisDaDevolucaoAAdocaoNaoEMaisAAtual() throws Exception {
        Conta abrigo = abrigo();
        Conta ana = usuario("Ana Souza");
        String animal = animal(abrigo);
        String interesse = adotar(animal, ana, abrigo);
        // Devolução (UC05 FA04): o animal volta pra vitrine, e o interesse continua aprovado no histórico
        jdbc.update("update animal set status_adocao = 'DISPONIVEL' where id = ?", UUID.fromString(animal));

        mvc.perform(escrever(interesse, ana, depoimento("O animal voltou pro abrigo.")))
                .andExpect(status().isConflict());
        mvc.perform(auth(get("/api/interesses/meus"), ana))
                .andExpect(jsonPath("$[0].podeContarAdocao").value(false));
    }

    @Test
    void textoAutorizacaoEFotoSaoConferidos() throws Exception {
        Conta abrigo = abrigo();
        Conta ana = usuario("Ana Souza");
        String interesse = adotar(animal(abrigo), ana, abrigo);

        mvc.perform(escrever(interesse, ana, depoimento("   "))).andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.campos.texto").isNotEmpty());
        mvc.perform(escrever(interesse, ana, depoimento("a".repeat(1001)))).andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.campos.texto").value("O depoimento deve ter de 10 a 1000 caracteres"));
        mvc.perform(escrever(interesse, ana, depoimento("Sem autorizar o mural.").put("autorizaPublicacao", false)))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.campos.autorizaPublicacao").value("Autorize a publicação no mural para enviar"));
        // Foto de outro site não entra no mural
        mvc.perform(escrever(interesse, ana, depoimento("Foto de fora do site.")
                        .put("fotoUrl", "https://example.com/qualquer.jpg")))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.mensagem").value("Envie a foto pelo próprio site"));

        String foto = enviarFoto(ana);
        JsonNode escrito = criado(escrever(interesse, ana, depoimento("Com a foto da Mel no sofá.").put("fotoUrl", foto)));
        assertThat(escrito.path("fotoUrl").asText()).isEqualTo(foto);
        assertThat(depoimentos.count()).isEqualTo(1);
    }

    @Test
    void quemEscreveuApagaEAFotoSaiDoArmazenamento() throws Exception {
        Conta abrigo = abrigo();
        Conta ana = usuario("Ana Souza");
        Conta bruno = usuario("Bruno Lima");
        String interesse = adotar(animal(abrigo), ana, abrigo);
        String foto = enviarFoto(ana);
        String id = criado(escrever(interesse, ana, depoimento("Vou apagar depois.").put("fotoUrl", foto)))
                .path("id").asText();

        mvc.perform(auth(delete("/api/depoimentos/" + id), bruno)).andExpect(status().isForbidden());
        mvc.perform(auth(delete("/api/depoimentos/" + UUID.randomUUID()), ana)).andExpect(status().isNotFound());
        mvc.perform(auth(delete("/api/depoimentos/" + id), ana)).andExpect(status().isNoContent());

        mvc.perform(get("/api/depoimentos")).andExpect(jsonPath("$.totalItens").value(0));
        assertThat(armazenamento.contem(chave(foto))).isFalse();
        // Ainda no prazo: dá pra contar de novo
        mvc.perform(auth(get("/api/interesses/meus"), ana))
                .andExpect(jsonPath("$[0].podeContarAdocao").value(true));
    }

    @Test
    void removerOAnimalApagaODepoimentoEAFotoDele() throws Exception {
        Conta abrigo = abrigo();
        Conta ana = usuario("Ana Souza");
        String animal = animal(abrigo);
        String interesse = adotar(animal, ana, abrigo);
        String foto = enviarFoto(ana);
        criado(escrever(interesse, ana, depoimento("O protetor vai remover.").put("fotoUrl", foto)));

        mvc.perform(auth(delete("/api/animais/" + animal), abrigo)).andExpect(status().isNoContent());

        assertThat(depoimentos.count()).isZero();
        assertThat(armazenamento.contem(chave(foto))).isFalse();
    }

    @Test
    void muralVemEmPaginasDoMaisNovoProMaisAntigo() throws Exception {
        Conta abrigo = abrigo();
        Conta ana = usuario("Ana Souza");
        Conta bruno = usuario("Bruno Lima");
        String primeiro = criado(escrever(adotar(animal(abrigo), ana, abrigo), ana, depoimento("História da Ana.")))
                .path("id").asText();
        String segundo = criado(escrever(adotar(animal(abrigo), bruno, abrigo), bruno, depoimento("História do Bruno.")))
                .path("id").asText();
        jdbc.update("update depoimento set data_hora = ? where id = ?",
                Timestamp.valueOf(LocalDateTime.now().minusDays(1)), UUID.fromString(primeiro));

        mvc.perform(get("/api/depoimentos").param("tamanho", "1"))
                .andExpect(jsonPath("$.itens[0].id").value(segundo))
                .andExpect(jsonPath("$.totalItens").value(2))
                .andExpect(jsonPath("$.totalPaginas").value(2));
        mvc.perform(get("/api/depoimentos").param("tamanho", "1").param("pagina", "1"))
                .andExpect(jsonPath("$.itens[0].id").value(primeiro));
        mvc.perform(get("/api/depoimentos").param("tamanho", "100")).andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.campos.tamanho").isNotEmpty());
    }

    // ---------- ajudantes ----------

    private ObjectNode depoimento(String texto) {
        ObjectNode corpo = mapper.createObjectNode();
        corpo.put("texto", texto);
        corpo.put("autorizaPublicacao", true);
        return corpo;
    }

    private MockHttpServletRequestBuilder escrever(String interesseId, Conta conta, ObjectNode corpo) {
        return auth(post("/api/interesses/" + interesseId + "/depoimento"), conta)
                .contentType(MediaType.APPLICATION_JSON).content(corpo.toString());
    }

    private JsonNode criado(MockHttpServletRequestBuilder requisicao) throws Exception {
        return mapper.readTree(mvc.perform(requisicao).andExpect(status().isCreated())
                .andReturn().getResponse().getContentAsString());
    }

    // A pessoa demonstra interesse e o protetor aprova pelo PATCH, como no painel
    private String adotar(String animalId, Conta candidata, Conta protetor) throws Exception {
        String interesse = interesse(animalId, candidata);
        mvc.perform(auth(patch("/api/interesses/" + interesse + "/status"), protetor)
                        .contentType(MediaType.APPLICATION_JSON).content("{\"statusAndamento\":\"APROVADO\"}"))
                .andExpect(status().isOk());
        return interesse;
    }

    private String interesse(String animalId, Conta candidata) throws Exception {
        String corpo = """
                {"aceiteTermo":true,
                 "triagem":{"moradia":"CASA_COM_QUINTAL","criancas":"NAO","tempoSozinho":"ATE_4_HORAS",
                            "outrosAnimais":"PREFIRO_RESPONDER_DIRETAMENTE_AO_PROTETOR",
                            "programacaoViagem":"LEVO_O_ANIMAL_COMIGO","momentoContato":"NOITE"}}
                """;
        return mapper.readTree(mvc.perform(auth(post("/api/animais/" + animalId + "/interesses"), candidata)
                        .contentType(MediaType.APPLICATION_JSON).content(corpo))
                .andExpect(status().isCreated()).andReturn().getResponse().getContentAsString()).path("id").asText();
    }

    private String animal(Conta protetor) throws Exception {
        String corpo = """
                {"nome":"Mel","especie":"CAO","raca":"SRD_CAO","sexo":"FEMEA","porte":"MEDIO","peso":12.5,
                 "dataNascEstimada":"2020-01-01","castrado":true,"energia":"MAIS_CALMO",
                 "convivencia":{"crianca":"NAO_TESTADO","gato":"CONVIVE_BEM","cao":"NAO_CONVIVE_BEM"},
                 "historia":"Resgatada","fotos":["https://example.com/mel.jpg"]}
                """;
        return mapper.readTree(mvc.perform(auth(post("/api/animais"), protetor)
                        .contentType(MediaType.APPLICATION_JSON).content(corpo))
                .andExpect(status().isCreated()).andReturn().getResponse().getContentAsString()).path("id").asText();
    }

    private String enviarFoto(Conta conta) throws Exception {
        MockMultipartFile arquivo = new MockMultipartFile("arquivo", "foto.jpg", "image/jpeg", JPEG);
        return mapper.readTree(mvc.perform(auth(multipart("/api/fotos").file(arquivo), conta))
                .andExpect(status().isCreated()).andReturn().getResponse().getContentAsString()).path("url").asText();
    }

    private static String chave(String url) {
        return url.substring(url.indexOf("animais/"));
    }

    private MockHttpServletRequestBuilder auth(MockHttpServletRequestBuilder request, Conta conta) {
        return request.header("Authorization", "Bearer " + conta.token());
    }

    private Conta usuario(String nome) {
        int numero = ++sequencia;
        Usuario usuario = new Usuario();
        usuario.setCpf(String.format("%011d", numero));
        usuario.setNome(nome);
        usuario.setEmail("depoimento" + numero + "@example.com");
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
        abrigo.setEmail("depoimento-abrigo" + numero + "@example.com");
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
