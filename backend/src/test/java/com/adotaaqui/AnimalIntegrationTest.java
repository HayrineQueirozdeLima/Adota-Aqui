package com.adotaaqui;

import com.adotaaqui.model.Abrigo;
import com.adotaaqui.model.Endereco;
import com.adotaaqui.model.Interesse;
import com.adotaaqui.model.Usuario;
import com.adotaaqui.model.enums.ConvivenciaAnimal;
import com.adotaaqui.model.enums.ConvivenciaCrianca;
import com.adotaaqui.model.enums.MomentoContato;
import com.adotaaqui.model.enums.ProgramacaoViagem;
import com.adotaaqui.model.enums.StatusAdocao;
import com.adotaaqui.model.enums.StatusInteresse;
import com.adotaaqui.model.enums.TempoSozinho;
import com.adotaaqui.model.enums.TipoConta;
import com.adotaaqui.model.enums.TipoMoradia;
import com.adotaaqui.repository.AbrigoRepository;
import com.adotaaqui.repository.AnimalRepository;
import com.adotaaqui.repository.InteresseRepository;
import com.adotaaqui.repository.UsuarioRepository;
import com.adotaaqui.security.JwtService;
import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.fasterxml.jackson.databind.node.ObjectNode;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.params.ParameterizedTest;
import org.junit.jupiter.params.provider.ValueSource;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.http.MediaType;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.request.MockHttpServletRequestBuilder;
import org.springframework.transaction.support.TransactionTemplate;

import java.time.Instant;
import java.time.LocalDate;
import java.util.UUID;

import static org.assertj.core.api.Assertions.assertThat;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

@SpringBootTest
@AutoConfigureMockMvc
class AnimalIntegrationTest {
    @Autowired MockMvc mvc;
    @Autowired ObjectMapper mapper;
    @Autowired AnimalRepository animais;
    @Autowired UsuarioRepository usuarios;
    @Autowired AbrigoRepository abrigos;
    @Autowired InteresseRepository interesses;
    @Autowired JwtService jwt;
    @Autowired JdbcTemplate jdbc;
    @Autowired TransactionTemplate transacao;
    private int sequencia;

    private record Conta(UUID id, String token, boolean abrigo) {}

    @BeforeEach
    @AfterEach
    void limpar() {
        animais.deleteAll();
        usuarios.deleteAll();
        abrigos.deleteAll();
        sequencia = 0;
    }

    @ParameterizedTest
    @ValueSource(booleans = {false, true})
    void cadastraComProtetorDoTokenEListaSomenteSeusAnimais(boolean abrigo) throws Exception {
        Conta dono = conta(abrigo, "RO");
        Conta outro = conta(abrigo, "RO");
        ObjectNode corpo = corpo();
        corpo.put("usuarioId", outro.id().toString());
        corpo.put("abrigoId", outro.id().toString());
        corpo.put("statusAdocao", "ADOTADO");
        JsonNode criado = criar(dono, corpo);
        assertThat(criado.path("statusAdocao").asText()).isEqualTo("DISPONIVEL");
        assertThat(criado.path("ehMeu").asBoolean()).isTrue();
        assertThat(criado.path("podeDemonstrarInteresse").asBoolean()).isFalse();
        assertThat(criado.path("protetor").has("telefone")).isFalse();
        assertThat(criado.path("protetor").has("email")).isFalse();
        UUID id = UUID.fromString(criado.path("id").asText());
        assertThat(jdbc.queryForObject("select " + (abrigo ? "abrigo_id" : "usuario_id") +
                " from animal where id = ?", UUID.class, id)).isEqualTo(dono.id());
        assertThat(jdbc.queryForObject("select " + (abrigo ? "usuario_id" : "abrigo_id") +
                " from animal where id = ?", UUID.class, id)).isNull();
        mvc.perform(auth(get("/api/animais/meus"), dono)).andExpect(status().isOk())
                .andExpect(jsonPath("$.length()").value(1));
        mvc.perform(auth(get("/api/animais/meus"), outro)).andExpect(status().isOk())
                .andExpect(content().json("[]"));
    }

