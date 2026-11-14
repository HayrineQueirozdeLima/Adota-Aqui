package com.adotaaqui.service;

import com.adotaaqui.exception.IaIndisponivelException;
import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.MediaType;
import org.springframework.http.client.SimpleClientHttpRequestFactory;
import org.springframework.stereotype.Component;
import org.springframework.web.client.ResourceAccessException;
import org.springframework.web.client.RestClient;
import org.springframework.web.client.RestClientException;
import org.springframework.web.client.RestClientResponseException;

import java.time.Duration;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.Set;

/**
 * Fala com a API do Gemini (Google) pelo generateContent.
 * A chave vem da variável de ambiente GEMINI_API_KEY (no Render), nunca do código.
 * Ela vai no cabeçalho x-goog-api-key, e não na URL, pra não aparecer em log.
 *
 * O modelo principal (GEMINI_MODELO) é um Flash-Lite: responde rápido e a cota grátis é bem maior que a do Flash.
 * Se ele estiver sem cota, fora do ar ou voltar sem texto, a gente tenta uma vez o modelo reserva
 * (GEMINI_MODELO_RESERVA). Os dois podem ser trocados no Render, sem mexer no código.
 */
@Component
public class ClienteGemini implements GeradorDeTexto {
    private static final Logger log = LoggerFactory.getLogger(ClienteGemini.class);
    private static final ObjectMapper json = new ObjectMapper();

    // Erros em que vale tentar o outro modelo: modelo que não existe (404), sem cota (429) e Google fora do ar (5xx).
    // Chave errada (400, 401, 403) daria o mesmo erro no reserva, então não tenta
    private static final Set<Integer> TENTAR_O_RESERVA = Set.of(404, 429, 500, 502, 503, 504);

    // O "pensamento" do modelo gasta o mesmo limite da resposta. Com folga, ele nunca fica sem espaço pro texto
    private static final int LIMITE_DE_TOKENS = 8192;

    private final String chave;
    private final String modelo;
    private final String modeloReserva;
    private final String raciocinio;
    private final RestClient http;

    @Autowired
    public ClienteGemini(@Value("${app.ia.chave:}") String chave,
                         @Value("${app.ia.modelo:gemini-3.5-flash-lite}") String modelo,
                         @Value("${app.ia.modelo-reserva:gemini-3.6-flash}") String modeloReserva,
                         @Value("${app.ia.raciocinio:low}") String raciocinio,
                         @Value("${app.ia.url:https://generativelanguage.googleapis.com/v1beta}") String url) {
        this(chave, modelo, modeloReserva, raciocinio, url, Duration.ofSeconds(20));
    }

    // Nos testes, o tempo de espera é menor, pra conferir a demora sem deixar o teste lento
    ClienteGemini(String chave, String modelo, String modeloReserva, String raciocinio, String url, Duration espera) {
        this.chave = chave == null ? "" : chave.strip();
        this.modelo = modelo.strip();
        this.modeloReserva = modeloReserva == null ? "" : modeloReserva.strip();
        this.raciocinio = raciocinio == null ? "" : raciocinio.strip();
        SimpleClientHttpRequestFactory fabrica = new SimpleClientHttpRequestFactory();
        fabrica.setConnectTimeout(Duration.ofSeconds(5));
        fabrica.setReadTimeout(espera);
        this.http = RestClient.builder().baseUrl(url).requestFactory(fabrica).build();
        // Aparece no log do Render ao subir: dá pra conferir se a chave pegou sem mostrar a chave
        if (configurado()) log.info("IA ligada, com o modelo {} (reserva: {})", this.modelo, reservaOuNenhum());
        else log.info("IA desligada: sem a variável GEMINI_API_KEY");
    }

    @Override
    public boolean configurado() {
        return !chave.isEmpty();
    }

