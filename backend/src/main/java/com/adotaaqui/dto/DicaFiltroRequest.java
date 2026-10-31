package com.adotaaqui.dto;

import com.adotaaqui.model.enums.CategoriaDica;

// GET /api/dicas: o assunto (opcional) e a página
public class DicaFiltroRequest extends PaginaRequest {

    private CategoriaDica categoria;

    public CategoriaDica getCategoria() {
        return categoria;
    }

    public void setCategoria(CategoriaDica categoria) {
        this.categoria = categoria;
    }
}
