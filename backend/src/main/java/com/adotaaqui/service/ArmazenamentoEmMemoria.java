package com.adotaaqui.service;

import org.springframework.boot.autoconfigure.condition.ConditionalOnProperty;
import org.springframework.stereotype.Component;

import java.util.Map;
import java.util.concurrent.ConcurrentHashMap;

// Usado nos testes e na máquina de vocês, sem precisar de conta na AWS.
// As fotos somem quando o back reinicia, e a URL devolvida não abre a imagem: é só pra desenvolver.
@Component
@ConditionalOnProperty(name = "app.fotos.armazenamento", havingValue = "memoria", matchIfMissing = true)
public class ArmazenamentoEmMemoria implements ArmazenamentoFotos {

    private final Map<String, byte[]> arquivos = new ConcurrentHashMap<>();

    @Override
    public void salvar(String chave, byte[] conteudo, String tipo) {
        arquivos.put(chave, conteudo);
    }

    // Pros testes conferirem que o arquivo foi guardado
    public boolean contem(String chave) {
        return arquivos.containsKey(chave);
    }
}