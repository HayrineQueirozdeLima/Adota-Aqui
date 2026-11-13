package com.adotaaqui;

import com.adotaaqui.model.Abrigo;
import com.adotaaqui.model.Endereco;
import com.adotaaqui.model.FeiraDeAdocao;
import com.adotaaqui.model.Usuario;
import com.adotaaqui.model.enums.TipoConta;
import com.adotaaqui.repository.AbrigoRepository;
import com.adotaaqui.repository.FeiraRepository;
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
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.request.MockHttpServletRequestBuilder;

import java.time.Instant;
import java.time.LocalDate;
import java.time.LocalTime;
import java.time.ZoneId;
import java.util.UUID;

import static org.assertj.core.api.Assertions.assertThat;
import static org.hamcrest.Matchers.startsWith;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.delete;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.put;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.header;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

// Feiras de adoção: só abrigo divulga, qualquer pessoa vê as que ainda vão acontecer
@SpringBootTest
@AutoConfigureMockMvc
class FeiraIntegrationTest {
    @Autowired MockMvc mvc;
    @Autowired ObjectMapper mapper;
    @Autowired FeiraRepository feiras;
    @Autowired UsuarioRepository usuarios;
    @Autowired AbrigoRepository abrigos;
    @Autowired JwtService jwt;
    private int sequencia;

    // As datas dos testes são contadas a partir de hoje, no mesmo fuso que o service usa
    private static final LocalDate HOJE = LocalDate.now(ZoneId.of("America/Sao_Paulo"));

    private record Conta(UUID id, String token) {}

    @BeforeEach
    @AfterEach
    void limpar() {
        feiras.deleteAll();
        usuarios.deleteAll();
        abrigos.deleteAll();
        sequencia = 0;
    }

    @Test
    void abrigoDivulgaEQualquerPessoaVeAsProximasPelaData() throws Exception {
        Conta abrigo = abrigo();
        mvc.perform(divulgar(abrigo, feira("Feira de dezembro", HOJE.plusDays(10))))
                .andExpect(status().isCreated()).andExpect(header().exists("Location"))
                .andExpect(jsonPath("$.ehMinha").value(true));
        criar(abrigo, feira("Feira de hoje", HOJE));
        criar(abrigo, feira("Feira da semana", HOJE.plusDays(3)));
        // A que já passou não aparece na lista
        passada(abrigo, "Feira do mês passado");

        String lista = mvc.perform(get("/api/feiras")).andExpect(status().isOk())
                .andExpect(jsonPath("$.totalItens").value(3))
                .andExpect(jsonPath("$.itens[0].titulo").value("Feira de hoje"))
                .andExpect(jsonPath("$.itens[1].titulo").value("Feira da semana"))
                .andExpect(jsonPath("$.itens[2].titulo").value("Feira de dezembro"))
                .andExpect(jsonPath("$.itens[0].data").value(HOJE.toString()))
                .andExpect(jsonPath("$.itens[0].horaInicio").value(startsWith("09:00")))
                .andExpect(jsonPath("$.itens[0].horaFim").value(startsWith("13:00")))
                .andExpect(jsonPath("$.itens[0].local").value("Praça Central"))
                .andExpect(jsonPath("$.itens[0].abrigo.nome").value("Abrigo 1"))
                .andExpect(jsonPath("$.itens[0].ehMinha").value(false))
                .andReturn().getResponse().getContentAsString();
        // Sem contato do abrigo na lista
        assertThat(lista).doesNotContain("@example.com", "6932221111");

        mvc.perform(auth(get("/api/feiras"), abrigo)).andExpect(jsonPath("$.itens[0].ehMinha").value(true));
        mvc.perform(get("/api/feiras").param("tamanho", "2"))
                .andExpect(jsonPath("$.itens.length()").value(2)).andExpect(jsonPath("$.totalPaginas").value(2));
    }

