package com.adotaaqui.dto;

import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.Size;

// GET /api/feiras: estado e cidade (opcionais) e a página
public class FeiraFiltroRequest extends PaginaRequest {

    @Pattern(regexp = "AC|AL|AP|AM|BA|CE|DF|ES|GO|MA|MT|MS|MG|PA|PB|PR|PE|PI|RJ|RN|RS|RO|RR|SC|SP|SE|TO",
            message = "Escolha um estado válido")
    private String estado;

    @Size(max = 80, message = "A cidade pode ter no máximo 80 caracteres")
    private String cidade;

    public String getEstado() {
        return estado;
    }

    public void setEstado(String estado) {
        this.estado = estado;
    }

    public String getCidade() {
        return cidade;
    }

    public void setCidade(String cidade) {
        this.cidade = cidade;
    }
}
