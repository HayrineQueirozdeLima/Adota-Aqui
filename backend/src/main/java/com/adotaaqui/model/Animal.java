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
import jakarta.persistence.PreUpdate;
import jakarta.persistence.Table;

import java.util.UUID;

@Entity
@Table(name = "animal")
public class Animal {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "ong_id")
    private Ong ong;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "usuario_id")
    private Usuario usuario;

    @Column(nullable = false)
    private String nome;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private Especie especie;

    @Enumerated(EnumType.STRING)
    private Porte porte;

    @Column(name = "idade_estimada_meses")
    private Integer idadeEstimadaMeses;

    private String cor;

    private Boolean castrado = false;

    private Boolean vacinado = false;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private StatusAnimal status = StatusAnimal.DISPONIVEL;

    public Animal() {
    }

    // um animal tem exatamente um ofertante: ONG ou Usuario, nunca os dois
    @PrePersist
    @PreUpdate
    private void validarOfertante() {
        boolean temOng = ong != null;
        boolean temUsuario = usuario != null;
        if (temOng == temUsuario) {
            throw new IllegalStateException(
                "Animal precisa ter exatamente um ofertante: uma ONG ou um Usuario."
            );
        }
    }

    public UUID getId() {
        return id;
    }

    public Ong getOng() {
        return ong;
    }

    public void setOng(Ong ong) {
        this.ong = ong;
    }

    public Usuario getUsuario() {
        return usuario;
    }

    public void setUsuario(Usuario usuario) {
        this.usuario = usuario;
    }

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

    public Porte getPorte() {
        return porte;
    }

    public void setPorte(Porte porte) {
        this.porte = porte;
    }

    public Integer getIdadeEstimadaMeses() {
        return idadeEstimadaMeses;
    }

    public void setIdadeEstimadaMeses(Integer idadeEstimadaMeses) {
        this.idadeEstimadaMeses = idadeEstimadaMeses;
    }

    public String getCor() {
        return cor;
    }

    public void setCor(String cor) {
        this.cor = cor;
    }

    public Boolean getCastrado() {
        return castrado;
    }

    public void setCastrado(Boolean castrado) {
        this.castrado = castrado;
    }

    public Boolean getVacinado() {
        return vacinado;
    }

    public void setVacinado(Boolean vacinado) {
        this.vacinado = vacinado;
    }

    public StatusAnimal getStatus() {
        return status;
    }

    public void setStatus(StatusAnimal status) {
        this.status = status;
    }

    public enum Especie {
        CACHORRO, GATO
    }

    public enum Porte {
        PEQUENO, MEDIO, GRANDE
    }

    public enum StatusAnimal {
        DISPONIVEL, EM_PROCESSO, ADOTADO
    }
}
