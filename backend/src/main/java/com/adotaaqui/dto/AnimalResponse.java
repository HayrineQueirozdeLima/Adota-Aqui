package com.adotaaqui.dto;

import com.adotaaqui.model.enums.Especie;
import com.adotaaqui.model.enums.NivelEnergia;
import com.adotaaqui.model.enums.Porte;
import com.adotaaqui.model.enums.Raca;
import com.adotaaqui.model.enums.SexoAnimal;
import com.adotaaqui.model.enums.StatusAdocao;
import java.time.LocalDate;
import java.util.List;
import java.util.UUID;

// Perfil público do animal. Permissões são calculadas pelo Service. 
public record AnimalResponse(
        UUID id,
        String nome,
        Especie especie,
        Raca raca,
        String racaNome,
        SexoAnimal sexo,
        Porte porte,
        Double peso,
        LocalDate dataNascEstimada,
        Boolean castrado,
        NivelEnergia energia,
        ConvivenciaDto convivencia,
        String historia,
        List<String> fotos,
        List<VacinaResponse> vacinas,
        StatusAdocao statusAdocao,
        ProtetorResponse protetor,
        boolean ehMeu,
        boolean podeDemonstrarInteresse,
        InteresseResumoResponse meuInteresse) {
}


