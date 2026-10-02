package com.adotaaqui.service;

import com.adotaaqui.dto.AnimalListagemResponse;
import com.adotaaqui.dto.AnimalResponse;
import com.adotaaqui.dto.ConvivenciaDto;
import com.adotaaqui.dto.InteresseResumoResponse;
import com.adotaaqui.dto.ProtetorResponse;
import com.adotaaqui.dto.VacinaResponse;
import com.adotaaqui.model.Animal;
import com.adotaaqui.model.Endereco;

import java.util.List;

final class AnimalMapper {
    private AnimalMapper() {}

    static AnimalResponse completo(Animal animal, boolean ehMeu, boolean podeInteresse,
                                   InteresseResumoResponse interesse) {
        return new AnimalResponse(animal.getId(), animal.getNome(), animal.getEspecie(), animal.getRaca(),
                animal.getSexo(), animal.getPorte(), animal.getPeso(), animal.getDataNascEstimada(),
                animal.getCastrado(), animal.getEnergia(), convivencia(animal), animal.getHistoria(),
                List.copyOf(animal.getFotos()), animal.getVacinas().stream()
                    .map(v -> new VacinaResponse(v.getId(), v.getNome(), v.getDose(), v.getDataAplicacao())).toList(),
                animal.getStatusAdocao(), protetor(animal), ehMeu, podeInteresse, interesse);
    }

    static AnimalListagemResponse item(Animal animal) {
        return new AnimalListagemResponse(animal.getId(), animal.getNome(), animal.getEspecie(),
                animal.getRaca(), animal.getRaca().getNome(), animal.getSexo(), animal.getPorte(),
                animal.getPeso(), animal.getCastrado(), animal.getEnergia(), convivencia(animal),
                animal.getStatusAdocao(), animal.getFotos().isEmpty() ? null : animal.getFotos().get(0),
                protetor(animal));
    }

    private static ConvivenciaDto convivencia(Animal animal) {
        ConvivenciaDto dto = new ConvivenciaDto();
        dto.setCrianca(animal.getConvivenciaCrianca());
        dto.setGato(animal.getConvivenciaGato());
        dto.setCao(animal.getConvivenciaCao());
        return dto;
    }

    private static ProtetorResponse protetor(Animal animal) {
        Endereco endereco = animal.getUsuario() != null
                ? animal.getUsuario().getEndereco() : animal.getAbrigo().getEndereco();
        String nome = animal.getUsuario() != null ? animal.getUsuario().getNome() : animal.getAbrigo().getNome();
        return new ProtetorResponse(nome, endereco.getCidade(), endereco.getEstado());
    }
}
