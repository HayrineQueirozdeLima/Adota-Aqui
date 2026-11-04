package com.adotaaqui.dto;

import com.adotaaqui.model.enums.TipoConta;
import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.Size;

// GET /api/protetores: todos os filtros são opcionais, e a página vem do PaginaRequest
public class ProtetorFiltroRequest extends PaginaRequest {

    // USUARIO (protetor independente) ou ABRIGO. Sem ele, vêm os dois
    private TipoConta tipo;

    // Sigla do estado, igual à do endereço (RO, SP...)
    @Pattern(regexp = "([A-Za-z]{2})?", message = "Use a sigla do estado, com 2 letras")
    private String estado;

    // Basta conter o que foi digitado, sem ligar pra maiúscula nem acento, igual à vitrine
    @Size(max = 80, message = "A cidade pode ter no máximo 80 caracteres")
    private String cidade;

    // Parte do nome do abrigo ou da pessoa
    @Size(max = 80, message = "A busca pode ter no máximo 80 caracteres")
    private String busca;

    public TipoConta getTipo() {
        return tipo;
    }

    public void setTipo(TipoConta tipo) {
        this.tipo = tipo;
    }

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

    public String getBusca() {
        return busca;
    }

    public void setBusca(String busca) {
        this.busca = busca;
    }
}
