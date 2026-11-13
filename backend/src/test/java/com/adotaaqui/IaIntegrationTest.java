package com.adotaaqui;

import com.adotaaqui.model.Abrigo;
import com.adotaaqui.model.Animal;
import com.adotaaqui.model.Endereco;
import com.adotaaqui.model.Usuario;
import com.adotaaqui.model.enums.Especie;
import com.adotaaqui.model.enums.NivelEnergia;
import com.adotaaqui.model.enums.Porte;
import com.adotaaqui.model.enums.Raca;
import com.adotaaqui.model.enums.SexoAnimal;
import com.adotaaqui.model.enums.StatusAdocao;
import com.adotaaqui.model.enums.TipoConta;
import com.adotaaqui.repository.AbrigoRepository;
import com.adotaaqui.repository.AnimalRepository;
import com.adotaaqui.repository.UsuarioRepository;
import com.adotaaqui.security.JwtService;
import com.adotaaqui.service.GeradorDeTexto;
import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.mockito.ArgumentCaptor;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.http.MediaType;
import org.springframework.test.context.bean.override.mockito.MockitoBean;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.request.MockHttpServletRequestBuilder;

import java.time.Instant;
import java.time.LocalDate;
import java.util.UUID;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyString;
import static org.mockito.ArgumentMatchers.isNull;
import static org.mockito.ArgumentMatchers.notNull;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

// As ajudas com IA. O Gemini de verdade fica de fora: o GeradorDeTexto aqui é de mentira (Mockito),
// e cada teste diz o que a "IA" responde. Assim o teste não usa internet nem gasta a cota.
// O limite fica em 3 pedidos por hora, pra dar pra testar o 429 rápido
@SpringBootTest(properties = "app.ia.limite-por-hora=3")
@AutoConfigureMockMvc
class IaIntegrationTest {
    @Autowired MockMvc mvc;
    @Autowired AnimalRepository animais;
    @Autowired UsuarioRepository usuarios;
    @Autowired AbrigoRepository abrigos;
    @Autowired JwtService jwt;
    @MockitoBean GeradorDeTexto gerador;
    private int sequencia;

    @BeforeEach
    @AfterEach
    void limpar() {
        animais.deleteAll();
        usuarios.deleteAll();
        abrigos.deleteAll();
    }

    @BeforeEach
    void iaLigada() {
        when(gerador.configurado()).thenReturn(true);
    }

    @Test
    void contaSeAIaEstaLigadaPraQualquerPessoa() throws Exception {
        mvc.perform(get("/api/ia/disponivel")).andExpect(status().isOk())
                .andExpect(jsonPath("$.disponivel").value(true));
        when(gerador.configurado()).thenReturn(false);
        mvc.perform(get("/api/ia/disponivel")).andExpect(jsonPath("$.disponivel").value(false));
    }

    @Test
    void descricaoPrecisaDeLoginEUsaOQueOProtetorPreencheu() throws Exception {
        String corpo = """
                {"nome": "Mel", "especie": "CAO", "sexo": "FEMEA", "porte": "MEDIO", "raca": "SRD_CAO",
                 "castrado": true, "energia": "MAIS_CALMO", "convivenciaCrianca": "CONVIVE_BEM",
                 "convivenciaGato": "NAO_TESTADO", "vacinas": ["V10"], "cidade": "Porto Velho", "estado": "RO",
                 "rascunho": "Foi achada na chuva e adora colo"}""";
        mvc.perform(post("/api/ia/descricao").contentType(MediaType.APPLICATION_JSON).content(corpo))
                .andExpect(status().isUnauthorized());

        when(gerador.gerar(anyString(), anyString(), isNull()))
                .thenReturn("Mel é uma cadela \u2014 muito **dócil**.\n\nAdora colo.");
        mvc.perform(auth(post("/api/ia/descricao"), usuario("RO")).contentType(MediaType.APPLICATION_JSON).content(corpo))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.texto").value("Mel é uma cadela, muito dócil.\n\nAdora colo."));

        ArgumentCaptor<String> pedido = ArgumentCaptor.forClass(String.class);
        verify(gerador).gerar(anyString(), pedido.capture(), isNull());
        assertThat(pedido.getValue()).contains("Nome: Mel", "Espécie: cão", "Sexo: fêmea", "Porte: médio",
                "Raça: Sem raça definida", "Castrado: sim", "Energia: mais calmo", "Com crianças: convive bem",
                "Com gatos: ainda não testado", "Vacinas: V10", "Está em: Porto Velho/RO",
                "Rascunho do protetor: Foi achada na chuva e adora colo");
    }

