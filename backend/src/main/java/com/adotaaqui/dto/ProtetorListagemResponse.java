package com.adotaaqui.dto;

import com.adotaaqui.model.enums.TipoConta;

import java.util.UUID;

// Um item da página de abrigos e protetores (GET /api/protetores).
// Nome, cidade e estado já aparecem no card de cada animal. Contato e documento ficam de fora:
// o contato só aparece depois que alguém demonstra interesse (RF09)
public record ProtetorListagemResponse(
        UUID id,
        TipoConta tipo,
        String nome,
        String cidade,
        String estado,
        long animaisDisponiveis,
        // Interesses aprovados nos animais desse protetor, como nos números da Home
        long adocoes) {
}
