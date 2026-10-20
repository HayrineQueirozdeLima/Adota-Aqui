package com.adotaaqui.service;

// Onde as fotos ficam guardadas. Quem usa não sabe se é S3, Cloudflare R2 ou memória:
// trocar de serviço é trocar a implementação (escolhida pela variável FOTOS_ARMAZENAMENTO).
public interface ArmazenamentoFotos {

    // chave = caminho do arquivo dentro do bucket (ex.: "animais/3f6c...jpg")
    void salvar(String chave, byte[] conteudo, String tipo);
}