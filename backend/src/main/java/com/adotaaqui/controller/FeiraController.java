package com.adotaaqui.controller;

import com.adotaaqui.dto.FeiraFiltroRequest;
import com.adotaaqui.dto.FeiraRequest;
import com.adotaaqui.dto.FeiraResponse;
import com.adotaaqui.dto.PaginaResponse;
import com.adotaaqui.service.FeiraService;
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
import java.util.List;
import java.util.UUID;

// Feiras de adoção (docs/api.md, seção 14)
@RestController
@RequestMapping("/api/feiras")
public class FeiraController {
    private final FeiraService service;

    public FeiraController(FeiraService service) {
        this.service = service;
    }

    @GetMapping
    public PaginaResponse<FeiraResponse> listar(@Valid @ModelAttribute FeiraFiltroRequest filtro, Authentication conta) {
        return service.listar(filtro, conta);
    }

    @GetMapping("/minhas")
    public List<FeiraResponse> minhas(Authentication conta) {
        return service.minhas(conta);
    }

    @GetMapping("/{id}")
    public FeiraResponse buscar(@PathVariable UUID id, Authentication conta) {
        return service.buscar(id, conta);
    }

    @PostMapping
    public ResponseEntity<FeiraResponse> criar(@Valid @RequestBody FeiraRequest request, Authentication conta) {
        FeiraResponse resposta = service.criar(request, conta);
        return ResponseEntity.created(URI.create("/api/feiras/" + resposta.id())).body(resposta);
    }

    @PutMapping("/{id}")
    public FeiraResponse editar(@PathVariable UUID id, @Valid @RequestBody FeiraRequest request, Authentication conta) {
        return service.editar(id, request, conta);
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> apagar(@PathVariable UUID id, Authentication conta) {
        service.apagar(id, conta);
        return ResponseEntity.noContent().build();
    }
}