    @Test
    void filtraPeloEstadoEPelaCidadeSemLigarPraAcento() throws Exception {
        Conta abrigo = abrigo();
        criar(abrigo, feira("Feira em Porto Velho", HOJE.plusDays(2)));
        criar(abrigo, feira("Feira em São Paulo", HOJE.plusDays(2)).put("cidade", "São Paulo").put("estado", "SP"));

        mvc.perform(get("/api/feiras").param("estado", "SP"))
                .andExpect(jsonPath("$.totalItens").value(1))
                .andExpect(jsonPath("$.itens[0].titulo").value("Feira em São Paulo"));
        mvc.perform(get("/api/feiras").param("cidade", "sao"))
                .andExpect(jsonPath("$.totalItens").value(1))
                .andExpect(jsonPath("$.itens[0].cidade").value("São Paulo"));
        mvc.perform(get("/api/feiras").param("estado", "RO").param("cidade", "porto"))
                .andExpect(jsonPath("$.totalItens").value(1));
        mvc.perform(get("/api/feiras").param("estado", "XX")).andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.campos.estado").value("Escolha um estado válido"));
    }

    @Test
    void soAbrigoDivulgaFeira() throws Exception {
        Conta pessoa = usuario();
        mvc.perform(divulgar(pessoa, feira("Feira da pessoa", HOJE.plusDays(1)))).andExpect(status().isForbidden())
                .andExpect(jsonPath("$.mensagem").value("Só abrigos divulgam feiras de adoção"));
        mvc.perform(auth(get("/api/feiras/minhas"), pessoa)).andExpect(status().isForbidden());
        mvc.perform(post("/api/feiras").contentType(MediaType.APPLICATION_JSON)
                .content(feira("Feira sem login", HOJE.plusDays(1)).toString())).andExpect(status().isUnauthorized());
        mvc.perform(get("/api/feiras/minhas")).andExpect(status().isUnauthorized());
        assertThat(feiras.count()).isZero();
    }

    @Test
    void recusaFeiraIncompletaNoPassadoOuQueTerminaAntesDeComecar() throws Exception {
        Conta abrigo = abrigo();
        mvc.perform(divulgar(abrigo, mapper.createObjectNode())).andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.campos.titulo").value("O título é obrigatório"))
                .andExpect(jsonPath("$.campos.data").value("Informe a data da feira"))
                .andExpect(jsonPath("$.campos.horaInicio").value("Informe a hora em que a feira começa"))
                .andExpect(jsonPath("$.campos.local").value("Informe o nome do local"))
                .andExpect(jsonPath("$.campos.endereco").value("Informe o endereço"))
                .andExpect(jsonPath("$.campos.cidade").value("Informe a cidade"))
                .andExpect(jsonPath("$.campos.estado").value("Escolha o estado"));
        mvc.perform(divulgar(abrigo, feira("Feira de ontem", HOJE.minusDays(1)))).andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.campos.data").value("A data da feira já passou"));
        mvc.perform(divulgar(abrigo, feira("Feira ao contrário", HOJE.plusDays(1)).put("horaFim", "08:00")))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.campos.horaFim").value("A feira deve terminar depois de começar"));
        mvc.perform(divulgar(abrigo, feira("Feira sem estado", HOJE.plusDays(1)).put("estado", "XX")))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.campos.estado").value("Escolha um estado válido"));
        assertThat(feiras.count()).isZero();
    }

