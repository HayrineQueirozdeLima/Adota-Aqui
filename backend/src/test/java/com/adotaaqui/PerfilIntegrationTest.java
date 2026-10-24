package com.adotaaqui;

import com.adotaaqui.model.enums.TipoConta;
import com.adotaaqui.repository.AbrigoRepository;
import com.adotaaqui.repository.AnimalRepository;
import com.adotaaqui.repository.UsuarioRepository;
import com.adotaaqui.security.JwtService;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.fasterxml.jackson.databind.node.ObjectNode;
import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.http.MediaType;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.ResultActions;
import org.springframework.test.web.servlet.request.MockHttpServletRequestBuilder;

import java.time.Instant;
import java.util.Map;
import java.util.UUID;

import static org.assertj.core.api.Assertions.assertThat;
import static org.hamcrest.Matchers.containsString;
import static org.hamcrest.Matchers.hasItem;
import static org.hamcrest.Matchers.not;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.patch;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.put;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

// Issue #96: perfil da conta (RF17, UC10). Ver e editar os dados e trocar a senha, pra pessoa e pro abrigo.
// Cada regra da seção 7 do docs/api.md tem um teste aqui
@SpringBootTest
@AutoConfigureMockMvc
class PerfilIntegrationTest {
    @Autowired MockMvc mvc;
    @Autowired ObjectMapper mapper;
    @Autowired AnimalRepository animais;
    @Autowired UsuarioRepository usuarios;
    @Autowired AbrigoRepository abrigos;
    @Autowired PasswordEncoder encoder;
    @Autowired JwtService jwt;

    private static final String SENHA = "minhaSenha123";
    private static final String NOVA_SENHA = "novaSenha456";
    private static final String CPF = "12345678909";
    private static final String OUTRO_CPF = "52998224725";
    private static final String CNPJ = "12345678000195";

    @BeforeEach
    @AfterEach
    void limpar() {
        animais.deleteAll();
        usuarios.deleteAll();
        abrigos.deleteAll();
    }

    // ---------- ver o perfil ----------

    @Test
    void pessoaVeOProprioPerfilSemASenha() throws Exception {
        String token = pessoa(CPF, "maria@example.com", "RO");

        mvc.perform(comToken(get("/api/usuarios/me"), token))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.id").value(usuarios.findByCpf(CPF).orElseThrow().getId().toString()))
                .andExpect(jsonPath("$.nome").value("Maria Silva"))
                .andExpect(jsonPath("$.cpf").value(CPF))
                .andExpect(jsonPath("$.telefone").value("69999998888"))
                .andExpect(jsonPath("$.email").value("maria@example.com"))
                .andExpect(jsonPath("$.endereco.cep").value("76801000"))
                .andExpect(jsonPath("$.endereco.numero").value("123"))
                .andExpect(jsonPath("$.endereco.logradouro").value("Avenida Sete de Setembro"))
                .andExpect(jsonPath("$.endereco.bairro").value("Centro"))
                .andExpect(jsonPath("$.endereco.cidade").value("Porto Velho"))
                .andExpect(jsonPath("$.endereco.estado").value("RO"))
                .andExpect(jsonPath("$.senha").doesNotExist())
                .andExpect(jsonPath("$.cnpj").doesNotExist());
    }

    @Test
    void abrigoVeOProprioPerfilComCnpjERazaoSocial() throws Exception {
        String token = abrigo("abrigo@example.com");

        mvc.perform(comToken(get("/api/abrigos/me"), token))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.id").value(abrigos.findByCnpj(CNPJ).orElseThrow().getId().toString()))
                .andExpect(jsonPath("$.nome").value("Abrigo Patas Unidas"))
                .andExpect(jsonPath("$.cnpj").value(CNPJ))
                .andExpect(jsonPath("$.razaoSocial").value("Associação Patas Unidas"))
                .andExpect(jsonPath("$.email").value("abrigo@example.com"))
                .andExpect(jsonPath("$.endereco.estado").value("RO"))
                .andExpect(jsonPath("$.senha").doesNotExist())
                .andExpect(jsonPath("$.cpf").doesNotExist());
    }

    // ---------- quem pode ----------

