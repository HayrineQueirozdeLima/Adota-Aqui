package com.adotaaqui.dto;

import com.adotaaqui.model.enums.Especie;

import java.time.LocalDateTime;
import java.util.UUID;

// Um depoimento no mural. Do adotante, só o primeiro nome e o estado: o mural é público
public record DepoimentoResponse(
        UUID id,
        String texto,
        String fotoUrl,
        LocalDateTime dataHora,
        String autor,
        String estado,
        Animal animal,
        String protetor) {

    public record Animal(String nome, Especie especie, String fotoCapa) {
    }
}
