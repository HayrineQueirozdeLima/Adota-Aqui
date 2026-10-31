package com.adotaaqui.dto;

import com.adotaaqui.model.enums.CategoriaDica;
import com.adotaaqui.model.enums.TipoConta;

import java.time.LocalDateTime;
import java.util.UUID;

// A dica inteira (GET /api/dicas/{id}). "ehMinha" diz se quem está logado pode editar e apagar
public record DicaResponse(
        UUID id,
        String titulo,
        CategoriaDica categoria,
        String categoriaNome,
        String conteudo,
        String fotoCapa,
        Autor autor,
        LocalDateTime publicadaEm,
        LocalDateTime atualizadaEm,
        boolean ehMinha) {

    // O mesmo que a vitrine mostra do protetor: nome, cidade e estado. Sem e-mail nem telefone
    public record Autor(String nome, TipoConta tipo, String cidade, String estado) {
    }
}
