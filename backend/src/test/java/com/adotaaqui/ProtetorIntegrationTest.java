package com.adotaaqui;

import com.adotaaqui.model.Abrigo;
import com.adotaaqui.model.Animal;
import com.adotaaqui.model.Endereco;
import com.adotaaqui.model.Interesse;
import com.adotaaqui.model.Usuario;
import com.adotaaqui.model.enums.ConvivenciaAnimal;
import com.adotaaqui.model.enums.ConvivenciaCrianca;
import com.adotaaqui.model.enums.Especie;
import com.adotaaqui.model.enums.MomentoContato;
import com.adotaaqui.model.enums.NivelEnergia;
import com.adotaaqui.model.enums.Porte;
import com.adotaaqui.model.enums.ProgramacaoViagem;
import com.adotaaqui.model.enums.Raca;
import com.adotaaqui.model.enums.SexoAnimal;
import com.adotaaqui.model.enums.StatusAdocao;
import com.adotaaqui.model.enums.StatusInteresse;
import com.adotaaqui.model.enums.TempoSozinho;
import com.adotaaqui.model.enums.TipoMoradia;
import com.adotaaqui.repository.AbrigoRepository;
import com.adotaaqui.repository.AnimalRepository;
import com.adotaaqui.repository.InteresseRepository;
import com.adotaaqui.repository.UsuarioRepository;
import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.test.web.servlet.MockMvc;

import java.time.LocalDate;

import static org.hamcrest.Matchers.contains;
import static org.hamcrest.Matchers.hasSize;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

// GET /api/protetores: a página de abrigos e protetores independentes
@SpringBootTest
@AutoConfigureMockMvc
class ProtetorIntegrationTest {
    @Autowired MockMvc mvc;
    @Autowired AnimalRepository animais;
    @Autowired UsuarioRepository usuarios;
    @Autowired AbrigoRepository abrigos;
    @Autowired InteresseRepository interesses;

    private int documentos;

    @BeforeEach
    @AfterEach
    void limpar() {
        animais.deleteAll();
        usuarios.deleteAll();
        abrigos.deleteAll();
    }

    // Os protetores dos testes:
    // Refúgio Quatro Estações (abrigo, São Paulo/SP), sem animal
    // Cauda Alegre (abrigo, Porto Velho/RO), com 2 disponíveis e 1 adotado pelo site
    // Ágata Moura (pessoa, Porto Velho/RO), com 1 disponível
    // Diego Andrade (pessoa, Porto Velho/RO), que nunca cadastrou animal e por isso não é protetor
    private void cadastrarProtetores() {
        abrigo("Refúgio Quatro Estações", "SP", "São Paulo");
        Abrigo cauda = abrigo("Cauda Alegre", "RO", "Porto Velho");
        Usuario agata = usuario("Ágata Moura");
        Usuario diego = usuario("Diego Andrade");

        animal(cauda, null, StatusAdocao.DISPONIVEL);
        animal(cauda, null, StatusAdocao.DISPONIVEL);
        Animal adotado = animal(cauda, null, StatusAdocao.ADOTADO);
        interesse(adotado, diego, StatusInteresse.APROVADO);
        animal(null, agata, StatusAdocao.DISPONIVEL);
    }

    @Test
    void visitanteVeAbrigosEProtetoresEmOrdemAlfabeticaComAsContagens() throws Exception {
        cadastrarProtetores();

        mvc.perform(get("/api/protetores")).andExpect(status().isOk())
                // Ágata vem antes, mesmo começando com acento. Diego não aparece: nunca cadastrou animal
                .andExpect(jsonPath("$.itens[*].nome",
                        contains("Ágata Moura", "Cauda Alegre", "Refúgio Quatro Estações")))
                .andExpect(jsonPath("$.itens[*].tipo", contains("USUARIO", "ABRIGO", "ABRIGO")))
                .andExpect(jsonPath("$.itens[1].cidade").value("Porto Velho"))
                .andExpect(jsonPath("$.itens[1].estado").value("RO"))
                .andExpect(jsonPath("$.itens[1].animaisDisponiveis").value(2))
                .andExpect(jsonPath("$.itens[1].adocoes").value(1))
                .andExpect(jsonPath("$.itens[0].animaisDisponiveis").value(1))
                .andExpect(jsonPath("$.itens[0].adocoes").value(0))
                .andExpect(jsonPath("$.itens[2].animaisDisponiveis").value(0))
                .andExpect(jsonPath("$.totalItens").value(3))
                .andExpect(jsonPath("$.pagina").value(0))
                .andExpect(jsonPath("$.tamanho").value(12))
                .andExpect(jsonPath("$.totalPaginas").value(1));
    }

    @Test
    void naoMostraContatoNemDocumento() throws Exception {
        cadastrarProtetores();

        mvc.perform(get("/api/protetores")).andExpect(status().isOk())
                .andExpect(jsonPath("$.itens[1].email").doesNotExist())
                .andExpect(jsonPath("$.itens[1].telefone").doesNotExist())
                .andExpect(jsonPath("$.itens[1].cnpj").doesNotExist())
                .andExpect(jsonPath("$.itens[0].cpf").doesNotExist());
    }

    @Test
    void filtraPeloTipo() throws Exception {
        cadastrarProtetores();

        mvc.perform(get("/api/protetores").param("tipo", "ABRIGO")).andExpect(status().isOk())
                .andExpect(jsonPath("$.itens[*].nome", contains("Cauda Alegre", "Refúgio Quatro Estações")));
        mvc.perform(get("/api/protetores").param("tipo", "USUARIO")).andExpect(status().isOk())
                .andExpect(jsonPath("$.itens[*].nome", contains("Ágata Moura")));
    }

