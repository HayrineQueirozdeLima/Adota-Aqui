package com.adotaaqui.dto;

import java.util.UUID;

/** Resposta conforme docs/api.md, sem entidades JPA ou credenciais. */
public record AnimalResumoResponse(
        UUID id,
        String nome,
        String fotoCapa) {
}


