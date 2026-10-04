package com.adotaaqui.service;

import com.adotaaqui.dto.FotoResponse;
import com.adotaaqui.exception.DadosInvalidosException;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.io.UncheckedIOException;
import java.nio.charset.StandardCharsets;
import java.util.Arrays;
import java.util.UUID;

// Upload das fotos dos animais (POST /api/fotos, RF16)
@Service
public class FotoService {

    static final long LIMITE_EM_BYTES = 5L * 1024 * 1024;

    private final ArmazenamentoFotos armazenamento;
    private final String urlBase;

    // FOTOS_URL_BASE é o endereço público do bucket. Fica numa variável, e não escrito no código,
    // pra trocar de serviço (ex.: Cloudflare R2) sem mexer aqui
    public FotoService(ArmazenamentoFotos armazenamento,
                       @Value("${app.fotos.url-base:http://localhost:8080/fotos}") String urlBase) {
        this.armazenamento = armazenamento;
        this.urlBase = urlBase.replaceAll("/+$", "");
    }

    public FotoResponse enviar(MultipartFile arquivo) {
        if (arquivo == null || arquivo.isEmpty()) {
            throw new DadosInvalidosException("Envie uma imagem no campo arquivo");
        }
        if (arquivo.getSize() > LIMITE_EM_BYTES) {
            throw new DadosInvalidosException("A imagem pode ter no máximo 5 MB");
        }

        byte[] conteudo = ler(arquivo);
        TipoImagem tipo = TipoImagem.detectar(conteudo);

        // Nome novo e aleatório: o nome original do arquivo nunca vai pro bucket
        String chave = "animais/" + UUID.randomUUID() + "." + tipo.extensao;
        armazenamento.salvar(chave, conteudo, tipo.mime);
        return new FotoResponse(urlBase + "/" + chave);
    }

    private static byte[] ler(MultipartFile arquivo) {
        try {
            return arquivo.getBytes();
        } catch (IOException e) {
            throw new UncheckedIOException("Não foi possível ler a imagem enviada", e);
        }
    }

    // O tipo vem dos primeiros bytes do arquivo, não do nome nem do que o navegador diz:
    // renomear um .exe pra .jpg não engana essa conferência
    private enum TipoImagem {
        JPEG("jpg", "image/jpeg"),
        PNG("png", "image/png"),
        WEBP("webp", "image/webp");

        private final String extensao;
        private final String mime;

        TipoImagem(String extensao, String mime) {
            this.extensao = extensao;
            this.mime = mime;
        }

        static TipoImagem detectar(byte[] b) {
            if (comeca(b, 0, (byte) 0xFF, (byte) 0xD8, (byte) 0xFF)) return JPEG;
            if (comeca(b, 0, (byte) 0x89, (byte) 'P', (byte) 'N', (byte) 'G', (byte) 0x0D, (byte) 0x0A, (byte) 0x1A, (byte) 0x0A)) return PNG;
            if (comeca(b, 0, ascii("RIFF")) && comeca(b, 8, ascii("WEBP"))) return WEBP;
            throw new DadosInvalidosException("Envie uma imagem JPG, PNG ou WEBP");
        }

        private static boolean comeca(byte[] conteudo, int posicao, byte... esperado) {
            return conteudo.length >= posicao + esperado.length
                    && Arrays.equals(conteudo, posicao, posicao + esperado.length, esperado, 0, esperado.length);
        }

        private static byte[] ascii(String texto) {
            return texto.getBytes(StandardCharsets.US_ASCII);
        }
    }
}