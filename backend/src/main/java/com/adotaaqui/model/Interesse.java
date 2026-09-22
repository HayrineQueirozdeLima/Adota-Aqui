package com.adotaaqui.model;

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
import jakarta.persistence.Table;

import java.time.LocalDateTime;
import java.util.UUID;

@Entity
@Table(name = "interesse")
public class Interesse {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "usuario_id", nullable = false)
    private Usuario usuario;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "animal_id", nullable = false)
    private Animal animal;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private StatusInteresse status = StatusInteresse.PENDENTE;

    @Column(name = "criado_em", nullable = false)
    private LocalDateTime criadoEm;

    public Interesse() {
    }

    @PrePersist
    private void preencherCriadoEm() {
        this.criadoEm = LocalDateTime.now();
    }

    public UUID getId() {
        return id;
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

    public StatusInteresse getStatus() {
        return status;
    }

    public void setStatus(StatusInteresse status) {
        this.status = status;
    }

    public LocalDateTime getCriadoEm() {
        return criadoEm;
    }

    public enum StatusInteresse {
        PENDENTE, ACEITO, RECUSADO
    }
}
