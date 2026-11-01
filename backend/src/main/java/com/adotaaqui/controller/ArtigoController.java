package com.adotaaqui.controller;

import com.adotaaqui.dto.ArtigoFiltroRequest;
import com.adotaaqui.dto.ArtigoRequest;
import com.adotaaqui.dto.ArtigoResponse;
import com.adotaaqui.dto.ArtigoResumoResponse;
import com.adotaaqui.dto.MeusArtigosResponse;
import com.adotaaqui.dto.PaginaResponse;
import com.adotaaqui.service.ArtigoService;
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

// Blog para tutores (docs/api.md, seção 12)
@RestController
@RequestMapping("/api/artigos")
public class ArtigoController {
    private final ArtigoService service;

    public ArtigoController(ArtigoService service) {
        this.service = service;
    }

    @GetMapping
    public PaginaResponse<ArtigoResumoResponse> listar(@Valid @ModelAttribute ArtigoFiltroRequest filtro) {
        return service.listar(filtro);
    }

    @GetMapping("/meus")
    public MeusArtigosResponse meus(Authentication conta) {
        return service.meus(conta);
    }

    @GetMapping("/{id}")
    public ArtigoResponse buscar(@PathVariable UUID id, Authentication conta) {
        return service.buscar(id, conta);
    }

    @PostMapping
    public ResponseEntity<ArtigoResponse> publicar(@Valid @RequestBody ArtigoRequest request, Authentication conta) {
        ArtigoResponse resposta = service.publicar(request, conta);
        return ResponseEntity.created(URI.create("/api/artigos/" + resposta.id())).body(resposta);
    }

    @PutMapping("/{id}")
    public ArtigoResponse editar(@PathVariable UUID id, @Valid @RequestBody ArtigoRequest request, Authentication conta) {
        return service.editar(id, request, conta);
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> apagar(@PathVariable UUID id, Authentication conta) {
        service.apagar(id, conta);
        return ResponseEntity.noContent().build();
    }
}
