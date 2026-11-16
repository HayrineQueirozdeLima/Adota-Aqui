package com.adotaaqui;

import com.adotaaqui.model.Abrigo;
import com.adotaaqui.model.Endereco;
import com.adotaaqui.model.Usuario;
import com.adotaaqui.model.enums.TipoConta;
import com.adotaaqui.repository.AbrigoRepository;
import com.adotaaqui.repository.AnimalRepository;
import com.adotaaqui.repository.UsuarioRepository;
import com.adotaaqui.security.JwtService;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.http.MediaType;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.request.MockHttpServletRequestBuilder;

import java.time.Instant;
import java.util.UUID;

import static org.hamcrest.Matchers.nullValue;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.patch;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.put;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

// Devolução (UC05 FA04) no histórico: o protetor volta o animal pra Disponível, e o interesse que tinha
// sido aprovado aparece como devolvido no painel dele e nas candidaturas de quem adotou.
// O status continua APROVADO (a adoção aconteceu, RF06): o que muda é o devolvido e a data
@SpringBootTest
@AutoConfigureMockMvc
class DevolucaoIntegrationTest {
    @Autowired MockMvc mvc;
    @Autowired ObjectMapper mapper;
    @Autowired AnimalRepository animais;
    @Autowired UsuarioRepository usuarios;
    @Autowired AbrigoRepository abrigos;
    @Autowired JwtService jwt;
    @Autowired JdbcTemplate jdbc;
    private int sequencia;

    private record Conta(UUID id, String token) {}

    private static final String ANIMAL = """
            {"nome":"Duque","especie":"CAO","raca":"SRD_CAO","sexo":"MACHO","porte":"GRANDE","peso":30.0,
             "dataNascEstimada":"2019-01-01","castrado":true,"energia":"MAIS_ANIMADO",
             "convivencia":{"crianca":"NAO_TESTADO","gato":"NAO_TESTADO","cao":"CONVIVE_BEM"},
             "historia":"Resgatado","fotos":["https://example.com/duque.jpg"]%s}
            """;

    @BeforeEach
    @AfterEach
    void limpar() {
        animais.deleteAll();
        usuarios.deleteAll();
        abrigos.deleteAll();
        sequencia = 0;
    }

    @Test
    void aAdocaoAtualNaoEDevolvida() throws Exception {
        Conta abrigo = abrigo();
        Conta rafael = usuario("Rafael Teixeira");
        adotar(animal(abrigo), rafael, abrigo);

        mvc.perform(auth(get("/api/interesses/recebidos"), abrigo))
                .andExpect(jsonPath("$[0].statusAndamento").value("APROVADO"))
                .andExpect(jsonPath("$[0].devolvido").value(false))
                .andExpect(jsonPath("$[0].devolvidoEm").value(nullValue()));
    }

    @Test
    void depoisDaDevolucaoOInteresseApareceDevolvidoNosDoisPaineisEDaPraTentarDeNovo() throws Exception {
        Conta abrigo = abrigo();
        Conta rafael = usuario("Rafael Teixeira");
        String animal = animal(abrigo);
        adotar(animal, rafael, abrigo);

        devolver(animal, abrigo);

        mvc.perform(auth(get("/api/interesses/recebidos"), abrigo))
                .andExpect(jsonPath("$[0].statusAndamento").value("APROVADO"))
                .andExpect(jsonPath("$[0].devolvido").value(true))
                .andExpect(jsonPath("$[0].devolvidoEm").isNotEmpty())
                .andExpect(jsonPath("$[0].animal.statusAdocao").value("DISPONIVEL"));
        mvc.perform(auth(get("/api/interesses/meus"), rafael))
                .andExpect(jsonPath("$[0].devolvido").value(true))
                .andExpect(jsonPath("$[0].devolvidoEm").isNotEmpty())
                .andExpect(jsonPath("$[0].podeContarAdocao").value(false));
        // O animal está na vitrine de novo, e quem devolveu pode demonstrar interesse outra vez
        interesse(animal, rafael);
    }

    @Test
    void numaNovaAdocaoSoAAntigaFicaDevolvida() throws Exception {
        Conta abrigo = abrigo();
        Conta rafael = usuario("Rafael Teixeira");
        Conta camila = usuario("Camila Rocha");
        String animal = animal(abrigo);
        String primeira = adotar(animal, rafael, abrigo);
        devolver(animal, abrigo);
        String segunda = adotar(animal, camila, abrigo);

        mvc.perform(auth(get("/api/interesses/recebidos"), abrigo))
                .andExpect(jsonPath("$[?(@.id == '%s')].devolvido".formatted(primeira)).value(true))
                .andExpect(jsonPath("$[?(@.id == '%s')].devolvido".formatted(segunda)).value(false));
    }

    @Test
    void devolucaoDeAntesDaDataTambemApareceSoQueSemData() throws Exception {
        Conta abrigo = abrigo();
        Conta rafael = usuario("Rafael Teixeira");
        String animal = animal(abrigo);
        adotar(animal, rafael, abrigo);
        // Como ficou o Duque no site: devolvido antes de existir a coluna devolvido_em
        jdbc.update("update animal set status_adocao = 'DISPONIVEL' where id = ?", UUID.fromString(animal));

        mvc.perform(auth(get("/api/interesses/recebidos"), abrigo))
                .andExpect(jsonPath("$[0].devolvido").value(true))
                .andExpect(jsonPath("$[0].devolvidoEm").value(nullValue()));
    }

    private void devolver(String animalId, Conta protetor) throws Exception {
        mvc.perform(auth(put("/api/animais/" + animalId), protetor).contentType(MediaType.APPLICATION_JSON)
                        .content(ANIMAL.formatted(",\"statusAdocao\":\"DISPONIVEL\"")))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.statusAdocao").value("DISPONIVEL"));
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
        return mapper.readTree(mvc.perform(auth(post("/api/animais"), protetor)
                        .contentType(MediaType.APPLICATION_JSON).content(ANIMAL.formatted("")))
                .andExpect(status().isCreated()).andReturn().getResponse().getContentAsString()).path("id").asText();
    }

    private MockHttpServletRequestBuilder auth(MockHttpServletRequestBuilder request, Conta conta) {
        return request.header("Authorization", "Bearer " + conta.token());
    }

    private Conta usuario(String nome) {
        int numero = ++sequencia;
        Usuario usuario = new Usuario();
        usuario.setCpf(String.format("%011d", numero));
        usuario.setNome(nome);
        usuario.setEmail("devolucao" + numero + "@example.com");
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
        abrigo.setEmail("devolucao-abrigo" + numero + "@example.com");
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
