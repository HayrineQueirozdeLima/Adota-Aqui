package com.adotaaqui.dto;

import com.adotaaqui.model.enums.Especie;
import com.adotaaqui.model.enums.NivelEnergia;
import com.adotaaqui.model.enums.Porte;
import com.adotaaqui.model.enums.Raca;
import com.adotaaqui.model.enums.SexoAnimal;
import jakarta.validation.Valid;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotEmpty;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.PastOrPresent;
import jakarta.validation.constraints.Positive;
import jakarta.validation.constraints.Size;
import java.time.LocalDate;
import java.util.ArrayList;
import java.util.List;
import org.hibernate.validator.constraints.URL;
import com.fasterxml.jackson.annotation.JsonIgnore;
import jakarta.validation.constraints.AssertTrue;

/** Cadastro de animal. Protetor e status inicial são definidos pelo Service. */
public class AnimalRequest {

    @NotBlank(message = "O nome é obrigatório")
    @Size(max = 80, message = "Deve ter no máximo 80 caracteres")
    private String nome;

    @NotNull(message = "O campo espécie é obrigatório")
    private Especie especie;

    @NotNull(message = "O campo raça é obrigatório")
    private Raca raca;

    @NotNull(message = "O campo sexo é obrigatório")
    private SexoAnimal sexo;

    @NotNull(message = "O campo porte é obrigatório")
    private Porte porte;

    @Positive(message = "O peso deve ser maior que zero")
    private Double peso;

    @NotNull(message = "A data de nascimento estimada é obrigatória")
    @PastOrPresent(message = "A data de nascimento estimada não pode ser futura")
    private LocalDate dataNascEstimada;

    @NotNull(message = "O campo castrado é obrigatório")
    private Boolean castrado;

    @NotNull(message = "O nível de energia é obrigatório")
    private NivelEnergia energia;

    @NotNull(message = "A convivência é obrigatória")
    @Valid
    private ConvivenciaDto convivencia;

    @NotBlank(message = "A história é obrigatória")
    private String historia;

    @NotEmpty(message = "Informe pelo menos uma foto")
    private List<
            @NotBlank(message = "A URL da foto é obrigatória")
            @Size(max = 500)
            @URL(message = "A foto deve ter uma URL válida") String> fotos = new ArrayList<>();

    private List<@NotNull @Valid VacinaRequest> vacinas = new ArrayList<>();

    public String getNome() {
        return nome;
    }

    public void setNome(String nome) {
        this.nome = nome;
    }

    public Especie getEspecie() {
        return especie;
    }

    public void setEspecie(Especie especie) {
        this.especie = especie;
    }

    public Raca getRaca() {
        return raca;
    }

    public void setRaca(Raca raca) {
        this.raca = raca;
    }

    public SexoAnimal getSexo() {
        return sexo;
    }

    public void setSexo(SexoAnimal sexo) {
        this.sexo = sexo;
    }

    public Porte getPorte() {
        return porte;
    }

    public void setPorte(Porte porte) {
        this.porte = porte;
    }

    public Double getPeso() {
        return peso;
    }

    public void setPeso(Double peso) {
        this.peso = peso;
    }

    public LocalDate getDataNascEstimada() {
        return dataNascEstimada;
    }

    public void setDataNascEstimada(LocalDate dataNascEstimada) {
        this.dataNascEstimada = dataNascEstimada;
    }

    public Boolean getCastrado() {
        return castrado;
    }

    public void setCastrado(Boolean castrado) {
        this.castrado = castrado;
    }

    public NivelEnergia getEnergia() {
        return energia;
    }

    public void setEnergia(NivelEnergia energia) {
        this.energia = energia;
    }

    public ConvivenciaDto getConvivencia() {
        return convivencia;
    }

    public void setConvivencia(ConvivenciaDto convivencia) {
        this.convivencia = convivencia;
    }

    public String getHistoria() {
        return historia;
    }

    public void setHistoria(String historia) {
        this.historia = historia;
    }

    public List<String> getFotos() {
        return fotos;
    }

    public void setFotos(List<String> fotos) {
        this.fotos = fotos;
    }

    public List<VacinaRequest> getVacinas() {
        return vacinas;
    }

    public void setVacinas(List<VacinaRequest> vacinas) {
        this.vacinas = vacinas;
    }

    @JsonIgnore
    @AssertTrue(message = "A raça não pertence à espécie informada")
    public boolean isRacaDaEspecie() {
        return raca == null || especie == null || raca.pertenceA(especie);
    }
}


