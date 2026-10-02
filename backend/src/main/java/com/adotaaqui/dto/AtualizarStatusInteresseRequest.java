package com.adotaaqui.dto;

import com.adotaaqui.model.enums.StatusInteresse;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;

/** O Service valida transições e exige motivo ao descontinuar, conforme AGENTS.md. */
public class AtualizarStatusInteresseRequest {

    @NotNull(message = "O status de andamento é obrigatório")
    private StatusInteresse statusAndamento;

    @Size(max = 255, message = "Motivo deve ter no máximo 255 caracteres")
    private String motivoDescontinuacao;

    public StatusInteresse getStatusAndamento() {
        return statusAndamento;
    }

    public void setStatusAndamento(StatusInteresse statusAndamento) {
        this.statusAndamento = statusAndamento;
    }

    public String getMotivoDescontinuacao() {
        return motivoDescontinuacao;
    }

    public void setMotivoDescontinuacao(String motivoDescontinuacao) {
        this.motivoDescontinuacao = motivoDescontinuacao;
    }
}


