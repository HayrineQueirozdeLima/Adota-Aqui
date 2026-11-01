package com.adotaaqui.model;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.FetchType;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.Index;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.OneToOne;
import jakarta.persistence.Table;
import org.hibernate.annotations.OnDelete;
import org.hibernate.annotations.OnDeleteAction;

import java.time.LocalDateTime;
import java.util.UUID;

// O depoimento de quem adotou pelo site (RF11, UC09). Aparece no mural de histórias de adoção.
// Fica ligado ao interesse aprovado: é dele que vêm o adotante e o animal
@Entity
@Table(name = "depoimento", indexes = @Index(name = "idx_depoimento_data_hora", columnList = "data_hora"))
public class Depoimento {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    // Um depoimento por adoção (unique). Se o interesse for apagado (o animal foi removido),
    // o banco apaga o depoimento junto (on delete cascade)
    @OneToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "interesse_id", nullable = false, unique = true)
    @OnDelete(action = OnDeleteAction.CASCADE)
    private Interesse interesse;

    @Column(nullable = false, length = 1000)
    private String texto;

    // Opcional (UC09 FA02). Só a URL: a imagem fica no S3, como as fotos dos animais
    @Column(name = "foto_url", length = 500)
    private String fotoUrl;

    @Column(name = "data_hora", nullable = false, updatable = false)
    private LocalDateTime dataHora = LocalDateTime.now();

    public UUID getId() {
        return id;
    }

    public Interesse getInteresse() {
        return interesse;
    }

    public void setInteresse(Interesse interesse) {
        this.interesse = interesse;
    }

    public String getTexto() {
        return texto;
    }

    public void setTexto(String texto) {
        this.texto = texto;
    }

    public String getFotoUrl() {
        return fotoUrl;
    }

    public void setFotoUrl(String fotoUrl) {
        this.fotoUrl = fotoUrl;
    }

    public LocalDateTime getDataHora() {
        return dataHora;
    }
}
