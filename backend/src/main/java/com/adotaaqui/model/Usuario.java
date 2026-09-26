package com.adotaaqui.model;

import jakarta.persistence.Column;
import jakarta.persistence.Embedded;
import jakarta.persistence.Entity;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.Table;

import java.util.UUID;

// Pessoa física (CPF). A mesma conta serve pra adotar e pra cadastrar um animal
// que a pessoa resgatou por conta própria, não tem "tipo de usuário" separado.
@Entity
@Table(name = "usuario")
public class Usuario {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    // É com o CPF que a pessoa faz login (RF03). Não pode ser editado depois (RF17).
    @Column(nullable = false, unique = true, length = 11)
    private String cpf;

    @Column(nullable = false, length = 120)
    private String nome;

    @Column(nullable = false, unique = true, length = 120)
    private String email;

    @Column(nullable = false, length = 20)
    private String telefone;

    // Aqui fica o hash do BCrypt, NUNCA a senha em texto puro (RNF02).
    // E a senha nunca volta em resposta nenhuma da API, por isso sempre usem DTO.
    @Column(name = "senha_hash", nullable = false, length = 60)
    private String senha;

    @Embedded
    private Endereco endereco;

    public Usuario() {
    }

    public UUID getId() {
        return id;
    }

    public String getCpf() {
        return cpf;
    }

    public void setCpf(String cpf) {
        this.cpf = cpf;
    }

    public String getNome() {
        return nome;
    }

    public void setNome(String nome) {
        this.nome = nome;
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
