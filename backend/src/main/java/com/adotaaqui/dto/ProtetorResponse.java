package com.adotaaqui.dto;


public record ProtetorResponse(
        String nome,
        String cidade,
        String estado,
        // Foto de perfil de quem cadastrou, ou null (aí o site mostra as iniciais)
        String fotoUrl) {

    public ProtetorResponse(String nome, String cidade, String estado) {
        this(nome, cidade, estado, null);
    }
}