    @Test
    void listagemAplicaEstadoStatusEFiltrosCombinados() throws Exception {
        Conta ro = conta(false, "RO");
        Conta sp = conta(true, "SP");
        String id = criar(ro, corpo()).path("id").asText();
        criar(sp, corpo());
        String adotado = criar(ro, corpo()).path("id").asText();
        adotar(adotado);
        mvc.perform(get("/api/animais")).andExpect(status().isOk()).andExpect(jsonPath("$.length()").value(2));
        mvc.perform(auth(get("/api/animais"), ro)).andExpect(jsonPath("$.length()").value(1))
                .andExpect(jsonPath("$[0].id").value(id));
        mvc.perform(auth(get("/api/animais"), sp)).andExpect(jsonPath("$.length()").value(2));
        mvc.perform(auth(get("/api/animais/meus"), ro)).andExpect(jsonPath("$.length()").value(2));
        mvc.perform(get("/api/animais").param("cidade", "porto velho").param("especie", "CAO")
                        .param("raca", "SRD_CAO").param("porte", "MEDIO").param("sexo", "FEMEA")
                        .param("energia", "MAIS_CALMO").param("convivenciaCrianca", "NAO_TESTADO")
                        .param("convivenciaGato", "CONVIVE_BEM").param("convivenciaCao", "NAO_CONVIVE_BEM"))
                .andExpect(status().isOk()).andExpect(jsonPath("$.length()").value(1));
        mvc.perform(get("/api/animais").param("especie", "GATO")).andExpect(content().json("[]"));
        mvc.perform(get("/api/animais").param("cidade", "Inexistente")).andExpect(content().json("[]"));
        mvc.perform(auth(get("/api/animais").param("cidade", "São Paulo").param("estado", "SP"), ro))
                .andExpect(content().json("[]"));
    }

    @ParameterizedTest
    @ValueSource(booleans = {false, true})
    void donoEditaEAtualizacaoSubstituiFotosEVacinas(boolean abrigo) throws Exception {
        Conta dono = conta(abrigo, "RO");
        JsonNode criado = criar(dono, corpo());
        String id = criado.path("id").asText();
        String vacinaAntiga = criado.path("vacinas").get(0).path("id").asText();
        ObjectNode alterado = corpo();
        alterado.put("statusAdocao", "DISPONIVEL");
        alterado.put("nome", "Novo nome");
        alterado.putArray("fotos").add("https://example.com/segunda.jpg").add("https://example.com/primeira.jpg");
        alterado.putArray("vacinas").addObject().put("nome", "Antirrábica").put("dose", 1);
        mvc.perform(auth(put("/api/animais/" + id), dono).contentType(MediaType.APPLICATION_JSON)
                        .content(alterado.toString()))
                .andExpect(status().isOk()).andExpect(jsonPath("$.nome").value("Novo nome"))
                .andExpect(jsonPath("$.fotos[0]").value("https://example.com/segunda.jpg"))
                .andExpect(jsonPath("$.vacinas[0].nome").value("Antirrábica"));
        assertThat(jdbc.queryForObject("select count(*) from vacina where id = ?", Long.class,
                UUID.fromString(vacinaAntiga))).isZero();
        alterado.remove("vacinas");
        mvc.perform(auth(put("/api/animais/" + id), dono).contentType(MediaType.APPLICATION_JSON)
                .content(alterado.toString())).andExpect(status().isOk()).andExpect(jsonPath("$.vacinas").isEmpty());
    }

    @ParameterizedTest
    @ValueSource(booleans = {false, true})
    void terceirosNaoPodemEditarOuRemover(boolean donoAbrigo) throws Exception {
        Conta dono = conta(donoAbrigo, "RO");
        String id = criar(dono, corpo()).path("id").asText();
        ObjectNode atualizacao = corpo().put("statusAdocao", "DISPONIVEL").put("nome", "Indevido");
        for (Conta outro : new Conta[]{conta(donoAbrigo, "RO"), conta(!donoAbrigo, "RO")}) {
            mvc.perform(auth(put("/api/animais/" + id), outro).contentType(MediaType.APPLICATION_JSON)
                    .content(atualizacao.toString())).andExpect(status().isForbidden());
            mvc.perform(auth(delete("/api/animais/" + id), outro)).andExpect(status().isForbidden());
        }
        mvc.perform(get("/api/animais/" + id)).andExpect(jsonPath("$.nome").value("Mel"));
    }

