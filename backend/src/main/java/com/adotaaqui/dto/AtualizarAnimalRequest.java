package com.adotaaqui.dto;

import com.adotaaqui.model.enums.StatusAdocao;
import jakarta.validation.constraints.NotNull;

public class AtualizarAnimalRequest extends AnimalRequest {

    @NotNull(message = "O status de adoção é obrigatório")
    private StatusAdocao statusAdocao;

    public StatusAdocao getStatusAdocao() {
        return statusAdocao;
    }

    public void setStatusAdocao(StatusAdocao statusAdocao) {
        this.statusAdocao = statusAdocao;
    }
}


