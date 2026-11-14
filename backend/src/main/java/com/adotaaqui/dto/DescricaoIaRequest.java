package com.adotaaqui.dto;

import com.adotaaqui.model.enums.Especie;
import com.adotaaqui.model.enums.NivelEnergia;
import com.adotaaqui.model.enums.Porte;
import com.adotaaqui.model.enums.Raca;
import com.adotaaqui.model.enums.SexoAnimal;
import com.adotaaqui.model.enums.StatusConvivencia;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;

import java.time.LocalDate;
import java.util.List;

// POST /api/ia/descricao: o que o protetor já preencheu no formulário do animal, mesmo antes de salvar.
// Só nome e espécie são obrigatórios; o resto ajuda a IA a escrever melhor
public record DescricaoIaRequest(
        @NotBlank(message = "Informe o nome do animal antes de pedir o texto")
        @Size(max = 80, message = "Deve ter no máximo 80 caracteres")
        String nome,
        @NotNull(message = "Escolha a espécie antes de pedir o texto")
        Especie especie,
        SexoAnimal sexo,
        Porte porte,
        Raca raca,
        LocalDate dataNascEstimada,
        Boolean castrado,
        NivelEnergia energia,
        StatusConvivencia convivenciaCrianca,
        StatusConvivencia convivenciaCao,
        StatusConvivencia convivenciaGato,
        @Size(max = 20, message = "Mande no máximo 20 vacinas")
        List<@Size(max = 80) String> vacinas,
        @Size(max = 80) String cidade,
        @Size(max = 2) String estado,
        // O que o protetor já escreveu na trajetória. A IA aproveita e melhora
        @Size(max = 2000, message = "O rascunho pode ter no máximo 2000 caracteres")
        String rascunho) {
}
