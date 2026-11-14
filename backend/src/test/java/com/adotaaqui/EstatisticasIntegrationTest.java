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

import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

// GET /api/estatisticas: os números da Home
@SpringBootTest
@AutoConfigureMockMvc
class EstatisticasIntegrationTest {
    @Autowired MockMvc mvc;
    @Autowired AnimalRepository animais;
    @Autowired UsuarioRepository usuarios;
    @Autowired AbrigoRepository abrigos;
    @Autowired InteresseRepository interesses;

    @BeforeEach
    @AfterEach
    void limpar() {
        animais.deleteAll();
        usuarios.deleteAll();
        abrigos.deleteAll();
    }

    @Test
    void semNadaCadastradoTudoZeroEVisitanteVe() throws Exception {
        mvc.perform(get("/api/estatisticas")).andExpect(status().isOk())
                .andExpect(jsonPath("$.adocoes").value(0))
                .andExpect(jsonPath("$.animaisDisponiveis").value(0))
                .andExpect(jsonPath("$.abrigos").value(0));
    }

    @Test
    void contaAdocoesAnimaisDisponiveisEAbrigos() throws Exception {
        Abrigo abrigo = abrigo(1);
        abrigo(2);
        Usuario candidata = usuario(1);
        Usuario outra = usuario(2);
        animal(abrigo, StatusAdocao.DISPONIVEL);
        animal(abrigo, StatusAdocao.DISPONIVEL);
        Animal adotado = animal(abrigo, StatusAdocao.ADOTADO);
        interesse(adotado, candidata, StatusInteresse.APROVADO);
        interesse(adotado, outra, StatusInteresse.DESCONTINUADO);
        // Devolvido: voltou pra vitrine, mas a adoção aconteceu e continua na conta
        Animal devolvido = animal(abrigo, StatusAdocao.DISPONIVEL);
        interesse(devolvido, outra, StatusInteresse.APROVADO);
        // Interesse em andamento ainda não é adoção
        interesse(devolvido, candidata, StatusInteresse.PENDENTE);

        mvc.perform(get("/api/estatisticas")).andExpect(status().isOk())
                .andExpect(jsonPath("$.adocoes").value(2))
                .andExpect(jsonPath("$.animaisDisponiveis").value(3))
                .andExpect(jsonPath("$.abrigos").value(2));
    }

    @Test
    void observatorioSeparaOsNumerosPorEstadoETrazOs27() throws Exception {
        Abrigo emRondonia = abrigo(1);
        Abrigo emSaoPaulo = abrigo(2);
        emSaoPaulo.getEndereco().setEstado("SP");
        abrigos.saveAndFlush(emSaoPaulo);
        Usuario candidata = usuario(1);
        animal(emRondonia, StatusAdocao.DISPONIVEL);
        // O animal conta no estado onde ele está, mesmo que o abrigo seja de outro
        Animal emCampinas = animal(emRondonia, StatusAdocao.DISPONIVEL, "SP");
        Animal adotado = animal(emSaoPaulo, StatusAdocao.ADOTADO, "SP");
        interesse(adotado, candidata, StatusInteresse.APROVADO);
        interesse(emCampinas, candidata, StatusInteresse.PENDENTE);

        mvc.perform(get("/api/estatisticas/estados")).andExpect(status().isOk())
                .andExpect(jsonPath("$.length()").value(27))
                .andExpect(jsonPath("$[0].estado").value("AC"))
                .andExpect(jsonPath("$[0].animaisDisponiveis").value(0))
                .andExpect(jsonPath("$[?(@.estado == 'RO')].animaisDisponiveis").value(1))
                .andExpect(jsonPath("$[?(@.estado == 'RO')].abrigos").value(1))
                .andExpect(jsonPath("$[?(@.estado == 'RO')].adocoes").value(0))
                .andExpect(jsonPath("$[?(@.estado == 'SP')].animaisDisponiveis").value(1))
                .andExpect(jsonPath("$[?(@.estado == 'SP')].abrigos").value(1))
                .andExpect(jsonPath("$[?(@.estado == 'SP')].adocoes").value(1));
    }

    @Test
    void tokenInvalidoRecebe401ComoNasOutrasRotasPublicas() throws Exception {
        mvc.perform(get("/api/estatisticas").header("Authorization", "Bearer invalido"))
                .andExpect(status().isUnauthorized());
    }

    private Endereco endereco() {
        Endereco endereco = new Endereco();
        endereco.setCep("76801000");
        endereco.setEstado("RO");
        endereco.setCidade("Porto Velho");
        endereco.setNumero("1");
        return endereco;
    }

    private Abrigo abrigo(int numero) {
        Abrigo abrigo = new Abrigo();
        abrigo.setCnpj(String.format("%014d", numero));
        abrigo.setNome("Abrigo " + numero);
        abrigo.setRazaoSocial("Abrigo " + numero);
        abrigo.setEmail("estatisticas-abrigo" + numero + "@example.com");
        abrigo.setTelefone("69999998888");
        abrigo.setSenha("hash-de-fixture");
        abrigo.setEndereco(endereco());
        return abrigos.saveAndFlush(abrigo);
    }

    private Usuario usuario(int numero) {
        Usuario usuario = new Usuario();
        usuario.setCpf(String.format("%011d", numero));
        usuario.setNome("Pessoa " + numero);
        usuario.setEmail("estatisticas-pessoa" + numero + "@example.com");
        usuario.setTelefone("69999998888");
        usuario.setSenha("hash-de-fixture");
        usuario.setEndereco(endereco());
        return usuarios.saveAndFlush(usuario);
    }

    private Animal animal(Abrigo abrigo, StatusAdocao status) {
        return animal(abrigo, status, null);
    }

    // Com estado, o animal fica nesse estado; sem, fica no endereço do abrigo
    private Animal animal(Abrigo abrigo, StatusAdocao status, String estado) {
        Animal animal = new Animal();
        if (estado != null) {
            animal.setCidade("Campinas");
            animal.setEstado(estado);
        }
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
        animal.setStatusAdocao(status);
        return animais.saveAndFlush(animal);
    }

    private void interesse(Animal animal, Usuario candidato, StatusInteresse status) {
        Interesse interesse = new Interesse();
        interesse.setAnimal(animal);
        interesse.setUsuario(candidato);
        interesse.setStatusAndamento(status);
        if (status == StatusInteresse.DESCONTINUADO) {
            interesse.setMotivoDescontinuacao("Outro candidato foi aprovado para este animal.");
        }
        interesse.setMoradia(TipoMoradia.CASA_COM_QUINTAL);
        interesse.setCriancas(ConvivenciaCrianca.NAO);
        interesse.setTempoSozinho(TempoSozinho.ATE_2_HORAS);
        interesse.setOutrosAnimais(ConvivenciaAnimal.SIM_GATOS);
        interesse.setProgramacaoViagem(ProgramacaoViagem.LEVO_O_ANIMAL_COMIGO);
        interesse.setMomentoContato(MomentoContato.NOITE);
        interesses.saveAndFlush(interesse);
    }
}
