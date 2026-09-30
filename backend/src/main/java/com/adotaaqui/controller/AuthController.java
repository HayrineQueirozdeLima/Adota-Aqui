package com.adotaaqui.controller;

import com.adotaaqui.dto.CadastroAbrigoRequest;
import com.adotaaqui.dto.CadastroUsuarioRequest;
import com.adotaaqui.dto.LoginRequest;
import com.adotaaqui.dto.LoginResponse;
import com.adotaaqui.service.AutenticacaoService;
import com.adotaaqui.service.CadastroService;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api")
public class AuthController {

    private final CadastroService cadastroService;
    private final AutenticacaoService autenticacaoService;

    public AuthController(CadastroService cadastroService, AutenticacaoService autenticacaoService) {
        this.cadastroService = cadastroService;
        this.autenticacaoService = autenticacaoService;
    }

    @PostMapping("/usuarios")
    public ResponseEntity<LoginResponse> cadastrarUsuario(@Valid @RequestBody CadastroUsuarioRequest request) {
        return ResponseEntity.status(HttpStatus.CREATED).body(cadastroService.cadastrarUsuario(request));
    }

    @PostMapping("/abrigos")
    public ResponseEntity<LoginResponse> cadastrarAbrigo(@Valid @RequestBody CadastroAbrigoRequest request) {
        return ResponseEntity.status(HttpStatus.CREATED).body(cadastroService.cadastrarAbrigo(request));
    }

    @PostMapping("/auth/login")
    public ResponseEntity<LoginResponse> login(@Valid @RequestBody LoginRequest request) {
        return ResponseEntity.ok(autenticacaoService.autenticar(request));
    }
}
