package com.adotaaqui.service;

import com.adotaaqui.exception.IaIndisponivelException;
import com.sun.net.httpserver.HttpServer;
import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;

import java.io.IOException;
import java.io.OutputStream;
import java.net.InetSocketAddress;
import java.nio.charset.StandardCharsets;
import java.time.Duration;
import java.util.List;
import java.util.Map;
import java.util.concurrent.ConcurrentHashMap;
import java.util.concurrent.CopyOnWriteArrayList;
import java.util.concurrent.Executors;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;

/**
 * O cliente do Gemini contra um servidor de mentira na própria máquina, que faz o papel do Google:
 * responde o que cada teste mandar pra cada modelo e guarda o que recebeu.
 */
class ClienteGeminiTest {

    private record Resposta(int codigo, String corpo, long demoraEmMs) {
    }

    private HttpServer google;
    private final Map<String, Resposta> respostas = new ConcurrentHashMap<>();
    private final List<String> modelosPedidos = new CopyOnWriteArrayList<>();
    private final List<String> corposRecebidos = new CopyOnWriteArrayList<>();
    private final List<String> chavesRecebidas = new CopyOnWriteArrayList<>();

    @BeforeEach
    void subirOGoogleDeMentira() throws IOException {
        google = HttpServer.create(new InetSocketAddress("127.0.0.1", 0), 0);
        google.setExecutor(Executors.newCachedThreadPool());
        google.createContext("/models/", troca -> {
            String caminho = troca.getRequestURI().getPath();
            String modelo = caminho.substring("/models/".length(), caminho.indexOf(':'));
            modelosPedidos.add(modelo);
            chavesRecebidas.add(troca.getRequestHeaders().getFirst("x-goog-api-key"));
            corposRecebidos.add(new String(troca.getRequestBody().readAllBytes(), StandardCharsets.UTF_8));
            Resposta resposta = respostas.getOrDefault(modelo, erro(404, "NOT_FOUND"));
            try {
                if (resposta.demoraEmMs() > 0) Thread.sleep(resposta.demoraEmMs());
                byte[] corpo = resposta.corpo().getBytes(StandardCharsets.UTF_8);
                troca.getResponseHeaders().add("Content-Type", "application/json");
                troca.sendResponseHeaders(resposta.codigo(), corpo.length);
                try (OutputStream saida = troca.getResponseBody()) {
                    saida.write(corpo);
                }
            } catch (IOException | InterruptedException ex) {
                // o cliente já desistiu de esperar (teste da demora)
            } finally {
                troca.close();
            }
        });
        google.start();
    }

    @AfterEach
    void descer() {
        google.stop(0);
    }

    private ClienteGemini cliente(String reserva) {
        String endereco = "http://127.0.0.1:" + google.getAddress().getPort();
        return new ClienteGemini("chave-de-teste", "modelo-principal", reserva, "low", endereco, Duration.ofMillis(800));
    }

    private static Resposta comTexto(String texto) {
        return new Resposta(200, """
                {"candidates":[{"content":{"parts":[
                  {"text":"rascunho do raciocínio","thought":true},
                  {"text":"%s"}
                ]},"finishReason":"STOP"}]}""".formatted(texto), 0);
    }

    private static Resposta erro(int codigo, String status) {
        return new Resposta(codigo, """
                {"error":{"code":%d,"status":"%s","message":"texto do Google"}}""".formatted(codigo, status), 0);
    }

    private String pedir(ClienteGemini cliente) {
        return cliente.gerar("Você ajuda protetores de animais.", "Escreva sobre a Mel.", null);
    }

    @Test
    void pedePraPensarPoucoComFolgaDeTokensEMandaAChaveNoCabecalho() {
        respostas.put("modelo-principal", comTexto("A Mel é carinhosa."));

        assertThat(pedir(cliente("modelo-reserva"))).isEqualTo("A Mel é carinhosa.");
        assertThat(modelosPedidos).containsExactly("modelo-principal");
        assertThat(chavesRecebidas).containsExactly("chave-de-teste");
        assertThat(corposRecebidos.get(0))
                .contains("\"thinkingConfig\":{\"thinkingLevel\":\"low\"}")
                .contains("\"maxOutputTokens\":8192")
                .doesNotContain("chave-de-teste");
    }

