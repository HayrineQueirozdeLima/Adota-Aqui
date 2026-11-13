package com.adotaaqui.service;

import java.util.Map;

/**
 * Quem escreve os textos da IA. Em produção é o ClienteGemini; nos testes, uma versão de mentira,
 * pra não depender da internet nem gastar a cota.
 */
public interface GeradorDeTexto {

    // Se a chave da IA está configurada no servidor. Sem chave, a IA fica desligada e o site segue igual
    boolean configurado();

    /**
     * Manda as regras (instrucao) e o pedido pra IA e devolve o texto da resposta.
     * Com esquema, a resposta vem em JSON nesse formato; sem esquema, vem texto livre.
     * Se a IA estiver desligada ou não responder, lança IaIndisponivelException.
     */
    String gerar(String instrucao, String pedido, Map<String, Object> esquema);
}
