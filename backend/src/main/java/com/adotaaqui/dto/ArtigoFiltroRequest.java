package com.adotaaqui.dto;

import com.adotaaqui.model.enums.CategoriaArtigo;

// GET /api/artigos: o assunto (opcional) e a página
public class ArtigoFiltroRequest extends PaginaRequest {

    private CategoriaArtigo categoria;

    public CategoriaArtigo getCategoria() {
        return categoria;
    }

    public void setCategoria(CategoriaArtigo categoria) {
        this.categoria = categoria;
    }
}