    @Test
    void semTokenOuComContaQueNaoExisteMaisRecebe401() throws Exception {
        for (String rota : new String[]{"/api/usuarios/me", "/api/abrigos/me"}) {
            mvc.perform(get(rota)).andExpect(status().isUnauthorized());
            mvc.perform(put(rota).contentType(MediaType.APPLICATION_JSON)
                            .content(edicaoDePessoa("maria@example.com", "RO").toString()))
                    .andExpect(status().isUnauthorized());
            mvc.perform(patch(rota + "/senha").contentType(MediaType.APPLICATION_JSON)
                            .content(trocaDeSenha(SENHA, NOVA_SENHA, NOVA_SENHA).toString()))
                    .andExpect(status().isUnauthorized());
        }
        String contaApagada = jwt.gerarToken(UUID.randomUUID(), TipoConta.USUARIO, Instant.now().plusSeconds(600));
        mvc.perform(comToken(get("/api/usuarios/me"), contaApagada)).andExpect(status().isUnauthorized());
    }

    // Cada tipo de conta só usa o próprio perfil. Nos três endpoints, o outro tipo recebe 403 e nada muda
    @Test
    void contaDoOutroTipoRecebe403() throws Exception {
        String pessoa = pessoa(CPF, "maria@example.com", "RO");
        String abrigo = abrigo("abrigo@example.com");

        mvc.perform(comToken(get("/api/abrigos/me"), pessoa))
                .andExpect(status().isForbidden())
                .andExpect(jsonPath("$.mensagem", containsString("abrigo")));
        mvc.perform(enviar(put("/api/abrigos/me"), pessoa, edicaoDeAbrigo("abrigo@example.com")))
                .andExpect(status().isForbidden());
        mvc.perform(enviar(patch("/api/abrigos/me/senha"), pessoa, trocaDeSenha(SENHA, NOVA_SENHA, NOVA_SENHA)))
                .andExpect(status().isForbidden());

        mvc.perform(comToken(get("/api/usuarios/me"), abrigo))
                .andExpect(status().isForbidden())
                .andExpect(jsonPath("$.mensagem", containsString("pessoal")));
        mvc.perform(enviar(put("/api/usuarios/me"), abrigo, edicaoDePessoa("maria@example.com", "RO")))
                .andExpect(status().isForbidden());
        mvc.perform(enviar(patch("/api/usuarios/me/senha"), abrigo, trocaDeSenha(SENHA, NOVA_SENHA, NOVA_SENHA)))
                .andExpect(status().isForbidden());

        assertThat(usuarios.findByCpf(CPF).orElseThrow().getNome()).isEqualTo("Maria Silva");
        assertThat(abrigos.findByCnpj(CNPJ).orElseThrow().getNome()).isEqualTo("Abrigo Patas Unidas");
        assertThat(encoder.matches(SENHA, usuarios.findByCpf(CPF).orElseThrow().getSenha())).isTrue();
        assertThat(encoder.matches(SENHA, abrigos.findByCnpj(CNPJ).orElseThrow().getSenha())).isTrue();
    }

    // ---------- editar os dados ----------

    @Test
    void pessoaAtualizaOsDadosEOCpfNaoMuda() throws Exception {
        String token = pessoa(CPF, "maria@example.com", "RO");
        ObjectNode edicao = edicaoDePessoa("Maria.Souza@Example.com", "SP");
        // O CPF não faz parte do corpo. Se vier, é ignorado
        edicao.put("cpf", OUTRO_CPF);

        mvc.perform(enviar(put("/api/usuarios/me"), token, edicao))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.nome").value("Maria Silva Souza"))
                .andExpect(jsonPath("$.telefone").value("69999997777"))
                .andExpect(jsonPath("$.email").value("maria.souza@example.com"))
                .andExpect(jsonPath("$.cpf").value(CPF))
                .andExpect(jsonPath("$.endereco.cep").value("01310100"))
                .andExpect(jsonPath("$.endereco.cidade").value("São Paulo"))
                .andExpect(jsonPath("$.endereco.estado").value("SP"));

        mvc.perform(comToken(get("/api/usuarios/me"), token))
                .andExpect(jsonPath("$.email").value("maria.souza@example.com"))
                .andExpect(jsonPath("$.endereco.estado").value("SP"));
        // O login continua pelo mesmo CPF, e já com o nome novo
        login(CPF, SENHA).andExpect(status().isOk()).andExpect(jsonPath("$.nome").value("Maria Silva Souza"));
        assertThat(usuarios.existsByCpf(OUTRO_CPF)).isFalse();
    }

