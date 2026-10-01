package com.adotaaqui.dto;

import com.adotaaqui.model.enums.StatusInteresse;
import java.util.UUID;

public record InteresseResumoResponse(
        UUID id,
        StatusInteresse statusAndamento) {
}


