package com.adotaaqui.model;

import com.adotaaqui.model.enums.ConvivenciaAnimal;
import com.adotaaqui.model.enums.ConvivenciaCrianca;
import com.adotaaqui.model.enums.MomentoContato;
import com.adotaaqui.model.enums.ProgramacaoViagem;
import com.adotaaqui.model.enums.StatusInteresse;
import com.adotaaqui.model.enums.TempoSozinho;
import com.adotaaqui.model.enums.TipoConta;
import com.adotaaqui.model.enums.TipoMoradia;
import com.adotaaqui.repository.AbrigoRepository;
import com.adotaaqui.repository.AnimalRepository;
import com.adotaaqui.repository.InteresseRepository;
import com.adotaaqui.repository.UsuarioRepository;
import com.adotaaqui.security.JwtService;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.params.ParameterizedTest;
import org.junit.jupiter.params.provider.NullAndEmptySource;
import org.junit.jupiter.params.provider.ValueSource;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.dao.DataIntegrityViolationException;
import org.springframework.http.MediaType;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.transaction.support.TransactionTemplate;

import java.time.Instant;
import java.util.UUID;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

// Issue #33: as regras que ficam dentro das próprias entidades e no banco, testadas sem passar pelo service.
// O service já recusa esses casos antes (InteresseIntegrationTest e AnimalIntegrationTest). Estes testes
// conferem a última barreira: se um código novo esquecer a validação, a entidade e o banco ainda recusam.
@SpringBootTest
@AutoConfigureMockMvc
class RegrasDasEntidadesTest {
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

    private record Conta(UUID id, String token) {}

    @BeforeEach
    @AfterEach
    void limpar() {
        animais.deleteAll(); // apaga junto as vacinas, as fotos e os interesses de cada animal (cascade)
        usuarios.deleteAll();
        abrigos.deleteAll();
        sequencia = 0;
    }

    // ---------- Interesse: descontinuar exige motivo (RF10) ----------

    // Interesse novo já gravado como Descontinuado, sem motivo: o @PrePersist recusa
    @ParameterizedTest
    @NullAndEmptySource
    @ValueSource(strings = {"   "})
    void interesseDescontinuadoSemMotivoNaoEGravado(String motivo) throws Exception {
        UUID animal = animal(usuario());
        UUID candidata = usuario().id();

        assertThatThrownBy(() -> transacao.executeWithoutResult(s -> {
            Interesse interesse = novoInteresse(animal, candidata);
            interesse.setStatusAndamento(StatusInteresse.DESCONTINUADO);
            interesse.setMotivoDescontinuacao(motivo);
            interesses.saveAndFlush(interesse);
        })).hasStackTraceContaining("exige informar o motivo");

        assertThat(interesses.count()).isZero();
    }

    // Interesse que já existe mudando pra Descontinuado sem motivo: o @PreUpdate recusa e nada muda no banco
    @Test
    void interesseQueJaExisteNaoViraDescontinuadoSemMotivo() throws Exception {
        UUID animal = animal(usuario());
        UUID candidata = usuario().id();
        UUID id = transacao.execute(s -> interesses.saveAndFlush(novoInteresse(animal, candidata)).getId());

        assertThatThrownBy(() -> transacao.executeWithoutResult(s -> {
            Interesse interesse = interesses.findById(id).orElseThrow();
            interesse.setStatusAndamento(StatusInteresse.DESCONTINUADO);
            interesses.saveAndFlush(interesse);
        })).hasStackTraceContaining("exige informar o motivo");

        Interesse gravado = interesses.findById(id).orElseThrow();
        assertThat(gravado.getStatusAndamento()).isEqualTo(StatusInteresse.PENDENTE);
        assertThat(gravado.getMotivoDescontinuacao()).isNull();
    }

    // Com o motivo preenchido, a entidade deixa gravar
    @Test
    void interesseDescontinuadoComMotivoEGravado() throws Exception {
        UUID animal = animal(usuario());
        UUID candidata = usuario().id();

        UUID id = transacao.execute(s -> {
            Interesse interesse = novoInteresse(animal, candidata);
            interesse.setStatusAndamento(StatusInteresse.DESCONTINUADO);
            interesse.setMotivoDescontinuacao("Sem disponibilidade");
            return interesses.saveAndFlush(interesse).getId();
        });

        assertThat(interesses.findById(id).orElseThrow().getMotivoDescontinuacao()).isEqualTo("Sem disponibilidade");
    }

    // No banco: o CHECK da tabela interesse também recusa Descontinuado sem motivo, mesmo num UPDATE direto
    @Test
    void bancoRecusaInteresseDescontinuadoSemMotivo() throws Exception {
        UUID animal = animal(usuario());
        UUID candidata = usuario().id();
        UUID id = transacao.execute(s -> interesses.saveAndFlush(novoInteresse(animal, candidata)).getId());

        assertThatThrownBy(() -> jdbc.update(
                "update interesse set status_andamento = 'DESCONTINUADO' where id = ?", id))
                .isInstanceOf(DataIntegrityViolationException.class);

        assertThat(interesses.findById(id).orElseThrow().getStatusAndamento()).isEqualTo(StatusInteresse.PENDENTE);
    }