    @Override
    public String gerar(String instrucao, String pedido, Map<String, Object> esquema) {
        if (!configurado()) throw new IaIndisponivelException();
        Map<String, Object> corpo = corpoDoPedido(instrucao, pedido, esquema);
        try {
            return pedirAo(modelo, corpo);
        } catch (VaiNoReserva motivo) {
            if (modeloReserva.isEmpty() || modeloReserva.equals(modelo)) throw new IaIndisponivelException();
            try {
                String texto = pedirAo(modeloReserva, corpo);
                log.info("A IA respondeu pelo modelo reserva {} ({} no {})", modeloReserva, motivo.getMessage(), modelo);
                return texto;
            } catch (VaiNoReserva outroMotivo) {
                throw new IaIndisponivelException();
            }
        }
    }

    private Map<String, Object> corpoDoPedido(String instrucao, String pedido, Map<String, Object> esquema) {
        Map<String, Object> configuracao = new LinkedHashMap<>();
        configuracao.put("temperature", 0.7);
        configuracao.put("maxOutputTokens", LIMITE_DE_TOKENS);
        // Pensar pouco: a resposta sai em poucos segundos, e pra textos curtos a qualidade é a mesma.
        // Vazio na variável GEMINI_RACIOCINIO = deixa o padrão do modelo
        if (!raciocinio.isEmpty()) configuracao.put("thinkingConfig", Map.of("thinkingLevel", raciocinio));
        if (esquema != null) {
            configuracao.put("responseMimeType", "application/json");
            configuracao.put("responseSchema", esquema);
        }
        return Map.of(
                "systemInstruction", Map.of("parts", List.of(Map.of("text", instrucao))),
                "contents", List.of(Map.of("role", "user", "parts", List.of(Map.of("text", pedido)))),
                "generationConfig", configuracao);
    }

    private String pedirAo(String qualModelo, Map<String, Object> corpo) {
        JsonNode resposta;
        try {
            resposta = http.post()
                    .uri("/models/{modelo}:generateContent", qualModelo)
                    .header("x-goog-api-key", chave)
                    .contentType(MediaType.APPLICATION_JSON)
                    .body(corpo)
                    .retrieve()
                    .body(JsonNode.class);
        } catch (RestClientResponseException ex) {
            // No log vai só o código e o tipo do erro do Google (ex.: 429 RESOURCE_EXHAUSTED = sem cota),
            // nunca a mensagem inteira, que pode repetir o pedido
            int codigo = ex.getStatusCode().value();
            String motivo = codigo + " " + statusDoGoogle(ex.getResponseBodyAsString());
            log.warn("A IA não respondeu pelo modelo {}: {}", qualModelo, motivo);
            if (TENTAR_O_RESERVA.contains(codigo)) throw new VaiNoReserva(motivo);
            throw new IaIndisponivelException();
        } catch (ResourceAccessException ex) {
            // Passou do tempo de espera (ou sem conexão). A pessoa já esperou: não tenta de novo
            log.warn("A IA demorou demais pelo modelo {}", qualModelo);
            throw new IaIndisponivelException();
        } catch (RestClientException ex) {
            log.warn("A IA não respondeu pelo modelo {} ({})", qualModelo, ex.getClass().getSimpleName());
            throw new IaIndisponivelException();
        }

        String texto = textoDa(resposta);
        if (texto.isBlank()) {
            // Ex.: MAX_TOKENS (gastou o limite pensando) ou SAFETY (o Google barrou a resposta)
            String fim = resposta == null ? "sem resposta" : resposta.path("candidates").path(0).path("finishReason").asText("sem motivo");
            log.warn("A IA respondeu sem texto pelo modelo {} ({})", qualModelo, fim);
            throw new VaiNoReserva("sem texto, " + fim);
        }
        return texto;
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

    // O Google devolve { "error": { "code": 429, "status": "RESOURCE_EXHAUSTED", "message": "..." } }
    static String statusDoGoogle(String corpo) {
        try {
            return json.readTree(corpo).path("error").path("status").asText("sem status");
        } catch (Exception ex) {
            return "sem status";
        }
    }

    private String reservaOuNenhum() {
        return modeloReserva.isEmpty() ? "nenhum" : modeloReserva;
    }

    // Aviso interno de que o modelo não deu conta e vale tentar o reserva
    private static class VaiNoReserva extends RuntimeException {
        VaiNoReserva(String motivo) {
            super(motivo, null, false, false);
        }
    }
}
