package com.adotaaqui.dto;

import com.adotaaqui.model.enums.CategoriaArtigo;

import java.time.LocalDateTime;
import java.util.UUID;

// Um artigo na lista (GET /api/artigos): o começo do texto no lugar do texto inteiro
public record ArtigoResumoResponse(
        UUID id,
        String titulo,
        CategoriaArtigo categoria,
        String categoriaNome,
        String resumo,
        String fotoCapa,
        ArtigoResponse.Autor autor,
        LocalDateTime publicadoEm) {
}
