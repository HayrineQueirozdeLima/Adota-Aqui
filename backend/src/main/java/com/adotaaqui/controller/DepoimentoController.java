package com.adotaaqui.controller;

import com.adotaaqui.dto.DepoimentoRequest;
import com.adotaaqui.dto.DepoimentoResponse;
import com.adotaaqui.dto.PaginaRequest;
import com.adotaaqui.dto.PaginaResponse;
import com.adotaaqui.service.DepoimentoService;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.ModelAttribute;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.UUID;

// Depoimentos e mural de histórias de adoção (docs/api.md, seção 11)
@Tag(name = "Histórias de adoção", description = "O mural público e a história que quem adotou conta")
@RestController
@RequestMapping("/api")
public class DepoimentoController {
    private final DepoimentoService service;

    public DepoimentoController(DepoimentoService service) {
        this.service = service;
    }

    @PostMapping("/interesses/{id}/depoimento")
    public ResponseEntity<DepoimentoResponse> escrever(@PathVariable UUID id,
                                                       @Valid @RequestBody DepoimentoRequest request,
                                                       Authentication conta) {
        return ResponseEntity.status(HttpStatus.CREATED).body(service.escrever(id, request, conta));
    }

    @GetMapping("/depoimentos")
    public PaginaResponse<DepoimentoResponse> mural(@Valid @ModelAttribute PaginaRequest pagina) {
        return service.mural(pagina);
    }

    @DeleteMapping("/depoimentos/{id}")
    public ResponseEntity<Void> apagar(@PathVariable UUID id, Authentication conta) {
        service.apagar(id, conta);
        return ResponseEntity.noContent().build();
    }
}
