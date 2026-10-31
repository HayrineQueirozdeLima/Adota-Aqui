package com.adotaaqui.controller;

import com.adotaaqui.dto.DicaFiltroRequest;
import com.adotaaqui.dto.DicaRequest;
import com.adotaaqui.dto.DicaResponse;
import com.adotaaqui.dto.DicaResumoResponse;
import com.adotaaqui.dto.MinhasDicasResponse;
import com.adotaaqui.dto.PaginaResponse;
import com.adotaaqui.service.DicaService;
import jakarta.validation.Valid;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.ModelAttribute;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.net.URI;
import java.util.UUID;

// Blog de dicas (docs/api.md, seção 12)
@RestController
@RequestMapping("/api/dicas")
public class DicaController {
    private final DicaService service;

    public DicaController(DicaService service) {
        this.service = service;
    }

    @GetMapping
    public PaginaResponse<DicaResumoResponse> listar(@Valid @ModelAttribute DicaFiltroRequest filtro) {
        return service.listar(filtro);
    }

    @GetMapping("/minhas")
    public MinhasDicasResponse minhas(Authentication conta) {
        return service.minhas(conta);
    }

    @GetMapping("/{id}")
    public DicaResponse buscar(@PathVariable UUID id, Authentication conta) {
        return service.buscar(id, conta);
    }

    @PostMapping
    public ResponseEntity<DicaResponse> publicar(@Valid @RequestBody DicaRequest request, Authentication conta) {
        DicaResponse resposta = service.publicar(request, conta);
        return ResponseEntity.created(URI.create("/api/dicas/" + resposta.id())).body(resposta);
    }

    @PutMapping("/{id}")
    public DicaResponse editar(@PathVariable UUID id, @Valid @RequestBody DicaRequest request, Authentication conta) {
        return service.editar(id, request, conta);
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> apagar(@PathVariable UUID id, Authentication conta) {
        service.apagar(id, conta);
        return ResponseEntity.noContent().build();
    }
}
