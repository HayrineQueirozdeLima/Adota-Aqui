package com.adotaaqui.dto;

import com.adotaaqui.model.enums.StatusAdocao;
import com.adotaaqui.model.enums.StatusInteresse;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.fasterxml.jackson.databind.SerializationFeature;
import com.fasterxml.jackson.databind.node.ObjectNode;
import jakarta.validation.Validation;
import jakarta.validation.Validator;
import jakarta.validation.ValidatorFactory;
import org.junit.jupiter.api.AfterAll;
import org.junit.jupiter.api.Test;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.Set;
import java.util.UUID;
import java.util.stream.Collectors;

import static org.assertj.core.api.Assertions.assertThat;

class DtoValidationTest {
    private static final ValidatorFactory FACTORY = Validation.buildDefaultValidatorFactory();
    private static final Validator VALIDATOR = FACTORY.getValidator();
    private static final ObjectMapper MAPPER = new ObjectMapper().findAndRegisterModules();

    @AfterAll
    static void fecharValidator() {
        FACTORY.close();
    }

    @Test
    void validaFormatoELimitesDoEndereco() throws Exception {
        EnderecoDto dto = MAPPER.readValue(endereco(), EnderecoDto.class);
        assertThat(camposInvalidos(dto)).isEmpty();
        dto.setCep("abcdefgh");
        dto.setEstado("12");
        dto.setCidade("a".repeat(81));
        dto.setLogradouro("a".repeat(121));
        dto.setBairro("a".repeat(81));
        assertThat(camposInvalidos(dto)).contains("cep", "estado", "cidade", "logradouro", "bairro");
        dto.setEstado("ro");
        assertThat(camposInvalidos(dto)).contains("estado");
    }

    @Test
    void cadastroRespeitaLimitesDasColunasETelefone() throws Exception {
        for (Class<?> tipo : new Class<?>[]{CadastroUsuarioRequest.class, CadastroAbrigoRequest.class}) {
            ObjectNode json = cadastro();
            json.put("nome", "a".repeat(120));
            json.put("razaoSocial", "a".repeat(150));
            // Remove campos que pertencem somente ao outro tipo de conta.
            if (tipo == CadastroUsuarioRequest.class) {
                json.remove("cnpj");
                json.remove("razaoSocial");
            } else {
                json.remove("cpf");
            }
            assertThat(camposInvalidos(MAPPER.treeToValue(json, tipo))).isEmpty();
            json.put("nome", "a".repeat(121));
            json.put("email", "a".repeat(60) + "@" + "b".repeat(60) + ".com");
            json.put("telefone", "telefone");
            json.withObject("/endereco").put("cep", "1234567a");
            if (tipo == CadastroAbrigoRequest.class) json.put("razaoSocial", "a".repeat(151));
            Set<String> campos = camposInvalidos(MAPPER.treeToValue(json, tipo));
            assertThat(campos).contains("nome", "email", "telefone", "endereco.cep");
            if (tipo == CadastroAbrigoRequest.class) assertThat(campos).contains("razaoSocial");
        }
    }

    @Test
    void animalValidaObjetosAninhadosEFotos() throws Exception {
        AnimalRequest valido = MAPPER.readValue(animal(), AnimalRequest.class);
        assertThat(camposInvalidos(valido)).isEmpty();
        assertThat(valido.getVacinas()).isEmpty();

        ObjectNode json = (ObjectNode) MAPPER.readTree(animal());
        json.put("peso", 0);
        json.put("dataNascEstimada", LocalDate.now().plusDays(1).toString());
        json.withObject("/convivencia").remove("cao");
        json.putArray("fotos").add("");
        json.putArray("vacinas").addObject().put("nome", "").put("dose", 0)
                .put("dataAplicacao", LocalDate.now().plusDays(1).toString());
        Set<String> campos = camposInvalidos(MAPPER.treeToValue(json, AnimalRequest.class));
        assertThat(campos).contains("peso", "dataNascEstimada", "convivencia.cao",
                "vacinas[0].nome", "vacinas[0].dose", "vacinas[0].dataAplicacao");
        assertThat(campos).anyMatch(c -> c.startsWith("fotos[0]"));
        json.putArray("fotos");
        assertThat(camposInvalidos(MAPPER.treeToValue(json, AnimalRequest.class))).contains("fotos");

        valido.setFotos(java.util.List.of("nao-e-uma-url"));
        assertThat(camposInvalidos(valido)).anyMatch(c -> c.startsWith("fotos[0]"));
    }

    @Test
    void atualizacaoDoAnimalValidaCamposHerdadosEStatus() throws Exception {
        AtualizarAnimalRequest dto = MAPPER.readValue(animal(), AtualizarAnimalRequest.class);
        assertThat(camposInvalidos(dto)).containsExactly("statusAdocao");
        dto.setStatusAdocao(StatusAdocao.DISPONIVEL);
        assertThat(camposInvalidos(dto)).isEmpty();
        dto.setNome("");
        assertThat(camposInvalidos(dto)).contains("nome");
    }

