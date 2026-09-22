package com.adotaaqui.model;

import com.adotaaqui.model.enums.ConvivenciaAnimal;
import com.adotaaqui.model.enums.ConvivenciaCrianca;
import com.adotaaqui.model.enums.MomentoContato;
import com.adotaaqui.model.enums.ProgramacaoViagem;
import com.adotaaqui.model.enums.StatusInteresse;
import com.adotaaqui.model.enums.TempoSozinho;
import com.adotaaqui.model.enums.TipoMoradia;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
import jakarta.persistence.FetchType;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.PrePersist;
import jakarta.persistence.PreUpdate;
import jakarta.persistence.Table;

import java.time.LocalDateTime;
import java.util.UUID;

@Entity
@Table(name = "interesse")
public class Interesse {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    @Column(nullable = false)
    private LocalDateTime data;

    @Enumerated(EnumType.STRING)
    @Column(name = "status_andamento", nullable = false, length = 20)
    private StatusInteresse statusAndamento = StatusInteresse.PENDENTE;

    @Column(name = "motivo_descontinuacao", length = 500)
    private String motivoDescontinuacao;

    // ----- Triagem (RF15) -----

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 60)
    private TipoMoradia moradia;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 60)
    private ConvivenciaCrianca criancas;

    @Enumerated(EnumType.STRING)
    @Column(name = "tempo_sozinho", nullable = false, length = 60)
    private TempoSozinho tempoSozinho;

    @Enumerated(EnumType.STRING)
    @Column(name = "outros_animais", nullable = false, length = 60)
    private ConvivenciaAnimal outrosAnimais;

    @Enumerated(EnumType.STRING)
    @Column(name = "programacao_viagem", nullable = false, length = 60)
    private ProgramacaoViagem programacaoViagem;

    @Enumerated(EnumType.STRING)
    @Column(name = "momento_contato", nullable = false, length = 20)
    private MomentoContato momentoContato;

    // ----- Relacionamentos -----

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "usuario_id", nullable = false)
    private Usuario usuario;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "animal_id", nullable = false)
    private Animal animal;

    public Interesse() {
    }

    @PrePersist
    private void aoCriar() {
        if (data == null) {
            data = LocalDateTime.now();
        }
        validarMotivo();
    }

    @PreUpdate
    private void aoAtualizar() {
        validarMotivo();
    }

    // RF10: toda descontinuação exige motivo
    private void validarMotivo() {
        if (statusAndamento == StatusInteresse.DESCONTINUADO
                && (motivoDescontinuacao == null || motivoDescontinuacao.isBlank())) {
            throw new IllegalStateException("Descontinuar um interesse exige informar o motivo.");
        }
    }

    public UUID getId() {
        return id;
    }

    public LocalDateTime getData() {
        return data;
    }

    public StatusInteresse getStatusAndamento() {
        return statusAndamento;
    }

    public void setStatusAndamento(StatusInteresse statusAndamento) {
        this.statusAndamento = statusAndamento;
    }

    public String getMotivoDescontinuacao() {
        return motivoDescontinuacao;
    }

    public void setMotivoDescontinuacao(String motivoDescontinuacao) {
        this.motivoDescontinuacao = motivoDescontinuacao;
    }

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

    public Usuario getUsuario() {
        return usuario;
    }

    public void setUsuario(Usuario usuario) {
        this.usuario = usuario;
    }

    public Animal getAnimal() {
        return animal;
    }

    public void setAnimal(Animal animal) {
        this.animal = animal;
    }
}