    @Test
    void abrigoAtualizaOsDadosEOCnpjNaoMuda() throws Exception {
        String token = abrigo("abrigo@example.com");
        ObjectNode edicao = edicaoDeAbrigo("contato@patasunidas.org");
        edicao.put("cnpj", "11222333000181");

        mvc.perform(enviar(put("/api/abrigos/me"), token, edicao))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.nome").value("Patas Unidas"))
                .andExpect(jsonPath("$.razaoSocial").value("Associação Protetora Patas Unidas"))
                .andExpect(jsonPath("$.telefone").value("6932224444"))
                .andExpect(jsonPath("$.email").value("contato@patasunidas.org"))
                .andExpect(jsonPath("$.cnpj").value(CNPJ));
        assertThat(abrigos.count()).isEqualTo(1);
    }

    // UC10 FA02: o e-mail continua único entre pessoas e abrigos, sem diferença de maiúsculas
    @Test
    void emailDeOutraContaRecebe409EManterOProprioNao() throws Exception {
        String maria = pessoa(CPF, "maria@example.com", "RO");
        pessoa(OUTRO_CPF, "joao@example.com", "RO");
        String abrigo = abrigo("abrigo@example.com");

        for (String usado : new String[]{"JOAO@example.com", "abrigo@example.com"}) {
            mvc.perform(enviar(put("/api/usuarios/me"), maria, edicaoDePessoa(usado, "RO")))
                    .andExpect(status().isConflict())
                    .andExpect(jsonPath("$.mensagem").value("Já existe uma conta cadastrada com este e-mail"));
        }
        mvc.perform(enviar(put("/api/abrigos/me"), abrigo, edicaoDeAbrigo("Maria@example.com")))
                .andExpect(status().isConflict());
        assertThat(usuarios.findByCpf(CPF).orElseThrow().getNome()).isEqualTo("Maria Silva");

        mvc.perform(enviar(put("/api/usuarios/me"), maria, edicaoDePessoa("Maria@Example.com", "RO")))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.email").value("maria@example.com"));
    }

    // UC10 FA01: cada campo com problema volta em "campos", e nada é salvo
    @Test
    void campoVazioOuInvalidoApontaOCampoENaoSalva() throws Exception {
        String token = pessoa(CPF, "maria@example.com", "RO");
        ObjectNode edicao = edicaoDePessoa("nao-e-um-email", "RO");
        edicao.put("nome", "");
        edicao.put("telefone", "123");
        ((ObjectNode) edicao.path("endereco")).put("cep", "123");

        mvc.perform(enviar(put("/api/usuarios/me"), token, edicao))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.campos.nome").isNotEmpty())
                .andExpect(jsonPath("$.campos.telefone").isNotEmpty())
                .andExpect(jsonPath("$.campos.email").isNotEmpty())
                .andExpect(jsonPath("$.campos['endereco.cep']").isNotEmpty());

        ObjectNode semEndereco = edicaoDePessoa("maria@example.com", "RO");
        semEndereco.remove("endereco");
        mvc.perform(enviar(put("/api/usuarios/me"), token, semEndereco))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.campos.endereco").isNotEmpty());

        ObjectNode abrigoSemRazao = edicaoDeAbrigo("abrigo@example.com");
        abrigoSemRazao.put("razaoSocial", " ");
        mvc.perform(enviar(put("/api/abrigos/me"), abrigo("abrigo@example.com"), abrigoSemRazao))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.campos.razaoSocial").isNotEmpty());

        assertThat(usuarios.findByCpf(CPF).orElseThrow().getNome()).isEqualTo("Maria Silva");
    }

    // RF14: o animal usa o estado de quem cadastrou. Trocar o estado no perfil muda a vitrine
    // da pessoa e leva junto os animais que ela cadastrou
    @Test
    void mudarOEstadoMudaAVitrineEOsAnimaisDaConta() throws Exception {
        String protetora = pessoa(CPF, "maria@example.com", "RO");
        String vizinho = pessoa(OUTRO_CPF, "joao@example.com", "RO");
        String animal = cadastrarAnimal(protetora);
        vitrine(vizinho).andExpect(jsonPath("$[*].id", hasItem(animal)));

        mvc.perform(enviar(put("/api/usuarios/me"), protetora, edicaoDePessoa("maria@example.com", "SP")))
                .andExpect(status().isOk());
        vitrine(vizinho).andExpect(jsonPath("$[*].id", not(hasItem(animal))));
        mvc.perform(comToken(get("/api/animais/" + animal), vizinho))
                .andExpect(jsonPath("$.protetor.estado").value("SP"))
                .andExpect(jsonPath("$.podeDemonstrarInteresse").value(false));

        mvc.perform(enviar(put("/api/usuarios/me"), vizinho, edicaoDePessoa("joao@example.com", "SP")))
                .andExpect(status().isOk());
        vitrine(vizinho).andExpect(jsonPath("$[*].id", hasItem(animal)));
    }

