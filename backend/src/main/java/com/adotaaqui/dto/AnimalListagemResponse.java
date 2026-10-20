package com.adotaaqui.dto;

import com.adotaaqui.model.enums.Especie;
import com.adotaaqui.model.enums.NivelEnergia;
import com.adotaaqui.model.enums.Porte;
import com.adotaaqui.model.enums.Raca;
import com.adotaaqui.model.enums.SexoAnimal;
import com.adotaaqui.model.enums.StatusAdocao;
import java.util.UUID;

/** Item da vitrine e da lista de animais da própria conta. */
public record AnimalListagemResponse(
        UUID id,
        String nome,
        Especie especie,
        Raca raca,
        String racaNome,
        SexoAnimal sexo,
        Porte porte,
        Double peso,
        Boolean castrado,
        NivelEnergia energia,
        ConvivenciaDto convivencia,
        StatusAdocao statusAdocao,
        String fotoCapa,
        ProtetorResponse protetor) {
}


