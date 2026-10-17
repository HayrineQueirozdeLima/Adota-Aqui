package com.adotaaqui.model;

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
import org.springframework.dao.DataIntegrityViolationException;
import org.springframework.http.MediaType;
import org.springframework.jdbc.core.ConnectionCallback;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.test.web.servlet.MockMvc;

import java.sql.ResultSet;
import java.time.Instant;
import java.util.HashSet;
import java.util.List;
import java.util.Locale;
import java.util.Set;
import java.util.UUID;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

// Issue #40: índices, unicidade e chaves estrangeiras, conferidos direto no banco.
// O service já barra quase tudo isso antes. Aqui a gente confere que o banco também barra,
// pra nenhum dado inconsistente entrar nem por um código novo que esqueça a validação.
@SpringBootTest
@AutoConfigureMockMvc
class IntegridadeDoBancoTest {
    @Autowired MockMvc mvc;
    @Autowired ObjectMapper mapper;
    @Autowired AnimalRepository animais;
    @Autowired UsuarioRepository usuarios;
    @Autowired AbrigoRepository abrigos;
    @Autowired JwtService jwt;
    @Autowired JdbcTemplate jdbc;

    private record Conta(UUID id, String token) {}

    @BeforeEach
    @AfterEach
    void limpar() {
        animais.deleteAll(); // apaga junto as vacinas, as fotos e os interesses de cada animal (cascade)
        usuarios.deleteAll();
        abrigos.deleteAll();
    }

    // ---------- Índices ----------

    // Os índices das consultas que mais rodam (vitrine, Meus animais, painel, interesse repetido e perfil)
    @Test
    void tabelasTemOsIndicesDasConsultasMaisUsadas() {
        assertThat(indicesDa("animal"))
                .contains("idx_animal_status_adocao", "idx_animal_usuario", "idx_animal_abrigo");
        assertThat(indicesDa("interesse"))
                .contains("idx_interesse_usuario_animal", "idx_interesse_animal_status");
        assertThat(indicesDa("vacina")).contains("idx_vacina_animal");
    }

    // ---------- Unicidade ----------

    @Test
    void bancoRecusaPessoaComCpfOuEmailRepetido() {
        usuarios.saveAndFlush(pessoa("00000000001", "ana@example.com"));

        assertThatThrownBy(() -> usuarios.saveAndFlush(pessoa("00000000001", "outra@example.com")))
                .isInstanceOf(DataIntegrityViolationException.class);
        assertThatThrownBy(() -> usuarios.saveAndFlush(pessoa("00000000002", "ana@example.com")))
                .isInstanceOf(DataIntegrityViolationException.class);

        assertThat(usuarios.count()).isEqualTo(1);
    }

    @Test
    void bancoRecusaAbrigoComCnpjOuEmailRepetido() {
        abrigos.saveAndFlush(abrigo("00000000000001", "patas@example.com"));

        assertThatThrownBy(() -> abrigos.saveAndFlush(abrigo("00000000000001", "outro@example.com")))
                .isInstanceOf(DataIntegrityViolationException.class);
        assertThatThrownBy(() -> abrigos.saveAndFlush(abrigo("00000000000002", "patas@example.com")))
                .isInstanceOf(DataIntegrityViolationException.class);

        assertThat(abrigos.count()).isEqualTo(1);
    }

    // ---------- Chaves estrangeiras ----------

    // Vacina e interesse sempre apontam pra um animal e uma pessoa que existem.
    // O mesmo INSERT com os ids certos passa, então a recusa é mesmo pela chave estrangeira
    @Test
    void bancoRecusaVacinaEInteresseSemAnimalOuPessoaDeVerdade() throws Exception {
        Conta protetor = conta(usuarios.saveAndFlush(pessoa("00000000001", "ana@example.com")).getId());
        UUID candidata = usuarios.saveAndFlush(pessoa("00000000002", "bia@example.com")).getId();
        UUID animal = animal(protetor);
        UUID naoExiste = UUID.randomUUID();

        assertThat(novaVacina(animal)).isEqualTo(1);
        assertThatThrownBy(() -> novaVacina(naoExiste)).isInstanceOf(DataIntegrityViolationException.class);

        assertThat(novoInteresse(candidata, animal)).isEqualTo(1);
        assertThatThrownBy(() -> novoInteresse(candidata, naoExiste))
                .isInstanceOf(DataIntegrityViolationException.class);
        assertThatThrownBy(() -> novoInteresse(naoExiste, animal))
                .isInstanceOf(DataIntegrityViolationException.class);
    }

