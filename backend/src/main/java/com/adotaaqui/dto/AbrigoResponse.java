package com.adotaaqui.dto;

import java.util.UUID;

public record AbrigoResponse(
        UUID id,
        String nome,
        String cnpj,
        String razaoSocial,
        String telefone,
        String email,
        EnderecoDto endereco) {
}


