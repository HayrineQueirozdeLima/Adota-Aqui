package com.adotaaqui.config;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Component;

import java.util.ArrayList;
import java.util.List;

// Confere, quando o back sobe, se o deploy não ficou com algum valor de desenvolvimento do application.properties.
// Só confere com o banco de produção (um PostgreSQL fora da máquina). Com o banco local ou o H2 dos testes, não faz nada.
// Se faltar alguma variável, o back nem sobe: no Render, o deploy falha e a versão anterior continua no ar
@Component
public class ConferenciaDoDeploy {

    // Os mesmos valores padrão do application.properties
    static final String CHAVE_DE_DESENVOLVIMENTO = "troque-este-valor-antes-de-ir-para-producao";
    static final String ORIGEM_DE_DESENVOLVIMENTO = "http://localhost:5173";

    public ConferenciaDoDeploy(@Value("${spring.datasource.url:}") String urlDoBanco,
                               @Value("${jwt.secret:}") String chaveDoToken,
                               @Value("${app.fotos.armazenamento:memoria}") String armazenamentoDasFotos,
                               @Value("${app.cors.origens:" + ORIGEM_DE_DESENVOLVIMENTO + "}") String origens) {
        if (!bancoDeProducao(urlDoBanco)) return;

        List<String> faltando = new ArrayList<>();
        // Com a chave padrão, qualquer pessoa que leu o repositório consegue criar um token válido
        if (CHAVE_DE_DESENVOLVIMENTO.equals(chaveDoToken)) faltando.add("JWT_SECRET");
        // Com as fotos na memória, a URL salva no animal não abre e a foto some quando o back reinicia
        if (!"s3".equals(armazenamentoDasFotos)) faltando.add("FOTOS_ARMAZENAMENTO=s3");
        // Sem as origens do Netlify, o navegador bloqueia todas as chamadas do site
        if (ORIGEM_DE_DESENVOLVIMENTO.equals(origens)) faltando.add("CORS_ORIGENS");

        if (!faltando.isEmpty()) {
            throw new IllegalStateException("O back está ligado no banco de produção, mas faltam variáveis de ambiente: "
                    + String.join(", ", faltando) + ". Ver docs/deploy.md");
        }
    }

    static boolean bancoDeProducao(String urlDoBanco) {
        return urlDoBanco.startsWith("jdbc:postgresql:")
                && !urlDoBanco.contains("localhost")
                && !urlDoBanco.contains("127.0.0.1");
    }
}