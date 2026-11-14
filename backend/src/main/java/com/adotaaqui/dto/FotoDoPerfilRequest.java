package com.adotaaqui.dto;

import jakarta.validation.constraints.Size;

// Corpo do PUT /api/usuarios/me/foto e do PUT /api/abrigos/me/foto.
// fotoUrl é o endereço que o POST /api/fotos devolveu. Vazio ou null tira a foto
public record FotoDoPerfilRequest(
        @Size(max = 500, message = "O endereço da foto pode ter no máximo 500 caracteres")
        String fotoUrl) {
}