    @Test
    void adotadoSoMudaStatusEPreservaVacinasEHistorico() throws Exception {
        Conta dono = conta(false, "RO");
        Conta candidato = conta(false, "RO");
        JsonNode criado = criar(dono, corpo());
        String id = criado.path("id").asText();
        UUID interesse = interesse(id, candidato, StatusInteresse.APROVADO);
        adotar(id);
        mvc.perform(get("/api/animais/" + id)).andExpect(status().isNotFound());
        mvc.perform(auth(get("/api/animais/" + id), candidato)).andExpect(status().isNotFound());
        mvc.perform(auth(get("/api/animais/" + id), dono)).andExpect(status().isOk());
        for (String campo : new String[]{"nome", "fotos", "vacinas", "convivencia"}) {
            ObjectNode alterado = corpo().put("statusAdocao", "DISPONIVEL");
            if (campo.equals("nome")) alterado.put("nome", "Novo");
            if (campo.equals("fotos")) alterado.putArray("fotos").add("https://example.com/outra.jpg");
            if (campo.equals("vacinas")) alterado.putArray("vacinas");
            if (campo.equals("convivencia")) alterado.withObject("/convivencia").put("cao", "CONVIVE_BEM");
            mvc.perform(auth(put("/api/animais/" + id), dono).contentType(MediaType.APPLICATION_JSON)
                    .content(alterado.toString())).andExpect(status().isConflict());
        }
        assertThat(animais.findById(UUID.fromString(id)).orElseThrow().getStatusAdocao()).isEqualTo(StatusAdocao.ADOTADO);
        for (String estado : new String[]{"ADOTADO", "DISPONIVEL"}) {
            mvc.perform(auth(put("/api/animais/" + id), dono).contentType(MediaType.APPLICATION_JSON)
                            .content(corpo().put("statusAdocao", estado).toString()))
                    .andExpect(status().isOk()).andExpect(jsonPath("$.vacinas[0].id")
                            .value(criado.path("vacinas").get(0).path("id").asText()));
        }
        assertThat(interesses.findById(interesse).orElseThrow().getStatusAndamento()).isEqualTo(StatusInteresse.APROVADO);
        mvc.perform(auth(put("/api/animais/" + id), dono).contentType(MediaType.APPLICATION_JSON)
                        .content(corpo().put("statusAdocao", "DISPONIVEL").put("nome", "Agora pode").toString()))
                .andExpect(status().isOk()).andExpect(jsonPath("$.nome").value("Agora pode"));
    }

    @Test
    void naoPermiteAdotarPeloPutNemSalvarRacaIncompativel() throws Exception {
        Conta dono = conta(false, "RO");
        String id = criar(dono, corpo()).path("id").asText();
        mvc.perform(auth(put("/api/animais/" + id), dono).contentType(MediaType.APPLICATION_JSON)
                .content(corpo().put("statusAdocao", "ADOTADO").toString())).andExpect(status().isConflict());
        mvc.perform(auth(put("/api/animais/" + id), dono).contentType(MediaType.APPLICATION_JSON)
                .content(corpo().put("statusAdocao", "DISPONIVEL").put("raca", "SIAMES").toString()))
                .andExpect(status().isBadRequest());
        mvc.perform(get("/api/animais/" + id)).andExpect(jsonPath("$.raca").value("SRD_CAO"));
    }

    @ParameterizedTest
    @ValueSource(booleans = {false, true})
    void removerApagaDependentesMasPreservaContas(boolean abrigo) throws Exception {
        Conta dono = conta(abrigo, "RO");
        Conta candidato = conta(false, "RO");
        String id = criar(dono, corpo()).path("id").asText();
        interesse(id, candidato, StatusInteresse.PENDENTE);
        mvc.perform(auth(delete("/api/animais/" + id), dono)).andExpect(status().isNoContent());
        for (String tabela : new String[]{"animal", "animal_foto", "vacina", "interesse"}) {
            assertThat(jdbc.queryForObject("select count(*) from " + tabela, Long.class)).isZero();
        }
        assertThat(usuarios.existsById(candidato.id())).isTrue();
        assertThat(abrigo ? abrigos.existsById(dono.id()) : usuarios.existsById(dono.id())).isTrue();
    }

