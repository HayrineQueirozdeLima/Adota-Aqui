package com.adotaaqui.dto;

import com.adotaaqui.model.enums.CategoriaDica;

import java.time.LocalDateTime;
import java.util.UUID;

// Uma dica na lista (GET /api/dicas): o começo do texto no lugar do texto inteiro
public record DicaResumoResponse(
        UUID id,
        String titulo,
        CategoriaDica categoria,
        String categoriaNome,
        String resumo,
        String fotoCapa,
        DicaResponse.Autor autor,
        LocalDateTime publicadaEm) {
}
