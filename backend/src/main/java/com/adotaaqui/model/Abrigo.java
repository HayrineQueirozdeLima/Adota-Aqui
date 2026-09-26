package com.adotaaqui.model;

import jakarta.persistence.Column;
import jakarta.persistence.Embedded;
import jakarta.persistence.Entity;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.Table;

import java.util.UUID;

// ONG ou abrigo (CNPJ). É uma conta só por instituição, e os funcionários
// usam o mesmo login. Foi uma simplificação combinada pra caber no prazo.
@Entity
@Table(name = "abrigo")
public class Abrigo {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    // É com o CNPJ que o abrigo faz login (RF03). Não pode ser editado depois (RF17).
    @Column(nullable = false, unique = true, length = 14)
    private String cnpj;

    // Nome institucional, é o que aparece na listagem de animais
    @Column(nullable = false, length = 120)
    private String nome;

    @Column(name = "razao_social", nullable = false, length = 150)
    private String razaoSocial;

    @Column(nullable = false, unique = true, length = 120)
    private String email;

    @Column(nullable = false, length = 20)
    private String telefone;

    // Hash do BCrypt, nunca a senha em texto puro (RNF02)
    @Column(name = "senha_hash", nullable = false, length = 60)
    private String senha;

    @Embedded
    private Endereco endereco;

    public Abrigo() {
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

    public String getNome() {
        return nome;
    }

    public void setNome(String nome) {
        this.nome = nome;
    }

    public String getRazaoSocial() {
        return razaoSocial;
    }

    public void setRazaoSocial(String razaoSocial) {
        this.razaoSocial = razaoSocial;
    }

    public String getEmail() {
        return email;
    }

    public void setEmail(String email) {
        this.email = email;
    }

    public String getTelefone() {
        return telefone;
    }

    public void setTelefone(String telefone) {
        this.telefone = telefone;
    }

    public String getSenha() {
        return senha;
    }

    public void setSenha(String senha) {
        this.senha = senha;
    }

    public Endereco getEndereco() {
        return endereco;
    }

    public void setEndereco(Endereco endereco) {
        this.endereco = endereco;
    }
}