    @Test
    void perfilCalculaPermissoesEInteresseAtivo() throws Exception {
        Conta dono = conta(false, "RO");
        Conta candidato = conta(false, "RO");
        Conta outroEstado = conta(false, "SP");
        Conta abrigo = conta(true, "RO");
        String id = criar(dono, corpo()).path("id").asText();
        mvc.perform(get("/api/animais/" + id)).andExpect(jsonPath("$.podeDemonstrarInteresse").value(false));
        mvc.perform(auth(get("/api/animais/" + id), candidato))
                .andExpect(jsonPath("$.podeDemonstrarInteresse").value(true));
        for (Conta conta : new Conta[]{outroEstado, abrigo, dono}) {
            mvc.perform(auth(get("/api/animais/" + id), conta))
                    .andExpect(jsonPath("$.podeDemonstrarInteresse").value(false));
        }
        UUID ativo = interesse(id, candidato, StatusInteresse.EM_CONTATO);
        mvc.perform(auth(get("/api/animais/" + id), candidato))
                .andExpect(jsonPath("$.podeDemonstrarInteresse").value(false))
                .andExpect(jsonPath("$.meuInteresse.id").value(ativo.toString()));
    }

    @Test
    void rejeitaEntradasInvalidasSemPersistirAnimal() throws Exception {
        Conta dono = conta(false, "RO");
        ObjectNode[] invalidos = {
                corpo().put("raca", "SIAMES"), corpo().put("peso", 0),
                corpo().put("dataNascEstimada", LocalDate.now().plusDays(1).toString()),
                corpo().put("nome", ""), corpo().put("sexo", "INVALIDO")};
        for (ObjectNode invalido : invalidos) rejeitarCadastro(dono, invalido);
        ObjectNode semFoto = corpo();
        semFoto.putArray("fotos");
        rejeitarCadastro(dono, semFoto);
        ObjectNode vacina = corpo();
        ((ObjectNode) vacina.path("vacinas").get(0)).put("dose", 0)
                .put("dataAplicacao", LocalDate.now().plusDays(1).toString());
        rejeitarCadastro(dono, vacina);
        assertThat(animais.count()).isZero();
    }

    @Test
    void rotasProtegidasExigemTokenEErrosDeEntradaSaoPadronizados() throws Exception {
        Conta dono = conta(false, "RO");
        String id = criar(dono, corpo()).path("id").asText();
        mvc.perform(post("/api/animais").contentType(MediaType.APPLICATION_JSON).content(corpo().toString()))
                .andExpect(status().isUnauthorized());
        mvc.perform(get("/api/animais/meus")).andExpect(status().isUnauthorized());
        mvc.perform(put("/api/animais/" + id).contentType(MediaType.APPLICATION_JSON)
                .content(corpo().put("statusAdocao", "DISPONIVEL").toString())).andExpect(status().isUnauthorized());
        mvc.perform(delete("/api/animais/" + id)).andExpect(status().isUnauthorized());
        mvc.perform(get("/api/animais").header("Authorization", "Bearer invalido")).andExpect(status().isUnauthorized());
        mvc.perform(get("/api/animais").param("porte", "ENORME")).andExpect(status().isBadRequest());
        mvc.perform(get("/api/animais/nao-uuid")).andExpect(status().isBadRequest()).andExpect(jsonPath("$.status").value(400));
        mvc.perform(auth(post("/api/animais"), dono).contentType(MediaType.APPLICATION_JSON).content("{"))
                .andExpect(status().isBadRequest()).andExpect(jsonPath("$.status").value(400));
        String inexistente = UUID.randomUUID().toString();
        mvc.perform(get("/api/animais/" + inexistente)).andExpect(status().isNotFound());
        mvc.perform(auth(delete("/api/animais/" + inexistente), dono)).andExpect(status().isNotFound());
        mvc.perform(auth(put("/api/animais/" + inexistente), dono).contentType(MediaType.APPLICATION_JSON)
                .content(corpo().put("statusAdocao", "DISPONIVEL").toString())).andExpect(status().isNotFound());
        String semConta = jwt.gerarToken(UUID.randomUUID(), TipoConta.USUARIO, Instant.now().plusSeconds(600));
        mvc.perform(get("/api/animais/meus").header("Authorization", "Bearer " + semConta)).andExpect(status().isUnauthorized());
        mvc.perform(get("/api/racas").param("especie", "GATO")).andExpect(status().isOk())
                .andExpect(jsonPath("$[0].valor").value("SRD_GATO"));
        mvc.perform(get("/api/racas")).andExpect(status().isBadRequest());
    }

