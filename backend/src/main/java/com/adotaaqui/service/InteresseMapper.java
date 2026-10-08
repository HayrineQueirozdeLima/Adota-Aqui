package com.adotaaqui.service;

import com.adotaaqui.dto.AnimalResumoResponse;
import com.adotaaqui.dto.ContatoResponse;
import com.adotaaqui.dto.InteresseResponse;
import com.adotaaqui.dto.InteresseRecebidoResponse;
import com.adotaaqui.dto.TriagemDto;
import com.adotaaqui.model.Abrigo;
import com.adotaaqui.model.Animal;
import com.adotaaqui.model.Interesse;
import com.adotaaqui.model.Usuario;

// Monta as respostas de interesse no formato do docs/api.md (seção 9), sem expor as entidades
final class InteresseMapper {
    private InteresseMapper() {}

    // Visão do candidato: vem com o contato do protetor (RF09)
    static InteresseResponse paraCandidato(Interesse interesse) {
        Animal animal = interesse.getAnimal();
        return new InteresseResponse(interesse.getId(), interesse.getDataHora(), interesse.getStatusAndamento(),
                interesse.getMotivoDescontinuacao(), resumo(animal), triagem(interesse), contatoDoProtetor(animal));
    }
   // Visão do Protetor, vem coms dados de contato do candidato, inverso do proceso de candidato
    static InteresseRecebidoResponse paraProtetor(Interesse interesse) {
        Usuario candidato = interesse.getUsuario();
        return new InteresseRecebidoResponse(interesse.getId(), interesse.getDataHora(),
                interesse.getStatusAndamento(), interesse.getMotivoDescontinuacao(),
                resumo(interesse.getAnimal()), triagem(interesse),
                new ContatoResponse(candidato.getNome(), candidato.getTelefone(), candidato.getEmail()));
    }

    static AnimalResumoResponse resumo(Animal animal) {
        String fotoCapa = animal.getFotos().isEmpty() ? null : animal.getFotos().get(0);
        return new AnimalResumoResponse(animal.getId(), animal.getNome(), fotoCapa);
    }

    static TriagemDto triagem(Interesse interesse) {
        TriagemDto dto = new TriagemDto();
        dto.setMoradia(interesse.getMoradia());
        dto.setCriancas(interesse.getCriancas());
        dto.setTempoSozinho(interesse.getTempoSozinho());
        dto.setOutrosAnimais(interesse.getOutrosAnimais());
        dto.setProgramacaoViagem(interesse.getProgramacaoViagem());
        dto.setMomentoContato(interesse.getMomentoContato());
        return dto;
    }

    // O protetor é quem cadastrou o animal: um Usuario (pessoa física) ou um Abrigo
    private static ContatoResponse contatoDoProtetor(Animal animal) {
        Usuario usuario = animal.getUsuario();
        if (usuario != null) {
            return new ContatoResponse(usuario.getNome(), usuario.getTelefone(), usuario.getEmail());
        }
        Abrigo abrigo = animal.getAbrigo();
        return new ContatoResponse(abrigo.getNome(), abrigo.getTelefone(), abrigo.getEmail());
    }
}