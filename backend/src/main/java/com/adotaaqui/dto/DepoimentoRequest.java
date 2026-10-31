package com.adotaaqui.dto;

import jakarta.validation.constraints.AssertTrue;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;
import org.hibernate.validator.constraints.URL;

// POST /api/interesses/{id}/depoimento (RF11, UC09)
public class DepoimentoRequest {

    @NotBlank(message = "Conte como está sendo a vida com o animal")
    @Size(min = 10, max = 1000, message = "O depoimento deve ter de 10 a 1000 caracteres")
    private String texto;

    // Opcional (UC09 FA02). Tem que ser uma foto enviada pelo POST /api/fotos
    @Size(max = 500, message = "A URL da foto pode ter no máximo 500 caracteres")
    @URL(message = "A foto deve ter uma URL válida")
    private String fotoUrl;

    // O mural é público: a pessoa precisa autorizar que o texto, o primeiro nome e o estado dela apareçam lá
    @AssertTrue(message = "Autorize a publicação no mural para enviar")
    private boolean autorizaPublicacao;

    public String getTexto() {
        return texto;
    }

    public void setTexto(String texto) {
        this.texto = texto;
    }

    public String getFotoUrl() {
        return fotoUrl;
    }

    public void setFotoUrl(String fotoUrl) {
        this.fotoUrl = fotoUrl;
    }

    public boolean isAutorizaPublicacao() {
        return autorizaPublicacao;
    }

    public void setAutorizaPublicacao(boolean autorizaPublicacao) {
        this.autorizaPublicacao = autorizaPublicacao;
    }
}