    @Test
    void interesseExigeAceiteExplicitoETriagemCompleta() throws Exception {
        ObjectNode json = (ObjectNode) MAPPER.readTree("""
                {"aceiteTermo":true,"triagem":{
                  "moradia":"CASA_COM_QUINTAL","criancas":"SIM","tempoSozinho":"ATE_4_HORAS",
                  "outrosAnimais":"SIM_GATOS",
                  "programacaoViagem":"PREFIRO_RESPONDER_DIRETAMENTE_AO_PROTETOR",
                  "momentoContato":"NOITE"}}
                """);
        assertThat(camposInvalidos(MAPPER.treeToValue(json, InteresseRequest.class))).isEmpty();
        json.remove("aceiteTermo");
        assertThat(camposInvalidos(MAPPER.treeToValue(json, InteresseRequest.class))).contains("aceiteTermo");
        json.put("aceiteTermo", false);
        json.withObject("/triagem").remove("momentoContato");
        assertThat(camposInvalidos(MAPPER.treeToValue(json, InteresseRequest.class)))
                .contains("aceiteTermo", "triagem.momentoContato");
        json.remove("triagem");
        assertThat(camposInvalidos(MAPPER.treeToValue(json, InteresseRequest.class))).contains("triagem");
    }

    @Test
    void trocaDeSenhaConfereConfirmacaoESerializacaoNaoExibeSegredos() throws Exception {
        AlterarSenhaRequest dto = MAPPER.readValue("""
                {"senhaAtual":"senhaAtual123","novaSenha":"novaSenha123","confirmacaoNovaSenha":"diferente"}
                """, AlterarSenhaRequest.class);
        assertThat(camposInvalidos(dto)).contains("novasSenhasConferem");
        dto.setConfirmacaoNovaSenha("novaSenha123");
        assertThat(camposInvalidos(dto)).isEmpty();
        assertThat(dto.getSenhaAtual()).isEqualTo("senhaAtual123");
        // Todos os campos são de entrada; mesmo permitindo beans vazios, nenhum segredo sai.
        assertThat(MAPPER.writer().without(SerializationFeature.FAIL_ON_EMPTY_BEANS)
                .writeValueAsString(dto)).isEqualTo("{}");

        LoginRequest login = MAPPER.readValue("""
                {"documento":"12345678909","senha":"senha123"}
                """, LoginRequest.class);
        assertThat(login.getSenha()).isEqualTo("senha123");
        assertThat(MAPPER.valueToTree(login).has("senha")).isFalse();
        CadastroUsuarioRequest usuario = new CadastroUsuarioRequest();
        usuario.setSenha("senha123");
        usuario.setConfirmacaoSenha("senha123");
        CadastroAbrigoRequest abrigo = new CadastroAbrigoRequest();
        abrigo.setSenha("senha123");
        abrigo.setConfirmacaoSenha("senha123");
        for (Object cadastro : new Object[]{usuario, abrigo}) {
            var resposta = MAPPER.valueToTree(cadastro);
            assertThat(resposta.has("senha")).isFalse();
            assertThat(resposta.has("confirmacaoSenha")).isFalse();
        }
    }

    @Test
    void respostasDeInteresseSeparamContatoDoCandidatoEProtetor() {
        ContatoResponse contato = new ContatoResponse("Nome", "69999998888", "contato@example.com");
        var candidato = new InteresseResponse(UUID.randomUUID(), LocalDateTime.now(),
                StatusInteresse.PENDENTE, null, null, null, contato);
        var protetor = new InteresseRecebidoResponse(UUID.randomUUID(), LocalDateTime.now(),
                StatusInteresse.PENDENTE, null, null, null, contato);
        assertThat(MAPPER.valueToTree(candidato).has("contatoProtetor")).isTrue();
        assertThat(MAPPER.valueToTree(candidato).has("candidato")).isFalse();
        assertThat(MAPPER.valueToTree(protetor).has("candidato")).isTrue();
        assertThat(MAPPER.valueToTree(protetor).has("contatoProtetor")).isFalse();
        var publico = MAPPER.valueToTree(new ProtetorResponse("Nome", "Cidade", "RO"));
        assertThat(publico.has("telefone")).isFalse();
        assertThat(publico.has("email")).isFalse();
    }

    private static Set<String> camposInvalidos(Object dto) {
        return VALIDATOR.validate(dto).stream()
                .map(v -> v.getPropertyPath().toString()).collect(Collectors.toSet());
    }

    private static ObjectNode cadastro() throws Exception {
        ObjectNode json = (ObjectNode) MAPPER.readTree("""
                {"nome":"Nome","cpf":"12345678909","cnpj":"12345678000195","razaoSocial":"Abrigo",
                 "telefone":"69999998888","email":"conta@example.com",
                 "senha":"minhaSenha123","confirmacaoSenha":"minhaSenha123"}
                """);
        json.set("endereco", MAPPER.readTree(endereco()));
        return json;
    }

    private static String endereco() {
        return """
                {"cep":"76801000","estado":"RO","cidade":"Porto Velho","numero":"s/n"}
                """;
    }

    private static String animal() {
        return """
                {"nome":"Mel","especie":"CAO","raca":"SRD_CAO","sexo":"FEMEA","porte":"MEDIO",
                 "dataNascEstimada":"2020-01-01","castrado":false,"energia":"MAIS_CALMO",
                 "convivencia":{"crianca":"NAO_TESTADO","gato":"NAO_TESTADO","cao":"NAO_TESTADO"},
                 "historia":"Resgatada","fotos":["https://example.com/mel.jpg"]}
                """;
    }
}

