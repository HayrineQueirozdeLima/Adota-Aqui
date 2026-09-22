package com.adotaaqui.model;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.Table;

import java.util.UUID;

@Entity
@Table(name = "ong")
public class Ong {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    @Column(nullable = false, unique = true, length = 14)
    private String cnpj;

    @Column(name = "nome_institucional", nullable = false)
    private String nomeInstitucional;

    @Column(nullable = false, unique = true)
    private String email;

    @Column(name = "senha_hash", nullable = false)
    private String senhaHash;

    public Ong() {
    }

    public UUID getId() {
        return id;
    }

    public String getCnpj() {
        return cnpj;
    }

    public void setCnpj(String cnpj) {
        this.cnpj = cnpj;
    }

    public String getNomeInstitucional() {
        return nomeInstitucional;
    }

    public void setNomeInstitucional(String nomeInstitucional) {
        this.nomeInstitucional = nomeInstitucional;
    }

    public String getEmail() {
        return email;
    }

    public void setEmail(String email) {
        this.email = email;
    }

    public String getSenhaHash() {
        return senhaHash;
    }

    public void setSenhaHash(String senhaHash) {
        this.senhaHash = senhaHash;
    }
}
