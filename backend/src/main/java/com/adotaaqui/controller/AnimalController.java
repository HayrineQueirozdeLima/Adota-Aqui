package com.adotaaqui.controller;

import com.adotaaqui.dto.AnimalFiltroRequest;
import com.adotaaqui.dto.AnimalListagemResponse;
import com.adotaaqui.dto.AnimalRequest;
import com.adotaaqui.dto.AnimalResponse;
import com.adotaaqui.dto.AtualizarAnimalRequest;
import com.adotaaqui.dto.RacaResponse;
import com.adotaaqui.model.enums.Especie;
import com.adotaaqui.model.enums.Raca;
import com.adotaaqui.service.AnimalService;
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
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import java.net.URI;
import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/api")
public class AnimalController {
    private final AnimalService service;

    public AnimalController(AnimalService service) {
        this.service = service;
    }

    @PostMapping("/animais")
    public ResponseEntity<AnimalResponse> cadastrar(@Valid @RequestBody AnimalRequest request, Authentication conta) {
        AnimalResponse resposta = service.cadastrar(request, conta);
        return ResponseEntity.created(URI.create("/api/animais/" + resposta.id())).body(resposta);
    }

    @GetMapping("/animais")
    public List<AnimalListagemResponse> listar(@Valid @ModelAttribute AnimalFiltroRequest filtro, Authentication conta) {
        return service.listar(filtro, conta);
    }

    @GetMapping("/animais/meus")
    public List<AnimalListagemResponse> listarMeus(Authentication conta) {
        return service.listarMeus(conta);
    }

    @GetMapping("/animais/{id}")
    public AnimalResponse buscar(@PathVariable UUID id, Authentication conta) {
        return service.buscar(id, conta);
    }

    @PutMapping("/animais/{id}")
    public AnimalResponse atualizar(@PathVariable UUID id, @Valid @RequestBody AtualizarAnimalRequest request,
                                    Authentication conta) {
        return service.atualizar(id, request, conta);
    }

    @DeleteMapping("/animais/{id}")
    public ResponseEntity<Void> remover(@PathVariable UUID id, Authentication conta) {
        service.remover(id, conta);
        return ResponseEntity.noContent().build();
    }

    @GetMapping("/racas")
    public List<RacaResponse> racas(@RequestParam Especie especie) {
        return Raca.listarPorEspecie(especie).stream().map(r -> new RacaResponse(r, r.getNome())).toList();
    }
}