    // ---------- trocar a senha ----------

    @Test
    void trocaASenhaEOLoginPassaAUsarANova() throws Exception {
        String pessoa = pessoa(CPF, "maria@example.com", "RO");
        String abrigo = abrigo("abrigo@example.com");

        mvc.perform(enviar(patch("/api/usuarios/me/senha"), pessoa, trocaDeSenha(SENHA, NOVA_SENHA, NOVA_SENHA)))
                .andExpect(status().isNoContent());
        mvc.perform(enviar(patch("/api/abrigos/me/senha"), abrigo, trocaDeSenha(SENHA, NOVA_SENHA, NOVA_SENHA)))
                .andExpect(status().isNoContent());

        String hash = usuarios.findByCpf(CPF).orElseThrow().getSenha();
        assertThat(hash).isNotEqualTo(NOVA_SENHA);
        assertThat(encoder.matches(NOVA_SENHA, hash)).isTrue();
        for (String documento : new String[]{CPF, CNPJ}) {
            login(documento, SENHA).andExpect(status().isUnauthorized());
            login(documento, NOVA_SENHA).andExpect(status().isOk());
        }
    }

    // UC10 FA04: 400, e não 401. O token continua valendo e a pessoa não é deslogada
    @Test
    void senhaAtualErradaResponde400EOTokenContinuaValendo() throws Exception {
        String token = pessoa(CPF, "maria@example.com", "RO");

        mvc.perform(enviar(patch("/api/usuarios/me/senha"), token, trocaDeSenha("senhaErrada1", NOVA_SENHA, NOVA_SENHA)))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.mensagem").value("A senha atual está incorreta"))
                .andExpect(jsonPath("$.campos.senhaAtual").value("A senha atual está incorreta"));

        mvc.perform(comToken(get("/api/usuarios/me"), token)).andExpect(status().isOk());
        assertThat(encoder.matches(SENHA, usuarios.findByCpf(CPF).orElseThrow().getSenha())).isTrue();
    }

    // UC10 FA01 e FA05: campo vazio, nova senha curta e confirmação diferente
    @Test
    void novaSenhaInvalidaApontaOCampo() throws Exception {
        String token = abrigo("abrigo@example.com");
        String rota = "/api/abrigos/me/senha";

        mvc.perform(enviar(patch(rota), token, trocaDeSenha("", NOVA_SENHA, NOVA_SENHA)))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.campos.senhaAtual").isNotEmpty());
        mvc.perform(enviar(patch(rota), token, trocaDeSenha(SENHA, "curta", "curta")))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.campos.novaSenha").isNotEmpty());
        mvc.perform(enviar(patch(rota), token, trocaDeSenha(SENHA, NOVA_SENHA, "outraSenha789")))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.campos.confirmacaoNovaSenha")
                        .value("A confirmação da nova senha deve ser igual à nova senha"));

