package com.adotaaqui.dto;

import jakarta.validation.constraints.NotBlank;

public class LoginRequest {

    @NotBlank(message = "O documento (CPF ou CNPJ) é obrigatório")
    private String documento;

    @NotBlank(message = "A senha é obrigatória")
    private String senha;

    public String getDocumento() {
        return documento;
    }

    public void setDocumento(String documento) {
        this.documento = documento;
    }

    public String getSenha() {
        return senha;
    }

    public void setSenha(String senha) {
        this.senha = senha;
    }
}
