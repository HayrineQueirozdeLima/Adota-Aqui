package com.adotaaqui.repository;

// Uma linha das contagens por estado, pro observatório (GET /api/estatisticas/estados)
public record ContagemPorEstado(String estado, Long total) {
}
