package com.adotaaqui.service;

import jakarta.annotation.PreDestroy;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.boot.autoconfigure.condition.ConditionalOnProperty;
import org.springframework.stereotype.Component;
import software.amazon.awssdk.core.checksums.RequestChecksumCalculation;
import software.amazon.awssdk.core.checksums.ResponseChecksumValidation;
import software.amazon.awssdk.core.sync.RequestBody;
import software.amazon.awssdk.regions.Region;
import software.amazon.awssdk.services.s3.S3Client;
import software.amazon.awssdk.services.s3.S3ClientBuilder;
import software.amazon.awssdk.services.s3.model.PutObjectRequest;

import java.net.URI;

// Guarda as fotos no Amazon S3 (RF16). Liga com FOTOS_ARMAZENAMENTO=s3 no Render.
// As credenciais NÃO passam por aqui: o SDK lê sozinho AWS_ACCESS_KEY_ID e AWS_SECRET_ACCESS_KEY do ambiente.
@Component
@ConditionalOnProperty(name = "app.fotos.armazenamento", havingValue = "s3")
public class ArmazenamentoS3 implements ArmazenamentoFotos {

    private final S3Client s3;
    private final String bucket;

    public ArmazenamentoS3(@Value("${app.fotos.s3.bucket}") String bucket,
                           @Value("${app.fotos.s3.regiao}") String regiao,
                           @Value("${app.fotos.s3.endpoint:}") String endpoint) {
        this.bucket = bucket;
        S3ClientBuilder construtor = S3Client.builder().region(Region.of(regiao));

        // S3_ENDPOINT vazio = Amazon S3. Preenchido = outro serviço compatível com S3,
        // como o Cloudflare R2 (aí a região é "auto"). Esses serviços pedem o endereço
        // no formato servico/bucket e não aceitam as verificações extras que o SDK manda por padrão.
        if (!endpoint.isBlank()) {
            construtor.endpointOverride(URI.create(endpoint))
                    .forcePathStyle(true)
                    .requestChecksumCalculation(RequestChecksumCalculation.WHEN_REQUIRED)
                    .responseChecksumValidation(ResponseChecksumValidation.WHEN_REQUIRED);
        }
        this.s3 = construtor.build();
    }

    @Override
    public void salvar(String chave, byte[] conteudo, String tipo) {
        PutObjectRequest pedido = PutObjectRequest.builder()
                .bucket(bucket)
                .key(chave)
                .contentType(tipo)
                .build();
        s3.putObject(pedido, RequestBody.fromBytes(conteudo));
    }

    @PreDestroy
    void fechar() {
        s3.close();
    }
}