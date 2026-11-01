package com.adotaaqui.dto;

// Os números do site que aparecem na Home (GET /api/estatisticas)
public record EstatisticasResponse(long adocoes, long animaisDisponiveis, long abrigos) {
}
