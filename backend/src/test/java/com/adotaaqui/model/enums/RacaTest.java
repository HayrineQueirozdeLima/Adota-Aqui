package com.adotaaqui.model.enums;

import org.junit.jupiter.api.Test;

import java.util.List;

import static org.junit.jupiter.api.Assertions.assertFalse;
import static org.junit.jupiter.api.Assertions.assertTrue;

// Primeiro teste de regra de negócio do projeto. Pode usar como modelo pros próximos:
// um método por comportamento, e o nome do método já diz o que está sendo testado.
class RacaTest {

    @Test
    void racaDeCaoPertenceAEspecieCao() {
        assertTrue(Raca.LABRADOR.pertenceA(Especie.CAO));
    }

    @Test
    void racaDeCaoNaoPertenceAEspecieGato() {
        assertFalse(Raca.LABRADOR.pertenceA(Especie.GATO));
    }

    @Test
    void listaDeGatosSoTemRacasDeGato() {
        List<Raca> racas = Raca.listarPorEspecie(Especie.GATO);

        assertFalse(racas.isEmpty());
        assertTrue(racas.stream().allMatch(raca -> raca.getEspecie() == Especie.GATO));
    }

    @Test
    void semRacaDefinidaExisteNasDuasEspecies() {
        assertTrue(Raca.listarPorEspecie(Especie.CAO).contains(Raca.SRD_CAO));
        assertTrue(Raca.listarPorEspecie(Especie.GATO).contains(Raca.SRD_GATO));
    }
}