    // ---------- Animal: exatamente um protetor, pessoa ou abrigo (o xor) ----------

    // Na entidade: o validarProtetor recusa o animal com os dois protetores e sem nenhum
    @Test
    void animalNaoFicaComDoisProtetoresNemSemNenhum() throws Exception {
        UUID animal = animal(usuario());
        UUID abrigo = abrigo();

        assertThatThrownBy(() -> transacao.executeWithoutResult(s -> {
            Animal registro = animais.findById(animal).orElseThrow();
            registro.setAbrigo(abrigos.findById(abrigo).orElseThrow());
            animais.saveAndFlush(registro);
        })).hasStackTraceContaining("exatamente um protetor");

        assertThatThrownBy(() -> transacao.executeWithoutResult(s -> {
            Animal registro = animais.findById(animal).orElseThrow();
            registro.setUsuario(null);
            animais.saveAndFlush(registro);
        })).hasStackTraceContaining("exatamente um protetor");

        assertThat(protetorContinuaSoAPessoa()).isEqualTo(1);
    }

    // No banco: a mesma regra está no CHECK da tabela animal, então nem um UPDATE direto passa
    @Test
    void bancoRecusaAnimalComDoisProtetoresOuSemNenhum() throws Exception {
        UUID animal = animal(usuario());
        UUID abrigo = abrigo();

        assertThatThrownBy(() -> jdbc.update("update animal set abrigo_id = ? where id = ?", abrigo, animal))
                .isInstanceOf(DataIntegrityViolationException.class);
        assertThatThrownBy(() -> jdbc.update("update animal set usuario_id = null where id = ?", animal))
                .isInstanceOf(DataIntegrityViolationException.class);

        assertThat(protetorContinuaSoAPessoa()).isEqualTo(1);
    }

    // ---------- ajudantes ----------

    private Long protetorContinuaSoAPessoa() {
        return jdbc.queryForObject(
                "select count(*) from animal where usuario_id is not null and abrigo_id is null", Long.class);
    }

    // Um interesse com a triagem completa, como a API grava. Chamar dentro de uma transação
    private Interesse novoInteresse(UUID animalId, UUID candidataId) {
        Interesse interesse = new Interesse();
        interesse.setAnimal(animais.findById(animalId).orElseThrow());
        interesse.setUsuario(usuarios.findById(candidataId).orElseThrow());
        interesse.setMoradia(TipoMoradia.CASA_COM_QUINTAL);
        interesse.setCriancas(ConvivenciaCrianca.NAO);
        interesse.setTempoSozinho(TempoSozinho.ATE_2_HORAS);
        interesse.setOutrosAnimais(ConvivenciaAnimal.SIM_GATOS);
        interesse.setProgramacaoViagem(ProgramacaoViagem.LEVO_O_ANIMAL_COMIGO);
        interesse.setMomentoContato(MomentoContato.NOITE);
        return interesse;
    }

    // Cadastra um animal pela API (o mesmo corpo dos outros testes) e devolve o id
    private UUID animal(Conta protetor) throws Exception {
        String corpo = """
                {"nome":"Mel","especie":"CAO","raca":"SRD_CAO","sexo":"FEMEA","porte":"MEDIO","peso":12.5,
                 "dataNascEstimada":"2020-01-01","castrado":true,"energia":"MAIS_CALMO",
                 "convivencia":{"crianca":"NAO_TESTADO","gato":"CONVIVE_BEM","cao":"NAO_CONVIVE_BEM"},
                 "historia":"Resgatada","fotos":["https://example.com/mel.jpg"],
                 "vacinas":[{"nome":"V10","dose":1,"dataAplicacao":"2024-01-01"}]}
                """;
        String resposta = mvc.perform(post("/api/animais").header("Authorization", "Bearer " + protetor.token())
                        .contentType(MediaType.APPLICATION_JSON).content(corpo))
                .andExpect(status().isCreated())
                .andReturn().getResponse().getContentAsString();
        return UUID.fromString(mapper.readTree(resposta).path("id").asText());
    }

    private Conta usuario() {
        int numero = ++sequencia;
        Usuario usuario = new Usuario();
        usuario.setCpf(String.format("%011d", numero));
        usuario.setNome("Usuario " + numero);
        usuario.setEmail("usuario" + numero + "@example.com");
        usuario.setTelefone("69999998888");
        usuario.setSenha("hash-de-fixture");
        usuario.setEndereco(endereco());
        UUID id = usuarios.saveAndFlush(usuario).getId();
        return new Conta(id, jwt.gerarToken(id, TipoConta.USUARIO, Instant.now().plusSeconds(600)));
    }

    private UUID abrigo() {
        int numero = ++sequencia;
        Abrigo abrigo = new Abrigo();
        abrigo.setCnpj(String.format("%014d", numero));
        abrigo.setNome("Abrigo " + numero);
        abrigo.setRazaoSocial("Abrigo " + numero);
        abrigo.setEmail("abrigo" + numero + "@example.com");
        abrigo.setTelefone("6932221111");
        abrigo.setSenha("hash-de-fixture");
        abrigo.setEndereco(endereco());
        return abrigos.saveAndFlush(abrigo).getId();
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
