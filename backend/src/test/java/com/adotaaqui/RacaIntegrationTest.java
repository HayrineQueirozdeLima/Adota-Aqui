package com.adotaaqui;

import com.adotaaqui.model.enums.Especie;
import com.adotaaqui.model.enums.Raca;
import com.jayway.jsonpath.JsonPath;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.test.web.servlet.MockMvc;

import java.nio.charset.StandardCharsets;
import java.util.List;

import static org.assertj.core.api.Assertions.assertThat;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

// GET /api/racas (issue #58). O endpoint fica no AnimalController (entrou com o #68).
// Nenhum teste manda token: isso também confere que a rota é pública.
@SpringBootTest
@AutoConfigureMockMvc
class RacaIntegrationTest {

    @Autowired MockMvc mvc;

    // Lê a resposta em UTF-8, pra "Siamês" e "Sem raça definida" chegarem com acento
    private String buscar(String especie) throws Exception {
        return mvc.perform(get("/api/racas").param("especie", especie))
                .andExpect(status().isOk())
                .andReturn().getResponse().getContentAsString(StandardCharsets.UTF_8);
    }

    @Test
    void listaDeCaesTemSoRacasDeCao() throws Exception {
        List<String> valores = JsonPath.read(buscar("CAO"), "$[*].valor");

        assertThat(valores).hasSize(Raca.listarPorEspecie(Especie.CAO).size())
                .contains("SRD_CAO", "LABRADOR")
                .doesNotContain("SIAMES");
        assertThat(valores).allSatisfy(valor ->
                assertThat(Raca.valueOf(valor).pertenceA(Especie.CAO)).isTrue());
    }

    @Test
    void cadaRacaVemComValorENomeParaExibir() throws Exception {
        String json = buscar("GATO");

        assertThat(JsonPath.<String>read(json, "$[0].valor")).isEqualTo("SRD_GATO");
        assertThat(JsonPath.<String>read(json, "$[0].nome")).isEqualTo("Sem raça definida");
        assertThat(JsonPath.<List<String>>read(json, "$[*].nome")).contains("Siamês");
    }

    @Test
    void semEspecieResponde400NoFormatoPadraoDeErro() throws Exception {
        mvc.perform(get("/api/racas"))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("status").value(400))
                .andExpect(jsonPath("mensagem").isNotEmpty());
    }

    @Test
    void especieInvalidaResponde400NoFormatoPadraoDeErro() throws Exception {
        mvc.perform(get("/api/racas").param("especie", "PEIXE"))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("status").value(400))
                .andExpect(jsonPath("mensagem").isNotEmpty());
    }
}