        assertThat(encoder.matches(SENHA, abrigos.findByCnpj(CNPJ).orElseThrow().getSenha())).isTrue();
    }

    // ---------- ajudantes ----------

    // Cria a conta pela API, como no cadastro de verdade, e devolve o token
    private String pessoa(String cpf, String email, String estado) throws Exception {
        ObjectNode corpo = mapper.createObjectNode();
        corpo.put("cpf", cpf);
        corpo.put("nome", "Maria Silva");
        corpo.put("email", email);
        corpo.put("telefone", "69999998888");
        corpo.put("senha", SENHA);
        corpo.put("confirmacaoSenha", SENHA);
        corpo.set("endereco", endereco(estado));
        return cadastrar("/api/usuarios", corpo);
    }

    private String abrigo(String email) throws Exception {
        ObjectNode corpo = mapper.createObjectNode();
        corpo.put("cnpj", CNPJ);
        corpo.put("nome", "Abrigo Patas Unidas");
        corpo.put("razaoSocial", "Associação Patas Unidas");
        corpo.put("email", email);
        corpo.put("telefone", "6932221111");
        corpo.put("senha", SENHA);
        corpo.put("confirmacaoSenha", SENHA);
        corpo.set("endereco", endereco("RO"));
        return cadastrar("/api/abrigos", corpo);
    }

    private String cadastrar(String rota, ObjectNode corpo) throws Exception {
        String resposta = mvc.perform(post(rota).contentType(MediaType.APPLICATION_JSON).content(corpo.toString()))
                .andExpect(status().isCreated())
                .andReturn().getResponse().getContentAsString();
        return mapper.readTree(resposta).path("token").asText();
    }

    private ObjectNode endereco(String estado) {
        boolean rondonia = estado.equals("RO");
        ObjectNode endereco = mapper.createObjectNode();
        endereco.put("cep", rondonia ? "76801000" : "01310100");
        endereco.put("numero", "123");
        endereco.put("logradouro", rondonia ? "Avenida Sete de Setembro" : "Avenida Paulista");
        endereco.put("bairro", rondonia ? "Centro" : "Bela Vista");
        endereco.put("cidade", rondonia ? "Porto Velho" : "São Paulo");
        endereco.put("estado", estado);
        return endereco;
    }

    // Corpo do PUT /api/usuarios/me: todos os campos editáveis, mesmo os que não mudaram
    private ObjectNode edicaoDePessoa(String email, String estado) {
        ObjectNode corpo = mapper.createObjectNode();
        corpo.put("nome", "Maria Silva Souza");
        corpo.put("telefone", "69999997777");
        corpo.put("email", email);
        corpo.set("endereco", endereco(estado));
        return corpo;
    }

    private ObjectNode edicaoDeAbrigo(String email) {
        ObjectNode corpo = mapper.createObjectNode();
        corpo.put("nome", "Patas Unidas");
        corpo.put("razaoSocial", "Associação Protetora Patas Unidas");
        corpo.put("telefone", "6932224444");
        corpo.put("email", email);
        corpo.set("endereco", endereco("RO"));
        return corpo;
    }

    private ObjectNode trocaDeSenha(String atual, String nova, String confirmacao) {
        ObjectNode corpo = mapper.createObjectNode();
        corpo.put("senhaAtual", atual);
        corpo.put("novaSenha", nova);
        corpo.put("confirmacaoNovaSenha", confirmacao);
        return corpo;
    }

    // Cadastra um animal (o mesmo corpo do InteresseIntegrationTest) e devolve o id
    private String cadastrarAnimal(String token) throws Exception {
        String corpo = """
                {"nome":"Mel","especie":"CAO","raca":"SRD_CAO","sexo":"FEMEA","porte":"MEDIO","peso":12.5,
                 "dataNascEstimada":"2020-01-01","castrado":true,"energia":"MAIS_CALMO",
                 "convivencia":{"crianca":"NAO_TESTADO","gato":"CONVIVE_BEM","cao":"NAO_CONVIVE_BEM"},
                 "historia":"Resgatada","fotos":["https://example.com/mel.jpg"],
                 "vacinas":[{"nome":"V10","dose":1,"dataAplicacao":"2024-01-01"}]}
                """;
        String resposta = mvc.perform(comToken(post("/api/animais"), token)
                        .contentType(MediaType.APPLICATION_JSON).content(corpo))
                .andExpect(status().isCreated())
                .andReturn().getResponse().getContentAsString();
        return mapper.readTree(resposta).path("id").asText();
    }

    private ResultActions vitrine(String token) throws Exception {
        return mvc.perform(comToken(get("/api/animais"), token)).andExpect(status().isOk());
    }

    private ResultActions login(String documento, String senha) throws Exception {
        return mvc.perform(post("/api/auth/login").contentType(MediaType.APPLICATION_JSON)
                .content(mapper.writeValueAsString(Map.of("documento", documento, "senha", senha))));
    }

    private MockHttpServletRequestBuilder comToken(MockHttpServletRequestBuilder request, String token) {
        return request.header("Authorization", "Bearer " + token);
    }

    private MockHttpServletRequestBuilder enviar(MockHttpServletRequestBuilder request, String token,
                                                 ObjectNode corpo) {
        return comToken(request, token).contentType(MediaType.APPLICATION_JSON).content(corpo.toString());
    }
}