package com.adotaaqui.dto;

import com.adotaaqui.model.enums.StatusConvivencia;
import jakarta.validation.constraints.NotNull;

// Convivência do animal; use NAO_TESTADO quando desconhecida. 
public class ConvivenciaDto {

    @NotNull(message = "O campo criança é obrigatório")
    private StatusConvivencia crianca;

    @NotNull(message = "O campo gato é obrigatório")
    private StatusConvivencia gato;

    @NotNull(message = "O campo cão é obrigatório")
    private StatusConvivencia cao;

    public StatusConvivencia getCrianca() {
        return crianca;
    }

    public void setCrianca(StatusConvivencia crianca) {
        this.crianca = crianca;
    }

    public StatusConvivencia getGato() {
        return gato;
    }

    public void setGato(StatusConvivencia gato) {
        this.gato = gato;
    }

    public StatusConvivencia getCao() {
        return cao;
    }

    public void setCao(StatusConvivencia cao) {
        this.cao = cao;
    }
}


