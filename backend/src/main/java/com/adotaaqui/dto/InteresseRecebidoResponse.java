package com.adotaaqui.dto;

import com.adotaaqui.model.enums.StatusInteresse;
import java.time.LocalDateTime;
import java.util.UUID;

/// Visto só pelo Protetor do animal. A restrição fica no Service
public record InteresseRecebidoResponse(
        UUID id,
        LocalDateTime dataHora,
        StatusInteresse statusAndamento,
        String motivoDescontinuacao,
        AnimalResumoResponse animal,
        TriagemDto triagem,
        ContatoResponse candidato) {
}


