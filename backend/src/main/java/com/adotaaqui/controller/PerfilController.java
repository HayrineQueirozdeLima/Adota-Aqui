package com.adotaaqui.controller;

import com.adotaaqui.dto.AbrigoResponse;
import com.adotaaqui.dto.AlterarSenhaRequest;
import com.adotaaqui.dto.AtualizarAbrigoRequest;
import com.adotaaqui.dto.AtualizarUsuarioRequest;
import com.adotaaqui.dto.UsuarioResponse;
import com.adotaaqui.service.PerfilService;
import jakarta.validation.Valid;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PatchMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

// Perfil da conta (docs/api.md, seção 7). O "me" fica no lugar do id: a API sabe a conta pelo token.
// Todos precisam de login: o "anyRequest().authenticated()" do SecurityConfig já cobre, sem token é 401
@RestController
@RequestMapping("/api")
public class PerfilController {
    private final PerfilService service;

    public PerfilController(PerfilService service) {
        this.service = service;
    }

    @GetMapping("/usuarios/me")
    public UsuarioResponse usuario(Authentication conta) {
        return service.usuario(conta);
    }

    @PutMapping("/usuarios/me")
    public UsuarioResponse atualizarUsuario(@Valid @RequestBody AtualizarUsuarioRequest request,
                                            Authentication conta) {
        return service.atualizarUsuario(request, conta);
    }

    @PatchMapping("/usuarios/me/senha")
    public ResponseEntity<Void> alterarSenhaUsuario(@Valid @RequestBody AlterarSenhaRequest request,
                                                    Authentication conta) {
        service.alterarSenhaUsuario(request, conta);
        return ResponseEntity.noContent().build();
    }

    @GetMapping("/abrigos/me")
    public AbrigoResponse abrigo(Authentication conta) {
        return service.abrigo(conta);
    }

    @PutMapping("/abrigos/me")
    public AbrigoResponse atualizarAbrigo(@Valid @RequestBody AtualizarAbrigoRequest request,
                                          Authentication conta) {
        return service.atualizarAbrigo(request, conta);
    }

    @PatchMapping("/abrigos/me/senha")
    public ResponseEntity<Void> alterarSenhaAbrigo(@Valid @RequestBody AlterarSenhaRequest request,
                                                   Authentication conta) {
        service.alterarSenhaAbrigo(request, conta);
        return ResponseEntity.noContent().build();
    }
}