package com.adotaaqui.dto;

import com.adotaaqui.model.enums.Especie;
import com.adotaaqui.model.enums.Porte;
import com.adotaaqui.model.enums.StatusAdocao;

import java.util.UUID;

/** Resposta conforme docs/api.md, sem entidades JPA ou credenciais. */
public record AnimalResumoResponse(
        UUID id,
        String nome,
        String fotoCapa,
        Especie especie,
        String racaNome,
        Porte porte,
        // Diz ao candidato se a ficha ainda abre: animal adotado só aparece pro protetor
        StatusAdocao statusAdocao) {
}