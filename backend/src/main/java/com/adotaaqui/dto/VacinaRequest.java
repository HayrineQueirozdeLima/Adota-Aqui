package com.adotaaqui.dto;

import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.PastOrPresent;
import jakarta.validation.constraints.Size;
import java.time.LocalDate;

/** Vacina recebida dentro do animal. Dose e data são opcionais conforme o modelo atual. */
public class VacinaRequest {

    @NotBlank(message = "O nome é obrigatório")
    @Size(max = 80, message = "Deve ter no máximo 80 caracteres")
    private String nome;

    @Min(value = 1, message = "A dose deve ser maior ou igual a 1")
    private Integer dose; 
    
    @PastOrPresent(message = "A data de aplicação não pode ser futura")
    private LocalDate dataAplicacao;

    public String getNome() {
        return nome;
    }

    public void setNome(String nome) {
        this.nome = nome;
    }

    public Integer getDose() {
        return dose;
    }

    public void setDose(Integer dose) {
        this.dose = dose;
    }

    public LocalDate getDataAplicacao() {
        return dataAplicacao;
    }

    public void setDataAplicacao(LocalDate dataAplicacao) {
        this.dataAplicacao = dataAplicacao;
    }
}


