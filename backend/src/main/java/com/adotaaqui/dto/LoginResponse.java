package com.adotaaqui.dto;

import com.adotaaqui.model.enums.TipoConta;

import java.time.Instant;
import java.util.UUID;

public record LoginResponse(
        String token,
        TipoConta tipoConta,
        UUID id,
        String nome,
        Instant expiraEm,
        // Foto de perfil, pro topo do site mostrar no lugar das iniciais. null quando não tem
        String fotoUrl) {
}