    private void rejeitarCadastro(Conta dono, ObjectNode corpo) throws Exception {
        mvc.perform(auth(post("/api/animais"), dono).contentType(MediaType.APPLICATION_JSON).content(corpo.toString()))
                .andExpect(status().isBadRequest()).andExpect(jsonPath("$.status").value(400));
    }

    private JsonNode criar(Conta conta, ObjectNode corpo) throws Exception {
        return mapper.readTree(mvc.perform(auth(post("/api/animais"), conta)
                        .contentType(MediaType.APPLICATION_JSON).content(corpo.toString()))
                .andExpect(status().isCreated()).andExpect(header().exists("Location"))
                .andReturn().getResponse().getContentAsString());
    }

    private MockHttpServletRequestBuilder auth(MockHttpServletRequestBuilder request, Conta conta) {
        return request.header("Authorization", "Bearer " + conta.token());
    }

    private void adotar(String id) {
        transacao.executeWithoutResult(s -> animais.findById(UUID.fromString(id)).orElseThrow().setStatusAdocao(StatusAdocao.ADOTADO));
    }

    private UUID interesse(String id, Conta candidato, StatusInteresse status) {
        return transacao.execute(s -> {
            Interesse i = new Interesse();
            i.setAnimal(animais.findById(UUID.fromString(id)).orElseThrow());
            i.setUsuario(usuarios.findById(candidato.id()).orElseThrow());
            i.setStatusAndamento(status);
            i.setMoradia(TipoMoradia.CASA_COM_QUINTAL);
            i.setCriancas(ConvivenciaCrianca.NAO);
            i.setTempoSozinho(TempoSozinho.ATE_2_HORAS);
            i.setOutrosAnimais(ConvivenciaAnimal.SIM_GATOS);
            i.setProgramacaoViagem(ProgramacaoViagem.LEVO_O_ANIMAL_COMIGO);
            i.setMomentoContato(MomentoContato.NOITE);
            return interesses.saveAndFlush(i).getId();
        });
    }

    private Conta conta(boolean abrigo, String estado) {
        int numero = ++sequencia;
        Endereco endereco = new Endereco();
        endereco.setCep("76801000");
        endereco.setEstado(estado);
        endereco.setCidade(estado.equals("RO") ? "Porto Velho" : "São Paulo");
        endereco.setNumero("1");
        UUID id;
        String documento = String.format(abrigo ? "%014d" : "%011d", numero);
        if (abrigo) {
            Abrigo a = new Abrigo();
            a.setCnpj(documento);
            a.setNome("Abrigo " + numero);
            a.setRazaoSocial("Abrigo " + numero);
            a.setEmail("abrigo" + numero + "@example.com");
            a.setTelefone("69999998888");
            a.setSenha("hash-de-fixture");
            a.setEndereco(endereco);
            id = abrigos.saveAndFlush(a).getId();
        } else {
            Usuario u = new Usuario();
            u.setCpf(documento);
            u.setNome("Usuario " + numero);
            u.setEmail("usuario" + numero + "@example.com");
            u.setTelefone("69999998888");
            u.setSenha("hash-de-fixture");
            u.setEndereco(endereco);
            id = usuarios.saveAndFlush(u).getId();
        }
        return new Conta(id, jwt.gerarToken(id, abrigo ? TipoConta.ABRIGO : TipoConta.USUARIO,
                Instant.now().plusSeconds(600)), abrigo);
    }

    private ObjectNode corpo() throws Exception {
        return (ObjectNode) mapper.readTree("""
                {"nome":"Mel","especie":"CAO","raca":"SRD_CAO","sexo":"FEMEA","porte":"MEDIO","peso":12.5,
                 "dataNascEstimada":"2020-01-01","castrado":true,"energia":"MAIS_CALMO",
                 "convivencia":{"crianca":"NAO_TESTADO","gato":"CONVIVE_BEM","cao":"NAO_CONVIVE_BEM"},
                 "historia":"Resgatada","fotos":["https://example.com/mel.jpg"],
                 "vacinas":[{"nome":"V10","dose":1,"dataAplicacao":"2024-01-01"}]}
                """);
    }
}

