package com.adotaaqui;

import com.adotaaqui.model.Abrigo;
import com.adotaaqui.model.Endereco;
import com.adotaaqui.model.Interesse;
import com.adotaaqui.model.Usuario;
import com.adotaaqui.model.enums.StatusAdocao;
import com.adotaaqui.model.enums.StatusInteresse;
import com.adotaaqui.model.enums.TipoConta;
import com.adotaaqui.repository.AbrigoRepository;
import com.adotaaqui.repository.AnimalRepository;
import com.adotaaqui.repository.InteresseRepository;
import com.adotaaqui.repository.UsuarioRepository;
import com.adotaaqui.security.JwtService;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.fasterxml.jackson.databind.node.ObjectNode;
import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.params.ParameterizedTest;
import org.junit.jupiter.params.provider.EnumSource;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.http.MediaType;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.request.MockHttpServletRequestBuilder;
import org.springframework.transaction.support.TransactionTemplate;

import java.time.Instant;
import java.util.UUID;

import static org.assertj.core.api.Assertions.assertThat;
import static org.hamcrest.Matchers.containsString;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.delete;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

// Issue #30: demonstrar interesse (POST /api/animais/{id}/interesses) e desistir (DELETE /api/interesses/{id})
// Cada regra da tabela de erros do docs/api.md (seção 9) tem um teste aqui
@SpringBootTest
@AutoConfigureMockMvc
class InteresseIntegrationTest {
    @Autowired MockMvc mvc;
    @Autowired ObjectMapper mapper;
    @Autowired AnimalRepository animais;
    @Autowired UsuarioRepository usuarios;
    @Autowired AbrigoRepository abrigos;
    @Autowired InteresseRepository interesses;
    @Autowired JwtService jwt;
    @Autowired TransactionTemplate transacao;
    private int sequencia;

    private record Conta(UUID id, String token) {}

    @BeforeEach
    @AfterEach
    void limpar() {
        animais.deleteAll(); // apaga junto as vacinas, as fotos e os interesses de cada animal (cascade)
        usuarios.deleteAll();
        abrigos.deleteAll();
        sequencia = 0;
    }

    // ---------- demonstrar interesse ----------

    @Test
    void registraOInteresseEDevolveOContatoDoProtetor() throws Exception {
        Conta protetora = usuario("RO");
        Conta candidata = usuario("RO");
        String animal = animal(protetora);

        mvc.perform(demonstrar(animal, candidata, corpo()))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.id").exists())
                .andExpect(jsonPath("$.statusAndamento").value("PENDENTE"))
                .andExpect(jsonPath("$.animal.id").value(animal))
                .andExpect(jsonPath("$.animal.nome").value("Mel"))
                .andExpect(jsonPath("$.animal.fotoCapa").value("https://example.com/mel.jpg"))
                .andExpect(jsonPath("$.triagem.moradia").value("CASA_COM_QUINTAL"))
                .andExpect(jsonPath("$.triagem.outrosAnimais").value("PREFIRO_RESPONDER_DIRETAMENTE_AO_PROTETOR"))
                .andExpect(jsonPath("$.triagem.momentoContato").value("NOITE"))
                .andExpect(jsonPath("$.contatoProtetor.nome").value("Usuario 1"))
                .andExpect(jsonPath("$.contatoProtetor.telefone").value("69999998888"))
                .andExpect(jsonPath("$.contatoProtetor.email").value("usuario1@example.com"));

        // O perfil do animal passa a mostrar o interesse e não oferece outro
        mvc.perform(auth(get("/api/animais/" + animal), candidata))
                .andExpect(jsonPath("$.meuInteresse.statusAndamento").value("PENDENTE"))
                .andExpect(jsonPath("$.podeDemonstrarInteresse").value(false));
        assertThat(interesses.count()).isEqualTo(1);
    }

    @Test
    void quandoOProtetorEUmAbrigoOContatoEDoAbrigo() throws Exception {
        String animal = animal(abrigo("RO"));

        mvc.perform(demonstrar(animal, usuario("RO"), corpo()))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.contatoProtetor.nome").value("Abrigo 1"))
                .andExpect(jsonPath("$.contatoProtetor.email").value("abrigo1@example.com"));
    }

    @Test
    void exigeOAceiteDoTermo() throws Exception {
        String animal = animal(usuario("RO"));
        Conta candidata = usuario("RO");

        ObjectNode recusado = corpo().put("aceiteTermo", false);
        mvc.perform(demonstrar(animal, candidata, recusado))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.campos.aceiteTermo").exists());

        ObjectNode semAceite = corpo();
        semAceite.remove("aceiteTermo");
        mvc.perform(demonstrar(animal, candidata, semAceite)).andExpect(status().isBadRequest());
        assertThat(interesses.count()).isZero();
    }

    @Test
    void exigeTodasAsRespostasDaTriagem() throws Exception {
        ObjectNode semMoradia = corpo();
        ((ObjectNode) semMoradia.get("triagem")).remove("moradia");

        mvc.perform(demonstrar(animal(usuario("RO")), usuario("RO"), semMoradia))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.campos['triagem.moradia']").exists());
    }

