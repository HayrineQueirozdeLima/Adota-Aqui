package com.adotaaqui.dto;

import com.adotaaqui.model.enums.CategoriaArtigo;
import com.adotaaqui.model.enums.TipoConta;

import java.time.LocalDateTime;
import java.util.UUID;

// O artigo inteiro (GET /api/artigos/{id}). "ehMeu" diz se quem está logado pode editar e apagar
public record ArtigoResponse(
        UUID id,
        String titulo,
        CategoriaArtigo categoria,
        String categoriaNome,
        String conteudo,
        String fotoCapa,
        Autor autor,
        LocalDateTime publicadoEm,
        LocalDateTime atualizadoEm,
        boolean ehMeu) {

    // O mesmo que a vitrine mostra do protetor: nome, cidade e estado. Sem e-mail nem telefone
    public record Autor(String nome, TipoConta tipo, String cidade, String estado) {
    }
}
