package com.adotaaqui.dto;

import com.adotaaqui.model.enums.ConvivenciaAnimal;
import com.adotaaqui.model.enums.ConvivenciaCrianca;
import com.adotaaqui.model.enums.MomentoContato;
import com.adotaaqui.model.enums.ProgramacaoViagem;
import com.adotaaqui.model.enums.TempoSozinho;
import com.adotaaqui.model.enums.TipoMoradia;
import jakarta.validation.constraints.NotNull;

// vamos validar os campos a nivel de preenchimento, mas não vamos confirmar cada informação.
public class TriagemDto {

    @NotNull(message = "O campo moradia é obrigatório")
    private TipoMoradia moradia;

    @NotNull(message = "O campo crianças é obrigatório")
    private ConvivenciaCrianca criancas;

    @NotNull(message = "O campo tempo sozinho é obrigatório")
    private TempoSozinho tempoSozinho;

    @NotNull(message = "O campo outros animais é obrigatório")
    private ConvivenciaAnimal outrosAnimais;

    @NotNull(message = "O campo programação viagem é obrigatório")
    private ProgramacaoViagem programacaoViagem;

    @NotNull(message = "O campo momento contato é obrigatório")
    private MomentoContato momentoContato;

    public TipoMoradia getMoradia() {
        return moradia;
    }

    public void setMoradia(TipoMoradia moradia) {
        this.moradia = moradia;
    }

    public ConvivenciaCrianca getCriancas() {
        return criancas;
    }

    public void setCriancas(ConvivenciaCrianca criancas) {
        this.criancas = criancas;
    }

    public TempoSozinho getTempoSozinho() {
        return tempoSozinho;
    }

    public void setTempoSozinho(TempoSozinho tempoSozinho) {
        this.tempoSozinho = tempoSozinho;
    }

    public ConvivenciaAnimal getOutrosAnimais() {
        return outrosAnimais;
    }

    public void setOutrosAnimais(ConvivenciaAnimal outrosAnimais) {
        this.outrosAnimais = outrosAnimais;
    }

    public ProgramacaoViagem getProgramacaoViagem() {
        return programacaoViagem;
    }

    public void setProgramacaoViagem(ProgramacaoViagem programacaoViagem) {
        this.programacaoViagem = programacaoViagem;
    }

    public MomentoContato getMomentoContato() {
        return momentoContato;
    }

    public void setMomentoContato(MomentoContato momentoContato) {
        this.momentoContato = momentoContato;
    }
}


