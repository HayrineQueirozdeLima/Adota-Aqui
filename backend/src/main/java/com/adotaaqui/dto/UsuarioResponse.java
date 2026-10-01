package com.adotaaqui.dto;

import java.util.UUID;

public record UsuarioResponse(
        UUID id,
        String nome,
        String cpf,
        String telefone,
        String email,
        EnderecoDto endereco) {
}


