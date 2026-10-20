package com.adotaaqui.dto;

// Resposta do POST /api/fotos: a URL que o front manda depois no campo "fotos" do animal
public record FotoResponse(String url) {
}