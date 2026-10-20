package com.adotaaqui.dto;

import com.adotaaqui.model.enums.StatusInteresse;
import java.time.LocalDateTime;
import java.util.UUID;

// Esse aqui se refere ao possivel tutor e não ao protetor.

public record InteresseResponse(
        UUID id,
        LocalDateTime dataHora,
        StatusInteresse statusAndamento,
        String motivoDescontinuacao,
        AnimalResumoResponse animal,
        TriagemDto triagem,
        ContatoResponse contatoProtetor) {
}


