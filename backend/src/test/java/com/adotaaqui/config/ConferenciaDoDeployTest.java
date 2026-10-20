package com.adotaaqui.config;

import org.junit.jupiter.api.Test;
import org.junit.jupiter.params.ParameterizedTest;
import org.junit.jupiter.params.provider.ValueSource;

import static com.adotaaqui.config.ConferenciaDoDeploy.CHAVE_DE_DESENVOLVIMENTO;
import static com.adotaaqui.config.ConferenciaDoDeploy.ORIGEM_DE_DESENVOLVIMENTO;
import static org.assertj.core.api.Assertions.assertThatCode;
import static org.assertj.core.api.Assertions.assertThatThrownBy;

// Issue #42: o back não sobe em produção com os valores de desenvolvimento
class ConferenciaDoDeployTest {

    private static final String NEON = "jdbc:postgresql://ep-exemplo.us-east-2.aws.neon.tech/adota_aqui?sslmode=require";
    private static final String NETLIFY = "https://adotaaqui.netlify.app,https://deploy-preview-*--adotaaqui.netlify.app";

    @Test
    void deployComTudoConfiguradoSobe() {
        assertThatCode(() -> new ConferenciaDoDeploy(NEON, "uma-chave-de-producao-comprida-e-secreta", "s3", NETLIFY))
                .doesNotThrowAnyException();
    }

    @Test
    void deploySemAsVariaveisNaoSobeEDizQuaisFaltam() {
        assertThatThrownBy(() -> new ConferenciaDoDeploy(NEON, CHAVE_DE_DESENVOLVIMENTO, "memoria", ORIGEM_DE_DESENVOLVIMENTO))
                .isInstanceOf(IllegalStateException.class)
                .hasMessageContaining("JWT_SECRET")
                .hasMessageContaining("FOTOS_ARMAZENAMENTO=s3")
                .hasMessageContaining("CORS_ORIGENS");
    }

    @Test
    void soAChavePadraoJaImpedeODeploy() {
        assertThatThrownBy(() -> new ConferenciaDoDeploy(NEON, CHAVE_DE_DESENVOLVIMENTO, "s3", NETLIFY))
                .isInstanceOf(IllegalStateException.class)
                .hasMessageContaining("JWT_SECRET")
                .hasMessageNotContaining("CORS_ORIGENS");
    }

    // Na máquina de vocês e nos testes, os valores de desenvolvimento continuam valendo
    @ParameterizedTest
    @ValueSource(strings = {
            "jdbc:postgresql://localhost:5432/adota_aqui",
            "jdbc:postgresql://127.0.0.1:5432/adota_aqui",
            "jdbc:h2:mem:adota_aqui_test;DB_CLOSE_DELAY=-1",
            ""})
    void foraDaProducaoNaoConfereNada(String banco) {
        assertThatCode(() -> new ConferenciaDoDeploy(banco, CHAVE_DE_DESENVOLVIMENTO, "memoria", ORIGEM_DE_DESENVOLVIMENTO))
                .doesNotThrowAnyException();
    }
}