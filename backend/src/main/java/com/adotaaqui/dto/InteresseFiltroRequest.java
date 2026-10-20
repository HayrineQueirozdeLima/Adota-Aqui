package com.adotaaqui.dto;

import com.adotaaqui.model.enums.StatusInteresse;
import java.util.UUID;

public class InteresseFiltroRequest {

    private UUID animalId;

    private StatusInteresse status;

    public UUID getAnimalId() {
        return animalId;
    }

    public void setAnimalId(UUID animalId) {
        this.animalId = animalId;
    }

    public StatusInteresse getStatus() {
        return status;
    }

    public void setStatus(StatusInteresse status) {
        this.status = status;
    }
}


