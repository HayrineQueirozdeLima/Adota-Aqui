package com.adotaaqui.dto;

// Os números do site que aparecem na Home (GET /api/estatisticas)
public record EstatisticasResponse(long adocoes, long animaisDisponiveis, long abrigos) {

    // Os mesmos números, de um estado, pro observatório (GET /api/estatisticas/estados)
    public record PorEstado(String estado, long adocoes, long animaisDisponiveis, long abrigos) {
    }
}