    @Test
    void semCotaNoPrincipalTentaOReserva() {
        respostas.put("modelo-principal", erro(429, "RESOURCE_EXHAUSTED"));
        respostas.put("modelo-reserva", comTexto("Resposta do reserva."));

        assertThat(pedir(cliente("modelo-reserva"))).isEqualTo("Resposta do reserva.");
        assertThat(modelosPedidos).containsExactly("modelo-principal", "modelo-reserva");
    }

    @Test
    void modeloQueNaoExisteMaisTentaOReserva() {
        respostas.put("modelo-principal", erro(404, "NOT_FOUND"));
        respostas.put("modelo-reserva", comTexto("Resposta do reserva."));

        assertThat(pedir(cliente("modelo-reserva"))).isEqualTo("Resposta do reserva.");
    }

    @Test
    void respostaSemTextoPorqueGastouOLimitePensandoTentaOReserva() {
        respostas.put("modelo-principal", new Resposta(200, """
                {"candidates":[{"content":{"parts":[{"text":"pensando...","thought":true}]},"finishReason":"MAX_TOKENS"}]}""", 0));
        respostas.put("modelo-reserva", comTexto("Resposta do reserva."));

        assertThat(pedir(cliente("modelo-reserva"))).isEqualTo("Resposta do reserva.");
    }

    @Test
    void chaveErradaNaoTentaOReservaPorqueDariaOMesmoErro() {
        respostas.put("modelo-principal", erro(400, "INVALID_ARGUMENT"));
        respostas.put("modelo-reserva", comTexto("não devia chegar aqui"));

        assertThatThrownBy(() -> pedir(cliente("modelo-reserva"))).isInstanceOf(IaIndisponivelException.class);
        assertThat(modelosPedidos).containsExactly("modelo-principal");
    }

    @Test
    void osDoisModelosSemCotaDaIndisponivel() {
        respostas.put("modelo-principal", erro(429, "RESOURCE_EXHAUSTED"));
        respostas.put("modelo-reserva", erro(429, "RESOURCE_EXHAUSTED"));

        assertThatThrownBy(() -> pedir(cliente("modelo-reserva"))).isInstanceOf(IaIndisponivelException.class);
        assertThat(modelosPedidos).containsExactly("modelo-principal", "modelo-reserva");
    }

    @Test
    void semReservaConfiguradoTentaSoUmaVez() {
        respostas.put("modelo-principal", erro(503, "UNAVAILABLE"));

        assertThatThrownBy(() -> pedir(cliente(""))).isInstanceOf(IaIndisponivelException.class);
        assertThat(modelosPedidos).containsExactly("modelo-principal");
    }

    @Test
    void quandoDemoraDemaisDesisteSemTentarDeNovo() {
        respostas.put("modelo-principal", new Resposta(200, "{}", 3000));
        respostas.put("modelo-reserva", comTexto("não devia chegar aqui"));

        assertThatThrownBy(() -> pedir(cliente("modelo-reserva"))).isInstanceOf(IaIndisponivelException.class);
        assertThat(modelosPedidos).containsExactly("modelo-principal");
    }

    @Test
    void semChaveNemChamaOGoogle() {
        String endereco = "http://127.0.0.1:" + google.getAddress().getPort();
        ClienteGemini semChave = new ClienteGemini("  ", "modelo-principal", "modelo-reserva", "low", endereco, Duration.ofMillis(800));

        assertThat(semChave.configurado()).isFalse();
        assertThatThrownBy(() -> pedir(semChave)).isInstanceOf(IaIndisponivelException.class);
        assertThat(modelosPedidos).isEmpty();
    }

    @Test
    void leOStatusDoErroDoGoogleSemQuebrarComRespostaEstranha() {
        assertThat(ClienteGemini.statusDoGoogle("{\"error\":{\"status\":\"RESOURCE_EXHAUSTED\"}}")).isEqualTo("RESOURCE_EXHAUSTED");
        assertThat(ClienteGemini.statusDoGoogle("<html>erro</html>")).isEqualTo("sem status");
        assertThat(ClienteGemini.statusDoGoogle("")).isEqualTo("sem status");
    }
}
