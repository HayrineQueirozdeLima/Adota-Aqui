package com.adotaaqui.dto;

import java.time.LocalDate;
import java.util.UUID;

public record VacinaResponse(
        UUID id,
        String nome,
        Integer dose,
        LocalDate dataAplicacao) {
}