    @Test
    void oMomentoDeContatoNaoAceitaResponderDepois() throws Exception {
        ObjectNode corpo = corpo();
        ((ObjectNode) corpo.get("triagem")).put("momentoContato", "PREFIRO_RESPONDER_DIRETAMENTE_AO_PROTETOR");

        mvc.perform(demonstrar(animal(usuario("RO")), usuario("RO"), corpo)).andExpect(status().isBadRequest());
    }

    @Test
    void semLoginRecebe401() throws Exception {
        String animal = animal(usuario("RO"));

        mvc.perform(post("/api/animais/" + animal + "/interesses")
                        .contentType(MediaType.APPLICATION_JSON).content(corpo().toString()))
                .andExpect(status().isUnauthorized());
    }

    @Test
    void abrigoNaoDemonstraInteresse() throws Exception {
        String animal = animal(usuario("RO"));

        mvc.perform(demonstrar(animal, abrigo("RO"), corpo()))
                .andExpect(status().isForbidden())
                .andExpect(jsonPath("$.mensagem", containsString("abrigo")));
    }

    @Test
    void oProtetorNaoDemonstraInteresseNoProprioAnimal() throws Exception {
        Conta protetora = usuario("RO");

        mvc.perform(demonstrar(animal(protetora), protetora, corpo()))
                .andExpect(status().isForbidden())
                .andExpect(jsonPath("$.mensagem", containsString("cadastrou")));
    }

    @Test
    void soDemonstraInteresseEmAnimalDoMesmoEstado() throws Exception {
        String animal = animal(usuario("RO"));

        mvc.perform(demonstrar(animal, usuario("SP"), corpo()))
                .andExpect(status().isForbidden())
                .andExpect(jsonPath("$.mensagem", containsString("seu estado")));
    }

    @Test
    void animalQueNaoExisteRecebe404() throws Exception {
        mvc.perform(demonstrar(UUID.randomUUID().toString(), usuario("RO"), corpo()))
                .andExpect(status().isNotFound());
    }

    @Test
    void animalAdotadoNaoRecebeInteresse() throws Exception {
        String animal = animal(usuario("RO"));
        transacao.executeWithoutResult(s ->
                animais.findById(UUID.fromString(animal)).orElseThrow().setStatusAdocao(StatusAdocao.ADOTADO));

        mvc.perform(demonstrar(animal, usuario("RO"), corpo())).andExpect(status().isConflict());
    }

    @Test
    void naoDeixaDoisInteressesEmAndamentoNoMesmoAnimal() throws Exception {
        String animal = animal(usuario("RO"));
        Conta candidata = usuario("RO");
        String primeiro = interesse(animal, candidata);

        mvc.perform(demonstrar(animal, candidata, corpo())).andExpect(status().isConflict());

        // Depois que o primeiro é descontinuado, dá pra tentar de novo
        mudarStatus(primeiro, StatusInteresse.DESCONTINUADO);
        mvc.perform(demonstrar(animal, candidata, corpo())).andExpect(status().isCreated());
    }

    // ---------- desistir (UC07 FA01) ----------

    @Test
    void oCandidatoDesisteEOInteresseEApagado() throws Exception {
        String animal = animal(usuario("RO"));
        Conta candidata = usuario("RO");
        String interesse = interesse(animal, candidata);

        mvc.perform(auth(delete("/api/interesses/" + interesse), candidata)).andExpect(status().isNoContent());

        assertThat(interesses.count()).isZero();
        mvc.perform(auth(get("/api/animais/" + animal), candidata))
                .andExpect(jsonPath("$.meuInteresse").doesNotExist())
                .andExpect(jsonPath("$.podeDemonstrarInteresse").value(true));
    }

    @Test
    void soQuemDemonstrouOInteressePodeDesistir() throws Exception {
        String animal = animal(usuario("RO"));
        String interesse = interesse(animal, usuario("RO"));

        mvc.perform(auth(delete("/api/interesses/" + interesse), usuario("RO")))
                .andExpect(status().isForbidden())
                .andExpect(jsonPath("$.mensagem", containsString("Somente quem demonstrou o interesse")));
        mvc.perform(auth(delete("/api/interesses/" + interesse), abrigo("RO"))).andExpect(status().isForbidden());
        assertThat(interesses.count()).isEqualTo(1);
    }

    @Test
    void desistirDeInteresseQueNaoExisteRecebe404() throws Exception {
        mvc.perform(auth(delete("/api/interesses/" + UUID.randomUUID()), usuario("RO")))
                .andExpect(status().isNotFound());
    }

    @ParameterizedTest
    @EnumSource(value = StatusInteresse.class, names = {"APROVADO", "DESCONTINUADO"})
    void interesseFinalizadoFicaNoHistorico(StatusInteresse finalizado) throws Exception {
        String animal = animal(usuario("RO"));
        Conta candidata = usuario("RO");
        String interesse = interesse(animal, candidata);
        mudarStatus(interesse, finalizado);

        mvc.perform(auth(delete("/api/interesses/" + interesse), candidata))
                .andExpect(status().isConflict())
                .andExpect(jsonPath("$.mensagem", containsString("pendente ou em contato")));
        assertThat(interesses.count()).isEqualTo(1);
    }

