package com.adotaaqui.controller;

import com.adotaaqui.dto.AtualizarStatusInteresseRequest;
import com.adotaaqui.dto.InteresseFiltroRequest;
import com.adotaaqui.dto.InteresseRecebidoResponse;
import com.adotaaqui.dto.InteresseRequest;
import com.adotaaqui.dto.InteresseResponse;
import com.adotaaqui.service.InteresseService;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.ModelAttribute;
import org.springframework.web.bind.annotation.PatchMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.UUID;
import java.util.List;

// Interesses (docs/api.md, seção 9). Os dois precisam de login: a regra
// "anyRequest().authenticated()" do SecurityConfig já cobre, sem token é 401
@RestController
@RequestMapping("/api")
public class InteresseController {
    private final InteresseService service;

    public InteresseController(InteresseService service) {
        this.service = service;
    }

    @GetMapping("/interesses/recebidos")
    public List<InteresseRecebidoResponse> recebidos(@Valid @ModelAttribute InteresseFiltroRequest filtro,
                                                   Authentication conta) {
        return service.recebidos(filtro, conta);
    }

    @PatchMapping("/interesses/{id}/status")
    public InteresseRecebidoResponse atualizarStatus(@PathVariable UUID id,
                                                     @Valid @RequestBody AtualizarStatusInteresseRequest request,
                                                     Authentication conta) {
        return service.atualizarStatus(id, request, conta);
    }

    @PostMapping("/animais/{id}/interesses")
    public ResponseEntity<InteresseResponse> demonstrar(@PathVariable UUID id,
                                                        @Valid @RequestBody InteresseRequest request,
                                                        Authentication conta) {
        return ResponseEntity.status(HttpStatus.CREATED).body(service.demonstrar(id, request, conta));
    }

    @DeleteMapping("/interesses/{id}")
    public ResponseEntity<Void> desistir(@PathVariable UUID id, Authentication conta) {
        service.desistir(id, conta);
        return ResponseEntity.noContent().build();
    }
}