package com.adotaaqui.dto;

import jakarta.validation.Valid;
import jakarta.validation.constraints.AssertTrue;
import jakarta.validation.constraints.NotNull;

public class InteresseRequest {

    @NotNull(message = "O aceite do termo é obrigatório")
    @AssertTrue(message = "É necessário aceitar o aviso de guarda responsável")
    private Boolean aceiteTermo;

    @NotNull(message = "A triagem é obrigatória")
    @Valid
    private TriagemDto triagem;

    public Boolean getAceiteTermo() {
        return aceiteTermo;
    }

    public void setAceiteTermo(Boolean aceiteTermo) {
        this.aceiteTermo = aceiteTermo;
    }

    public TriagemDto getTriagem() {
        return triagem;
    }

    public void setTriagem(TriagemDto triagem) {
        this.triagem = triagem;
    }
}


