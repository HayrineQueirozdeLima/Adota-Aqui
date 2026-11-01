package com.adotaaqui.controller;

import com.adotaaqui.dto.EstatisticasResponse;
import com.adotaaqui.service.EstatisticasService;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

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
}
