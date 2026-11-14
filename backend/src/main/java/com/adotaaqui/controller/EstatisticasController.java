package com.adotaaqui.controller;

import com.adotaaqui.dto.EstatisticasResponse;
import com.adotaaqui.service.EstatisticasService;
import io.swagger.v3.oas.annotations.tags.Tag;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

@Tag(name = "Números do site", description = "Os números da Home e do observatório, por estado")
@RestController
@RequestMapping("/api/estatisticas")
public class EstatisticasController {
    private final EstatisticasService service;

    public EstatisticasController(EstatisticasService service) {
        this.service = service;
    }

    @GetMapping
    public EstatisticasResponse buscar() {
        return service.buscar();
    }

    // Observatório: os mesmos números, estado por estado
    @GetMapping("/estados")
    public List<EstatisticasResponse.PorEstado> porEstado() {
        return service.porEstado();
    }
}
