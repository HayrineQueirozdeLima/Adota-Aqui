package com.adotaaqui.dto;

import java.time.LocalDate;
import java.time.LocalTime;
import java.util.UUID;

// Uma feira de adoção. "abrigo" é quem organiza, com o mesmo que a vitrine mostra do protetor (sem contato).
// "ehMinha" diz se quem está logado pode editar e apagar
public record FeiraResponse(
        UUID id,
        String titulo,
        String descricao,
        LocalDate data,
        LocalTime horaInicio,
        LocalTime horaFim,
        String local,
        String endereco,
        String cidade,
        String estado,
        ProtetorResponse abrigo,
        boolean ehMinha) {
}
