package com.adotaaqui.controller;

import com.adotaaqui.dto.PaginaResponse;
import com.adotaaqui.dto.ProtetorFiltroRequest;
import com.adotaaqui.dto.ProtetorListagemResponse;
import com.adotaaqui.service.ProtetorService;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.ModelAttribute;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

// Abrigos e protetores independentes (docs/api.md, seção 13): aberto pra qualquer pessoa
@Tag(name = "Abrigos e protetores", description = "Lista pública de abrigos e protetores independentes")
@RestController
@RequestMapping("/api/protetores")
public class ProtetorController {
    private final ProtetorService service;

    public ProtetorController(ProtetorService service) {
        this.service = service;
    }

    @GetMapping
    public PaginaResponse<ProtetorListagemResponse> listar(@Valid @ModelAttribute ProtetorFiltroRequest filtro) {
        return service.listar(filtro);
    }
}
