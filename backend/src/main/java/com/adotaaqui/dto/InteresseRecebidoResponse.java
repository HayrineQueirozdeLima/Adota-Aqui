package com.adotaaqui.dto;

import com.adotaaqui.model.enums.StatusInteresse;
import java.time.LocalDateTime;
import java.util.UUID;

// Essa parte vamos restringir apenas para o protetor do animal. Cuidar isso depois.
public record InteresseRecebidoResponse(
        UUID id,
        LocalDateTime dataHora,
        StatusInteresse statusAndamento,
        String motivoDescontinuacao,
        AnimalResumoResponse animal,
        TriagemDto triagem,
        ContatoResponse candidato) {
}