    // Quem tem animal cadastrado não some do banco deixando o animal sem protetor
    @Test
    void bancoNaoApagaProtetorQueTemAnimal() throws Exception {
        Conta protetor = conta(usuarios.saveAndFlush(pessoa("00000000001", "ana@example.com")).getId());
        animal(protetor);

        assertThatThrownBy(() -> jdbc.update("delete from usuario where id = ?", protetor.id()))
                .isInstanceOf(DataIntegrityViolationException.class);

        assertThat(usuarios.existsById(protetor.id())).isTrue();
    }

    // ---------- Valores ----------

    // Peso, quando vem, é maior que zero. Dose de vacina, quando vem, é 1 ou mais
    @Test
    void bancoRecusaPesoZeradoEDoseMenorQueUm() throws Exception {
        Conta protetor = conta(usuarios.saveAndFlush(pessoa("00000000001", "ana@example.com")).getId());
        UUID animal = animal(protetor);

        assertThatThrownBy(() -> jdbc.update("update animal set peso = 0 where id = ?", animal))
                .isInstanceOf(DataIntegrityViolationException.class);
        assertThatThrownBy(() -> jdbc.update("update vacina set dose = 0 where animal_id = ?", animal))
                .isInstanceOf(DataIntegrityViolationException.class);

        assertThat(jdbc.queryForObject("select peso from animal where id = ?", Double.class, animal))
                .isEqualTo(12.5);
    }

    // ---------- ajudantes ----------

    // Nomes dos índices da tabela, em minúsculas. O H2 guarda os nomes em maiúsculas
    private Set<String> indicesDa(String tabela) {
        return jdbc.execute((ConnectionCallback<Set<String>>) conexao -> {
            Set<String> nomes = new HashSet<>();
            for (String nome : List.of(tabela.toUpperCase(Locale.ROOT), tabela)) {
                try (ResultSet indices = conexao.getMetaData().getIndexInfo(null, null, nome, false, true)) {
                    while (indices.next()) {
                        String indice = indices.getString("INDEX_NAME");
                        if (indice != null) nomes.add(indice.toLowerCase(Locale.ROOT));
                    }
                }
            }
            return nomes;
        });
    }

    private int novaVacina(UUID animalId) {
        return jdbc.update("insert into vacina (id, nome, animal_id) values (?, 'V10', ?)", UUID.randomUUID(), animalId);
    }

    // Um interesse Pendente com a triagem completa, gravado direto no banco
    private int novoInteresse(UUID usuarioId, UUID animalId) {
        return jdbc.update("""
                insert into interesse (id, data_hora, status_andamento, moradia, criancas, tempo_sozinho,
                    outros_animais, programacao_viagem, momento_contato, usuario_id, animal_id)
                values (?, localtimestamp, 'PENDENTE', 'CASA_COM_QUINTAL', 'NAO', 'ATE_2_HORAS',
                    'SIM_GATOS', 'LEVO_O_ANIMAL_COMIGO', 'NOITE', ?, ?)
                """, UUID.randomUUID(), usuarioId, animalId);
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

    private Conta conta(UUID usuarioId) {
        return new Conta(usuarioId, jwt.gerarToken(usuarioId, TipoConta.USUARIO, Instant.now().plusSeconds(600)));
    }

    private static Usuario pessoa(String cpf, String email) {
        Usuario usuario = new Usuario();
        usuario.setCpf(cpf);
        usuario.setNome("Ana Souza");
        usuario.setEmail(email);
        usuario.setTelefone("69999998888");
        usuario.setSenha("hash-de-fixture");
        usuario.setEndereco(endereco());
        return usuario;
    }

    private static Abrigo abrigo(String cnpj, String email) {
        Abrigo abrigo = new Abrigo();
        abrigo.setCnpj(cnpj);
        abrigo.setNome("Instituto Quatro Patas");
        abrigo.setRazaoSocial("Instituto Quatro Patas");
        abrigo.setEmail(email);
        abrigo.setTelefone("6932221111");
        abrigo.setSenha("hash-de-fixture");
        abrigo.setEndereco(endereco());
        return abrigo;
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