package com.adotaaqui.dto;

import com.adotaaqui.model.Abrigo;
import com.adotaaqui.model.Usuario;
import com.adotaaqui.model.enums.TipoConta;

import java.util.UUID;

/**
 * Resposta pública de uma conta: nunca expõe a senha.
 */
public record ContaResponse(
        UUID id,
        TipoConta tipoConta,
        String documento,
        String nome,
        String email) {

    public static ContaResponse de(Usuario usuario) {
        return new ContaResponse(usuario.getId(), TipoConta.USUARIO, usuario.getCpf(),
                usuario.getNome(), usuario.getEmail());
    }

    public static ContaResponse de(Abrigo abrigo) {
        return new ContaResponse(abrigo.getId(), TipoConta.ABRIGO, abrigo.getCnpj(),
                abrigo.getNome(), abrigo.getEmail());
    }
}
