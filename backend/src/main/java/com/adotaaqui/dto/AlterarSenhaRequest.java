package com.adotaaqui.dto;

import com.fasterxml.jackson.annotation.JsonProperty;

import com.fasterxml.jackson.annotation.JsonIgnore;
import jakarta.validation.constraints.AssertTrue;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

/** Troca de senha das duas contas. A conferência da senha atual pertence ao Service. */
public class AlterarSenhaRequest {

    @NotBlank(message = "A senha atual é obrigatória")
    @JsonProperty(access = JsonProperty.Access.WRITE_ONLY)
    private String senhaAtual;

    @NotBlank(message = "A nova senha é obrigatória")
    @Size(min = 8, max = 72, message = "A senha deve ter entre 8 e 72 caracteres")
    @JsonProperty(access = JsonProperty.Access.WRITE_ONLY)
    private String novaSenha;

    @NotBlank(message = "A confirmação da nova senha é obrigatória")
    @JsonProperty(access = JsonProperty.Access.WRITE_ONLY)
    private String confirmacaoNovaSenha;

    public String getSenhaAtual() {
        return senhaAtual;
    }

    public void setSenhaAtual(String senhaAtual) {
        this.senhaAtual = senhaAtual;
    }

    public String getNovaSenha() {
        return novaSenha;
    }

    public void setNovaSenha(String novaSenha) {
        this.novaSenha = novaSenha;
    }

    public String getConfirmacaoNovaSenha() {
        return confirmacaoNovaSenha;
    }

    public void setConfirmacaoNovaSenha(String confirmacaoNovaSenha) {
        this.confirmacaoNovaSenha = confirmacaoNovaSenha;
    }

    @JsonIgnore
    @AssertTrue(message = "A confirmação da nova senha deve ser igual à nova senha")
    public boolean isNovasSenhasConferem() {
        return novaSenha == null || confirmacaoNovaSenha == null || novaSenha.equals(confirmacaoNovaSenha);
    }
}


