package com.adotaaqui.controller;

import com.adotaaqui.dto.FotoResponse;
import com.adotaaqui.service.FotoService;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.multipart.MultipartFile;

// POST /api/fotos (docs/api.md, seção 8): uma imagem por vez, no campo "arquivo" (multipart/form-data).
// Precisa de login: a regra "anyRequest().authenticated()" do SecurityConfig já cobre.
@RestController
@RequestMapping("/api/fotos")
public class FotoController {

    private final FotoService fotoService;

    public FotoController(FotoService fotoService) {
        this.fotoService = fotoService;
    }

    // required = false de propósito: sem arquivo, quem responde é o FotoService, com a mensagem do nosso padrão
    @PostMapping
    public ResponseEntity<FotoResponse> enviar(@RequestParam(value = "arquivo", required = false) MultipartFile arquivo) {
        return ResponseEntity.status(HttpStatus.CREATED).body(fotoService.enviar(arquivo));
    }
}