    @Test
    void desistirSemLoginRecebe401() throws Exception {
        String interesse = interesse(animal(usuario("RO")), usuario("RO"));

        mvc.perform(delete("/api/interesses/" + interesse)).andExpect(status().isUnauthorized());
    }

    // ---------- ajudantes ----------

    private MockHttpServletRequestBuilder auth(MockHttpServletRequestBuilder request, Conta conta) {
        return request.header("Authorization", "Bearer " + conta.token());
    }

    private MockHttpServletRequestBuilder demonstrar(String animalId, Conta conta, ObjectNode corpo) {
        return auth(post("/api/animais/" + animalId + "/interesses"), conta)
                .contentType(MediaType.APPLICATION_JSON).content(corpo.toString());
    }

    // Cria o interesse pela própria API e devolve o id
    private String interesse(String animalId, Conta candidata) throws Exception {
        String resposta = mvc.perform(demonstrar(animalId, candidata, corpo()))
                .andExpect(status().isCreated())
                .andReturn().getResponse().getContentAsString();
        return mapper.readTree(resposta).path("id").asText();
    }

    // Simula o que o protetor faz na #31 (aprovar ou descontinuar)
    private void mudarStatus(String interesseId, StatusInteresse status) {
        transacao.executeWithoutResult(s -> {
            Interesse interesse = interesses.findById(UUID.fromString(interesseId)).orElseThrow();
            if (status == StatusInteresse.DESCONTINUADO) {
                interesse.setMotivoDescontinuacao("Outro candidato foi aprovado");
            }
            interesse.setStatusAndamento(status);
        });
    }

    // Cadastra um animal (o mesmo corpo dos testes do AnimalIntegrationTest) e devolve o id
    private String animal(Conta protetor) throws Exception {
        String corpo = """
                {"nome":"Mel","especie":"CAO","raca":"SRD_CAO","sexo":"FEMEA","porte":"MEDIO","peso":12.5,
                 "dataNascEstimada":"2020-01-01","castrado":true,"energia":"MAIS_CALMO",
                 "convivencia":{"crianca":"NAO_TESTADO","gato":"CONVIVE_BEM","cao":"NAO_CONVIVE_BEM"},
                 "historia":"Resgatada","fotos":["https://example.com/mel.jpg"],
                 "vacinas":[{"nome":"V10","dose":1,"dataAplicacao":"2024-01-01"}]}
                """;
        String resposta = mvc.perform(auth(post("/api/animais"), protetor)
                        .contentType(MediaType.APPLICATION_JSON).content(corpo))
                .andExpect(status().isCreated())
                .andReturn().getResponse().getContentAsString();
        return mapper.readTree(resposta).path("id").asText();
    }

    private ObjectNode corpo() throws Exception {
        return (ObjectNode) mapper.readTree("""
                {"aceiteTermo":true,
                 "triagem":{"moradia":"CASA_COM_QUINTAL","criancas":"NAO","tempoSozinho":"ATE_4_HORAS",
                            "outrosAnimais":"PREFIRO_RESPONDER_DIRETAMENTE_AO_PROTETOR",
                            "programacaoViagem":"LEVO_O_ANIMAL_COMIGO","momentoContato":"NOITE"}}
                """);
    }

    private Conta usuario(String estado) {
        int numero = ++sequencia;
        Usuario usuario = new Usuario();
        usuario.setCpf(String.format("%011d", numero));
        usuario.setNome("Usuario " + numero);
        usuario.setEmail("usuario" + numero + "@example.com");
        usuario.setTelefone("69999998888");
        usuario.setSenha("hash-de-fixture");
        usuario.setEndereco(endereco(estado));
        UUID id = usuarios.saveAndFlush(usuario).getId();
        return new Conta(id, jwt.gerarToken(id, TipoConta.USUARIO, Instant.now().plusSeconds(600)));
    }

    private Conta abrigo(String estado) {
        int numero = ++sequencia;
        Abrigo abrigo = new Abrigo();
        abrigo.setCnpj(String.format("%014d", numero));
        abrigo.setNome("Abrigo " + numero);
        abrigo.setRazaoSocial("Abrigo " + numero);
        abrigo.setEmail("abrigo" + numero + "@example.com");
        abrigo.setTelefone("6932221111");
        abrigo.setSenha("hash-de-fixture");
        abrigo.setEndereco(endereco(estado));
        UUID id = abrigos.saveAndFlush(abrigo).getId();
        return new Conta(id, jwt.gerarToken(id, TipoConta.ABRIGO, Instant.now().plusSeconds(600)));
    }

    private static Endereco endereco(String estado) {
        Endereco endereco = new Endereco();
        endereco.setCep("76801000");
        endereco.setEstado(estado);
        endereco.setCidade(estado.equals("RO") ? "Porto Velho" : "São Paulo");
        endereco.setNumero("1");
        return endereco;
    }
}