package com.adotaaqui.service;

import com.adotaaqui.exception.IaIndisponivelException;
import com.fasterxml.jackson.databind.JsonNode;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.MediaType;
import org.springframework.http.client.SimpleClientHttpRequestFactory;
import org.springframework.stereotype.Component;
import org.springframework.web.client.RestClient;
import org.springframework.web.client.RestClientException;

import java.time.Duration;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;

/**
 * Fala com a API do Gemini (Google) pelo generateContent.
 * A chave vem da variável de ambiente GEMINI_API_KEY (no Render), nunca do código.
 * Ela vai no cabeçalho x-goog-api-key, e não na URL, pra não aparecer em log.
 * O modelo pode ser trocado pela variável GEMINI_MODELO, sem mexer no código.
 */
@Component
public class ClienteGemini implements GeradorDeTexto {
    private static final Logger log = LoggerFactory.getLogger(ClienteGemini.class);

    private final String chave;
    private final String modelo;
    private final RestClient http;

    public ClienteGemini(@Value("${app.ia.chave:}") String chave,
                         @Value("${app.ia.modelo:gemini-3.8-flash}") String modelo,
                         @Value("${app.ia.url:https://generativelanguage.googleapis.com/v1beta}") String url) {
        this.chave = chave == null ? "" : chave.strip();
        this.modelo = modelo;
        // A IA pode demorar uns segundos pra escrever. Mais que 30, a pessoa desiste e a gente libera a conexão
        SimpleClientHttpRequestFactory fabrica = new SimpleClientHttpRequestFactory();
        fabrica.setConnectTimeout(Duration.ofSeconds(5));
        fabrica.setReadTimeout(Duration.ofSeconds(30));
        this.http = RestClient.builder().baseUrl(url).requestFactory(fabrica).build();
        // Aparece no log do Render ao subir: dá pra conferir se a chave pegou sem mostrar a chave
        if (configurado()) log.info("IA ligada, com o modelo {}", modelo);
        else log.info("IA desligada: sem a variável GEMINI_API_KEY");
    }

    @Override
    public boolean configurado() {
        return !chave.isEmpty();
    }

    @Override
    public String gerar(String instrucao, String pedido, Map<String, Object> esquema) {
        if (!configurado()) throw new IaIndisponivelException();

        Map<String, Object> configuracao = new LinkedHashMap<>();
        configuracao.put("temperature", 0.7);
        configuracao.put("maxOutputTokens", 4096);
        if (esquema != null) {
            configuracao.put("responseMimeType", "application/json");
            configuracao.put("responseSchema", esquema);
        }
        Map<String, Object> corpo = Map.of(
                "systemInstruction", Map.of("parts", List.of(Map.of("text", instrucao))),
                "contents", List.of(Map.of("role", "user", "parts", List.of(Map.of("text", pedido)))),
                "generationConfig", configuracao);

        try {
            JsonNode resposta = http.post()
                    .uri("/models/{modelo}:generateContent", modelo)
                    .header("x-goog-api-key", chave)
                    .contentType(MediaType.APPLICATION_JSON)
                    .body(corpo)
                    .retrieve()
                    .body(JsonNode.class);
            String texto = textoDa(resposta);
            if (texto.isBlank()) throw new IaIndisponivelException();
            return texto;
        } catch (RestClientException ex) {
            // Só o tipo do erro vai pro log: a mensagem pode trazer o corpo da resposta do Google
            log.warn("A IA não respondeu ({})", ex.getClass().getSimpleName());
            throw new IaIndisponivelException();
        }
    }

    // O texto fica em candidates[0].content.parts[].text. As partes marcadas como "thought" são o rascunho
    // do raciocínio do modelo (quando vem), e não entram na resposta
    static String textoDa(JsonNode resposta) {
        if (resposta == null) return "";
        StringBuilder texto = new StringBuilder();
        for (JsonNode parte : resposta.path("candidates").path(0).path("content").path("parts")) {
            if (parte.path("thought").asBoolean(false)) continue;
            texto.append(parte.path("text").asText(""));
        }
        return texto.toString().strip();
    }
}
