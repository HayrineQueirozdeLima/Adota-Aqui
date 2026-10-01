package com.adotaaqui.dto;

import jakarta.validation.Valid;
import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.Size;

/** Campos editáveis do abrigo autenticado; CNPJ não é editável. */
public class AtualizarAbrigoRequest {

    @NotBlank(message = "O nome é obrigatório")
    @Size(max = 120, message = "Deve ter no máximo 120 caracteres")
    private String nome;

    @NotBlank(message = "A razão social é obrigatória")
    @Size(max = 150, message = "Deve ter no máximo 150 caracteres")
    private String razaoSocial;

    @NotBlank(message = "O telefone é obrigatório")
    @Pattern(regexp = "[0-9]{10,11}", message = "O telefone deve conter DDD e número, com 10 ou 11 dígitos")
    private String telefone;

    @NotBlank(message = "O e-mail é obrigatório")
    @Email(message = "E-mail inválido")
    @Size(max = 120, message = "Deve ter no máximo 120 caracteres")
    private String email;

    @NotNull(message = "O endereço é obrigatório")
    @Valid
    private EnderecoDto endereco;

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

    public String getTelefone() {
        return telefone;
    }

    public void setTelefone(String telefone) {
        this.telefone = telefone;
    }

    public String getEmail() {
        return email;
    }

    public void setEmail(String email) {
        this.email = email;
    }

    public EnderecoDto getEndereco() {
        return endereco;
    }

    public void setEndereco(EnderecoDto endereco) {
        this.endereco = endereco;
    }
}


