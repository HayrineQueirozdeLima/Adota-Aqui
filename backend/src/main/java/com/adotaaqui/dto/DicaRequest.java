package com.adotaaqui.dto;

import com.adotaaqui.model.enums.CategoriaDica;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;
import org.hibernate.validator.constraints.URL;

// POST /api/dicas e PUT /api/dicas/{id}
public class DicaRequest {

    @NotBlank(message = "O título é obrigatório")
    @Size(min = 5, max = 120, message = "O título deve ter de 5 a 120 caracteres")
    private String titulo;

    @NotBlank(message = "Escreva a dica")
    @Size(min = 50, max = 10000, message = "A dica deve ter de 50 a 10000 caracteres")
    private String conteudo;

    @NotNull(message = "Escolha o assunto da dica")
    private CategoriaDica categoria;

    // Opcional. Tem que ser uma foto enviada pelo POST /api/fotos
    @Size(max = 500, message = "A URL da foto pode ter no máximo 500 caracteres")
    @URL(message = "A foto deve ter uma URL válida")
    private String fotoCapa;

    public String getTitulo() {
        return titulo;
    }

    public void setTitulo(String titulo) {
        this.titulo = titulo;
    }

    public String getConteudo() {
        return conteudo;
    }

    public void setConteudo(String conteudo) {
        this.conteudo = conteudo;
    }

    public CategoriaDica getCategoria() {
        return categoria;
    }

    public void setCategoria(CategoriaDica categoria) {
        this.categoria = categoria;
    }

    public String getFotoCapa() {
        return fotoCapa;
    }

    public void setFotoCapa(String fotoCapa) {
        this.fotoCapa = fotoCapa;
    }
}