    @Test
    void soOAbrigoQueDivulgouEditaEApaga() throws Exception {
        Conta dono = abrigo();
        Conta outro = abrigo();
        String id = criar(dono, feira("Feira de sábado", HOJE.plusDays(5)));

        mvc.perform(auth(put("/api/feiras/" + id), outro).contentType(MediaType.APPLICATION_JSON)
                        .content(feira("Feira roubada", HOJE.plusDays(5)).toString()))
                .andExpect(status().isForbidden())
                .andExpect(jsonPath("$.mensagem").value("Somente o abrigo que divulgou pode alterar ou apagar a feira"));
        mvc.perform(auth(delete("/api/feiras/" + id), outro)).andExpect(status().isForbidden());

        mvc.perform(auth(put("/api/feiras/" + id), dono).contentType(MediaType.APPLICATION_JSON)
                        .content(feira("Feira de domingo", HOJE.plusDays(6)).put("descricao", "  ").toString()))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.titulo").value("Feira de domingo"))
                .andExpect(jsonPath("$.data").value(HOJE.plusDays(6).toString()))
                .andExpect(jsonPath("$.descricao").isEmpty());
        mvc.perform(get("/api/feiras/" + id)).andExpect(status().isOk())
                .andExpect(jsonPath("$.titulo").value("Feira de domingo")).andExpect(jsonPath("$.ehMinha").value(false));

        mvc.perform(auth(delete("/api/feiras/" + id), dono)).andExpect(status().isNoContent());
        mvc.perform(get("/api/feiras/" + id)).andExpect(status().isNotFound());
        mvc.perform(get("/api/feiras/" + UUID.randomUUID())).andExpect(status().isNotFound());
    }

    @Test
    void minhasFeirasTrazInclusiveAsQueJaPassaram() throws Exception {
        Conta abrigo = abrigo();
        Conta outro = abrigo();
        criar(abrigo, feira("Feira que vem", HOJE.plusDays(4)));
        passada(abrigo, "Feira que passou");
        criar(outro, feira("Feira de outro abrigo", HOJE.plusDays(4)));

        mvc.perform(auth(get("/api/feiras/minhas"), abrigo)).andExpect(status().isOk())
                .andExpect(jsonPath("$.length()").value(2))
                .andExpect(jsonPath("$[0].titulo").value("Feira que vem"))
                .andExpect(jsonPath("$[1].titulo").value("Feira que passou"))
                .andExpect(jsonPath("$[1].ehMinha").value(true));
    }

    private ObjectNode feira(String titulo, LocalDate data) {
        ObjectNode corpo = mapper.createObjectNode();
        corpo.put("titulo", titulo);
        corpo.put("descricao", "Cães e gatos castrados e vacinados esperando um lar.");
        corpo.put("data", data.toString());
        corpo.put("horaInicio", "09:00");
        corpo.put("horaFim", "13:00");
        corpo.put("local", "Praça Central");
        corpo.put("endereco", "Avenida Sete de Setembro, 100, Centro");
        corpo.put("cidade", "Porto Velho");
        corpo.put("estado", "RO");
        return corpo;
    }

    private MockHttpServletRequestBuilder divulgar(Conta conta, ObjectNode corpo) {
        return auth(post("/api/feiras"), conta).contentType(MediaType.APPLICATION_JSON).content(corpo.toString());
    }

    private String criar(Conta conta, ObjectNode corpo) throws Exception {
        return mapper.readTree(mvc.perform(divulgar(conta, corpo)).andExpect(status().isCreated())
                .andReturn().getResponse().getContentAsString()).path("id").asText();
    }

    // A API não aceita feira no passado, então a que já aconteceu entra direto pelo repositório
    private void passada(Conta conta, String titulo) {
        FeiraDeAdocao feira = new FeiraDeAdocao();
        feira.setTitulo(titulo);
        feira.setData(HOJE.minusDays(30));
        feira.setHoraInicio(LocalTime.of(9, 0));
        feira.setHoraFim(LocalTime.of(13, 0));
        feira.setLocal("Praça Central");
        feira.setEndereco("Avenida Sete de Setembro, 100, Centro");
        feira.setCidade("Porto Velho");
        feira.setEstado("RO");
        feira.setAbrigo(abrigos.findById(conta.id()).orElseThrow());
        feiras.saveAndFlush(feira);
    }

    private MockHttpServletRequestBuilder auth(MockHttpServletRequestBuilder request, Conta conta) {
        return request.header("Authorization", "Bearer " + conta.token());
    }

    private Conta usuario() {
        int numero = ++sequencia;
        Usuario usuario = new Usuario();
        usuario.setCpf(String.format("%011d", numero));
        usuario.setNome("Pessoa " + numero);
        usuario.setEmail("feira" + numero + "@example.com");
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
        abrigo.setEmail("feira-abrigo" + numero + "@example.com");
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
