package com.adotaaqui.service;

import com.adotaaqui.exception.LimiteDeUsoException;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Component;

import java.time.Clock;
import java.time.Duration;
import java.time.Instant;
import java.util.ArrayDeque;
import java.util.Deque;
import java.util.Map;
import java.util.concurrent.ConcurrentHashMap;

/**
 * Quantas vezes cada conta (ou endereço, pra visitante) pode pedir à IA por hora.
 * Fica na memória do servidor: se o Render reiniciar, a contagem recomeça, e tudo bem.
 * Serve pra cota gratuita da IA não acabar com cliques repetidos ou com robô.
 */
@Component
public class LimiteDeUsoDaIa {
    private static final Duration JANELA = Duration.ofHours(1);

    private final int limitePorHora;
    private final Clock relogio;
    private final Map<String, Deque<Instant>> pedidos = new ConcurrentHashMap<>();

    public LimiteDeUsoDaIa(@Value("${app.ia.limite-por-hora:15}") int limitePorHora) {
        this(limitePorHora, Clock.systemUTC());
    }

    LimiteDeUsoDaIa(int limitePorHora, Clock relogio) {
        this.limitePorHora = limitePorHora;
        this.relogio = relogio;
    }

    // Conta mais um pedido de quem. Se passou do limite na última hora, recusa (o pedido recusado não conta)
    public void registrar(String quem) {
        Instant agora = relogio.instant();
        Deque<Instant> deQuem = pedidos.computeIfAbsent(quem, chave -> new ArrayDeque<>());
        synchronized (deQuem) {
            while (!deQuem.isEmpty() && deQuem.peekFirst().isBefore(agora.minus(JANELA))) deQuem.pollFirst();
            if (deQuem.size() >= limitePorHora) {
                throw new LimiteDeUsoException("Você já usou a IA muitas vezes nesta hora. Tente de novo mais tarde.");
            }
            deQuem.addLast(agora);
        }
    }
}
