package com.adotaaqui.controller;

import com.adotaaqui.dto.DescricaoIaRequest;
import com.adotaaqui.dto.IaResponses;
import com.adotaaqui.service.IaService;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.validation.Valid;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

// Ajudas com IA (docs/api.md, seção 15)
@RestController
@RequestMapping("/api/ia")
public class IaController {
    private final IaService service;

    public IaController(IaService service) {
        this.service = service;
    }

    @GetMapping("/disponivel")
    public IaResponses.Disponivel disponivel() {
        return service.disponivel();
    }

    @PostMapping("/descricao")
    public IaResponses.Descricao descricao(@Valid @RequestBody DescricaoIaRequest pedido, Authentication conta) {
        return service.escreverDescricao(pedido, conta);
    }

    @PostMapping("/sugestoes")
    public IaResponses.Sugestoes sugestoes(@Valid @RequestBody IaResponses.PedidoDeSugestoes pedido,
                                           Authentication conta, HttpServletRequest requisicao) {
        return service.sugerir(pedido, conta, enderecoDeQuemPede(requisicao));
    }

    // No Render a API fica atrás de um proxy: o endereço de quem pediu vem no X-Forwarded-For (o primeiro da lista)
    private static String enderecoDeQuemPede(HttpServletRequest requisicao) {
        String encaminhado = requisicao.getHeader("X-Forwarded-For");
        if (encaminhado != null && !encaminhado.isBlank()) return encaminhado.split(",")[0].strip();
        return requisicao.getRemoteAddr();
    }
}