    @Test
    void filtraPeloEstadoPelaCidadeEPeloNomeSemLigarPraAcentoNemMaiuscula() throws Exception {
        cadastrarProtetores();

        mvc.perform(get("/api/protetores").param("estado", "sp")).andExpect(status().isOk())
                .andExpect(jsonPath("$.itens[*].nome", contains("Refúgio Quatro Estações")));
        mvc.perform(get("/api/protetores").param("cidade", "PORTO")).andExpect(status().isOk())
                .andExpect(jsonPath("$.itens[*].nome", contains("Ágata Moura", "Cauda Alegre")));
        mvc.perform(get("/api/protetores").param("busca", "refugio")).andExpect(status().isOk())
                .andExpect(jsonPath("$.itens[*].nome", contains("Refúgio Quatro Estações")));
        mvc.perform(get("/api/protetores").param("busca", "agata").param("estado", "RO"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.itens[*].nome", contains("Ágata Moura")));
        mvc.perform(get("/api/protetores").param("busca", "ninguem")).andExpect(status().isOk())
                .andExpect(jsonPath("$.itens", hasSize(0)))
                .andExpect(jsonPath("$.totalItens").value(0))
                .andExpect(jsonPath("$.totalPaginas").value(0));
    }

    @Test
    void vemEmPaginas() throws Exception {
        cadastrarProtetores();

        mvc.perform(get("/api/protetores").param("tamanho", "2")).andExpect(status().isOk())
                .andExpect(jsonPath("$.itens[*].nome", contains("Ágata Moura", "Cauda Alegre")))
                .andExpect(jsonPath("$.totalItens").value(3))
                .andExpect(jsonPath("$.totalPaginas").value(2));
        mvc.perform(get("/api/protetores").param("tamanho", "2").param("pagina", "1"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.itens[*].nome", contains("Refúgio Quatro Estações")))
                .andExpect(jsonPath("$.pagina").value(1));
        // Página depois da última: vem vazia, sem erro
        mvc.perform(get("/api/protetores").param("tamanho", "2").param("pagina", "5"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.itens", hasSize(0)))
                .andExpect(jsonPath("$.totalItens").value(3));
    }

    @Test
    void filtroInvalidoRecebe400() throws Exception {
        mvc.perform(get("/api/protetores").param("tipo", "ONG"))
                .andExpect(status().isBadRequest());
        mvc.perform(get("/api/protetores").param("estado", "Rondonia"))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.campos.estado").value("Use a sigla do estado, com 2 letras"));
        mvc.perform(get("/api/protetores").param("tamanho", "49"))
                .andExpect(status().isBadRequest());
    }

    @Test
    void tokenInvalidoRecebe401ComoNasOutrasRotasPublicas() throws Exception {
        mvc.perform(get("/api/protetores").header("Authorization", "Bearer invalido"))
                .andExpect(status().isUnauthorized());
    }

    private Endereco endereco(String estado, String cidade) {
        Endereco endereco = new Endereco();
        endereco.setCep("76801000");
        endereco.setEstado(estado);
        endereco.setCidade(cidade);
        endereco.setNumero("1");
        return endereco;
    }

    private Abrigo abrigo(String nome, String estado, String cidade) {
        documentos++;
        Abrigo abrigo = new Abrigo();
        abrigo.setCnpj(String.format("%014d", documentos));
        abrigo.setNome(nome);
        abrigo.setRazaoSocial(nome);
        abrigo.setEmail("protetores-abrigo" + documentos + "@example.com");
        abrigo.setTelefone("69999998888");
        abrigo.setSenha("hash-de-fixture");
        abrigo.setEndereco(endereco(estado, cidade));
        return abrigos.saveAndFlush(abrigo);
    }

    private Usuario usuario(String nome) {
        documentos++;
        Usuario usuario = new Usuario();
        usuario.setCpf(String.format("%011d", documentos));
        usuario.setNome(nome);
        usuario.setEmail("protetores-pessoa" + documentos + "@example.com");
        usuario.setTelefone("69999998888");
        usuario.setSenha("hash-de-fixture");
        usuario.setEndereco(endereco("RO", "Porto Velho"));
        return usuarios.saveAndFlush(usuario);
    }

    private Animal animal(Abrigo abrigo, Usuario usuario, StatusAdocao status) {
        Animal animal = new Animal();
        animal.setNome("Mel");
        animal.setEspecie(Especie.CAO);
        animal.setRaca(Raca.SRD_CAO);
        animal.setSexo(SexoAnimal.FEMEA);
        animal.setPorte(Porte.MEDIO);
        animal.setEnergia(NivelEnergia.MAIS_CALMO);
        animal.setDataNascEstimada(LocalDate.of(2022, 1, 1));
        animal.setCastrado(true);
        animal.setHistoria("Resgatada");
        animal.getFotos().add("https://example.com/mel.jpg");
        animal.setAbrigo(abrigo);
        animal.setUsuario(usuario);
        animal.setStatusAdocao(status);
        return animais.saveAndFlush(animal);
    }

    private void interesse(Animal animal, Usuario candidato, StatusInteresse status) {
        Interesse interesse = new Interesse();
        interesse.setAnimal(animal);
        interesse.setUsuario(candidato);
        interesse.setStatusAndamento(status);
        interesse.setMoradia(TipoMoradia.CASA_COM_QUINTAL);
        interesse.setCriancas(ConvivenciaCrianca.NAO);
        interesse.setTempoSozinho(TempoSozinho.ATE_2_HORAS);
        interesse.setOutrosAnimais(ConvivenciaAnimal.SIM_GATOS);
        interesse.setProgramacaoViagem(ProgramacaoViagem.LEVO_O_ANIMAL_COMIGO);
        interesse.setMomentoContato(MomentoContato.NOITE);
        interesses.saveAndFlush(interesse);
    }
}
