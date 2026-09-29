package com.adotaaqui.dto;

import com.adotaaqui.model.enums.TipoConta;

import java.time.Instant;
import java.util.UUID;

public record LoginResponse(
        String token,
        TipoConta tipoConta,
        UUID id,
        String nome,
        Instant expiraEm) {
}
