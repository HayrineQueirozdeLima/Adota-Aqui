package com.adotaaqui.model;

import com.adotaaqui.model.enums.CategoriaArtigo;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
import jakarta.persistence.FetchType;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.Index;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.PrePersist;
import jakarta.persistence.PreUpdate;
import jakarta.persistence.Table;
import org.hibernate.annotations.Check;

import java.time.LocalDateTime;
import java.util.UUID;

// Um artigo pra quem vai adotar ou já adotou, escrito por um protetor (blog para tutores).
// O autor é um Usuario ou um Abrigo, com a mesma regra do animal: um dos dois, nunca os dois
@Entity
@Table(name = "artigo", indexes = {
        @Index(name = "idx_artigo_publicado_em", columnList = "publicado_em"),
        @Index(name = "idx_artigo_usuario", columnList = "usuario_id"),
        @Index(name = "idx_artigo_abrigo", columnList = "abrigo_id")
})
@Check(constraints = "(usuario_id IS NOT NULL AND abrigo_id IS NULL) OR (usuario_id IS NULL AND abrigo_id IS NOT NULL)")
public class Artigo {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    @Column(nullable = false, length = 120)
    private String titulo;

    // Texto puro, com quebras de linha. O site mostra como texto, nunca como HTML
    @Column(nullable = false, columnDefinition = "TEXT")
    private String conteudo;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 30)
    private CategoriaArtigo categoria;

    // Opcional. Só a URL: a imagem fica no S3
    @Column(name = "foto_capa", length = 500)
    private String fotoCapa;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "usuario_id")
    private Usuario usuario;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "abrigo_id")
    private Abrigo abrigo;

    @Column(name = "publicado_em", nullable = false, updatable = false)
    private LocalDateTime publicadoEm = LocalDateTime.now();

    // Vazio enquanto ninguém editou
    @Column(name = "atualizado_em")
    private LocalDateTime atualizadoEm;

    @PrePersist
    @PreUpdate
    private void validarAutor() {
        if ((usuario == null) == (abrigo == null)) {
            throw new IllegalStateException("O artigo deve ter exatamente um autor: um Usuario ou um Abrigo.");
        }
    }

    public UUID getId() {
        return id;
    }

    public String getTitulo() {
        return titulo;
    }

    public void setTitulo(String titulo) {
        this.titulo = titulo;
    }

    public String getConteudo() {
        return conteudo;
    }

    public void setConteudo(String conteudo) {
        this.conteudo = conteudo;
    }

    public CategoriaArtigo getCategoria() {
        return categoria;
    }

    public void setCategoria(CategoriaArtigo categoria) {
        this.categoria = categoria;
    }

    public String getFotoCapa() {
        return fotoCapa;
    }

    public void setFotoCapa(String fotoCapa) {
        this.fotoCapa = fotoCapa;
    }

    public Usuario getUsuario() {
        return usuario;
    }

    public void setUsuario(Usuario usuario) {
        this.usuario = usuario;
    }

    public Abrigo getAbrigo() {
        return abrigo;
    }

    public void setAbrigo(Abrigo abrigo) {
        this.abrigo = abrigo;
    }

    public LocalDateTime getPublicadoEm() {
        return publicadoEm;
    }

    public LocalDateTime getAtualizadoEm() {
        return atualizadoEm;
    }

    public void setAtualizadoEm(LocalDateTime atualizadoEm) {
        this.atualizadoEm = atualizadoEm;
    }
}
