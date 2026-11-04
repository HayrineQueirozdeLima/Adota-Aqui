package com.adotaaqui.repository;

import java.util.UUID;

// Uma linha das contagens por protetor, pra página de abrigos e protetores.
// O animal é de uma pessoa OU de um abrigo, então só um dos dois ids vem preenchido
public record ContagemPorProtetor(UUID usuarioId, UUID abrigoId, Long total) {

    public UUID protetorId() {
        return usuarioId != null ? usuarioId : abrigoId;
    }
}
