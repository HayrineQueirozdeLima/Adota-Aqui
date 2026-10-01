package com.adotaaqui.dto;

import com.adotaaqui.model.enums.Especie;
import com.adotaaqui.model.enums.NivelEnergia;
import com.adotaaqui.model.enums.Porte;
import com.adotaaqui.model.enums.Raca;
import com.adotaaqui.model.enums.SexoAnimal;
import com.adotaaqui.model.enums.StatusConvivencia;

/** Filtros opcionais da vitrine. Estado e disponibilidade são impostos pelo Service. */
public class AnimalFiltroRequest {

    private Especie especie;

    private Raca raca;

    private Porte porte;

    private SexoAnimal sexo;

    private String cidade;

    private StatusConvivencia convivenciaCrianca;

    private StatusConvivencia convivenciaGato;

    private StatusConvivencia convivenciaCao;

    private NivelEnergia energia;

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

    public Porte getPorte() {
        return porte;
    }

    public void setPorte(Porte porte) {
        this.porte = porte;
    }

    public SexoAnimal getSexo() {
        return sexo;
    }

    public void setSexo(SexoAnimal sexo) {
        this.sexo = sexo;
    }

    public String getCidade() {
        return cidade;
    }

    public void setCidade(String cidade) {
        this.cidade = cidade;
    }

    public StatusConvivencia getConvivenciaCrianca() {
        return convivenciaCrianca;
    }

    public void setConvivenciaCrianca(StatusConvivencia convivenciaCrianca) {
        this.convivenciaCrianca = convivenciaCrianca;
    }

    public StatusConvivencia getConvivenciaGato() {
        return convivenciaGato;
    }

    public void setConvivenciaGato(StatusConvivencia convivenciaGato) {
        this.convivenciaGato = convivenciaGato;
    }

    public StatusConvivencia getConvivenciaCao() {
        return convivenciaCao;
    }

    public void setConvivenciaCao(StatusConvivencia convivenciaCao) {
        this.convivenciaCao = convivenciaCao;
    }

    public NivelEnergia getEnergia() {
        return energia;
    }

    public void setEnergia(NivelEnergia energia) {
        this.energia = energia;
    }
}