    @Test
    void descricaoSemNomeOuComIaDesligadaExplicaOQueAconteceu() throws Exception {
        String token = usuario("RO");
        mvc.perform(auth(post("/api/ia/descricao"), token).contentType(MediaType.APPLICATION_JSON)
                        .content("{\"especie\": \"GATO\"}"))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.campos.nome").value("Informe o nome do animal antes de pedir o texto"));

        when(gerador.configurado()).thenReturn(false);
        mvc.perform(auth(post("/api/ia/descricao"), token).contentType(MediaType.APPLICATION_JSON)
                        .content("{\"nome\": \"Mia\", \"especie\": \"GATO\"}"))
                .andExpect(status().isServiceUnavailable())
                .andExpect(jsonPath("$.mensagem").value("A ajuda com IA não está disponível agora. Tente de novo em instantes."));
        verify(gerador, never()).gerar(anyString(), anyString(), any());
    }

    @Test
    void sugereSoAnimaisDaListaDoEstadoDaPessoaSemRepetirNemInventar() throws Exception {
        Abrigo emRondonia = abrigo("RO");
        animal("Mel", emRondonia, "RO", StatusAdocao.DISPONIVEL);
        animal("Thor", emRondonia, "RO", StatusAdocao.DISPONIVEL);
        animal("Luna", emRondonia, "SP", StatusAdocao.DISPONIVEL);
        animal("Bidu", emRondonia, "RO", StatusAdocao.ADOTADO);
        // A "IA" escolhe o 2, inventa o 99, repete o 2 e escolhe o 1
        when(gerador.gerar(anyString(), anyString(), notNull())).thenReturn("""
                {"sugestoes": [{"numero": 2, "motivo": "Combina com apartamento."},
                               {"numero": 99, "motivo": "Animal inventado"},
                               {"numero": 2, "motivo": "Repetido"},
                               {"numero": 1, "motivo": "Gosta de crianças."}],
                 "conselho": "Visite o animal antes de decidir."}""");

        mvc.perform(auth(post("/api/ia/sugestoes"), usuario("RO")).contentType(MediaType.APPLICATION_JSON)
                        .content("{\"rotina\": \"Moro em apartamento e trabalho fora 8 horas por dia\", \"estado\": \"SP\"}"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.sugestoes.length()").value(2))
                .andExpect(jsonPath("$.sugestoes[0].motivo").value("Combina com apartamento."))
                .andExpect(jsonPath("$.sugestoes[1].motivo").value("Gosta de crianças."))
                .andExpect(jsonPath("$.sugestoes[0].animal.estado").value("RO"))
                .andExpect(jsonPath("$.conselho").value("Visite o animal antes de decidir."));

        // A lista que foi pra IA: só os disponíveis de Rondônia (o estado do perfil vale mais que o do pedido)
        ArgumentCaptor<String> pedido = ArgumentCaptor.forClass(String.class);
        verify(gerador).gerar(anyString(), pedido.capture(), notNull());
        assertThat(pedido.getValue()).contains("Moro em apartamento", "Mel", "Thor").doesNotContain("Luna", "Bidu");
        assertThat(pedido.getValue()).doesNotContain("@example.com", "69999998888");
    }

    @Test
    void visitanteEscolheOEstadoEOResultadoSegueAOrdemDaLista() throws Exception {
        Abrigo abrigo = abrigo("SP");
        animal("Luna", abrigo, "SP", StatusAdocao.DISPONIVEL);
        animal("Mel", abrigo, "RO", StatusAdocao.DISPONIVEL);
        when(gerador.gerar(anyString(), anyString(), notNull()))
                .thenReturn("```json\n{\"sugestoes\": [{\"numero\": 1, \"motivo\": \"Calma.\"}], \"conselho\": \"\"}\n```");

        mvc.perform(post("/api/ia/sugestoes").header("X-Forwarded-For", "10.0.0.1")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"rotina\": \"Moro numa casa com quintal grande\", \"estado\": \"SP\"}"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.sugestoes.length()").value(1))
                .andExpect(jsonPath("$.sugestoes[0].animal.nome").value("Luna"));
    }

    @Test
    void semAnimalNoEstadoNemChamaAIa() throws Exception {
        mvc.perform(auth(post("/api/ia/sugestoes"), usuario("AC")).contentType(MediaType.APPLICATION_JSON)
                        .content("{\"rotina\": \"Moro sozinha e trabalho de casa\"}"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.sugestoes").isEmpty())
                .andExpect(jsonPath("$.conselho").value(org.hamcrest.Matchers.startsWith("Ainda não tem animais")));
        verify(gerador, never()).gerar(anyString(), anyString(), any());
    }

    @Test
    void rotinaCurtaRespostaEstranhaELimiteDeUso() throws Exception {
        animal("Mel", abrigo("RO"), "RO", StatusAdocao.DISPONIVEL);
        mvc.perform(pedirSugestao("10.0.0.2", "curta")).andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.campos.rotina").value("Conte a sua rotina em 15 a 600 caracteres"));

        when(gerador.gerar(anyString(), anyString(), notNull())).thenReturn("Não sei responder isso.");
        mvc.perform(pedirSugestao("10.0.0.2", "Moro em apartamento pequeno")).andExpect(status().isServiceUnavailable())
                .andExpect(jsonPath("$.mensagem").value("A IA respondeu de um jeito que o site não entendeu. Tente de novo."));

        // O limite é por endereço: o 10.0.0.3 faz 3 pedidos, o 4º é recusado, e outro endereço continua
        when(gerador.gerar(anyString(), anyString(), notNull())).thenReturn("{\"sugestoes\": [], \"conselho\": \"\"}");
        for (int pedido = 0; pedido < 3; pedido++) {
            mvc.perform(pedirSugestao("10.0.0.3", "Moro em apartamento pequeno")).andExpect(status().isOk());
        }
        mvc.perform(pedirSugestao("10.0.0.3", "Moro em apartamento pequeno")).andExpect(status().isTooManyRequests())
                .andExpect(jsonPath("$.mensagem").value("Você já usou a IA muitas vezes nesta hora. Tente de novo mais tarde."));
        mvc.perform(pedirSugestao("10.0.0.4", "Moro em apartamento pequeno")).andExpect(status().isOk());
    }

    private MockHttpServletRequestBuilder pedirSugestao(String endereco, String rotina) {
        return post("/api/ia/sugestoes").header("X-Forwarded-For", endereco).contentType(MediaType.APPLICATION_JSON)
                .content("{\"rotina\": \"" + rotina + "\"}");
    }

    private MockHttpServletRequestBuilder auth(MockHttpServletRequestBuilder request, String token) {
        return request.header("Authorization", "Bearer " + token);
    }

    private String usuario(String estado) {
        int numero = ++sequencia;
        Usuario usuario = new Usuario();
        usuario.setCpf(String.format("%011d", numero));
        usuario.setNome("Pessoa " + numero);
        usuario.setEmail("ia-pessoa" + numero + "@example.com");
        usuario.setTelefone("69999998888");
        usuario.setSenha("hash-de-fixture");
        usuario.setEndereco(endereco(estado));
        UUID id = usuarios.saveAndFlush(usuario).getId();
        return jwt.gerarToken(id, TipoConta.USUARIO, Instant.now().plusSeconds(600));
    }

    private Abrigo abrigo(String estado) {
        int numero = ++sequencia;
        Abrigo abrigo = new Abrigo();
        abrigo.setCnpj(String.format("%014d", numero));
        abrigo.setNome("Abrigo " + numero);
        abrigo.setRazaoSocial("Abrigo " + numero);
        abrigo.setEmail("ia-abrigo" + numero + "@example.com");
        abrigo.setTelefone("69999998888");
        abrigo.setSenha("hash-de-fixture");
        abrigo.setEndereco(endereco(estado));
        return abrigos.saveAndFlush(abrigo);
    }

    private void animal(String nome, Abrigo abrigo, String estado, StatusAdocao status) {
        Animal animal = new Animal();
        animal.setNome(nome);
        animal.setCidade("Cidade");
        animal.setEstado(estado);
        animal.setEspecie(Especie.CAO);
        animal.setRaca(Raca.SRD_CAO);
        animal.setSexo(SexoAnimal.FEMEA);
        animal.setPorte(Porte.MEDIO);
        animal.setEnergia(NivelEnergia.MAIS_CALMO);
        animal.setDataNascEstimada(LocalDate.of(2022, 1, 1));
        animal.setCastrado(true);
        animal.setHistoria("Resgatada na chuva");
        animal.getFotos().add("https://example.com/" + nome + ".jpg");
        animal.setAbrigo(abrigo);
        animal.setStatusAdocao(status);
        animais.saveAndFlush(animal);
    }

    private static Endereco endereco(String estado) {
        Endereco endereco = new Endereco();
        endereco.setCep("76801000");
        endereco.setEstado(estado);
        endereco.setCidade("Porto Velho");
        endereco.setNumero("1");
        return endereco;
    }
}
