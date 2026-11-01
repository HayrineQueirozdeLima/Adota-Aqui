package com.adotaaqui.dto;

import java.util.List;

// GET /api/artigos/meus: os artigos da conta logada e se ela pode publicar (é protetor)
public record MeusArtigosResponse(boolean podePublicar, List<ArtigoResumoResponse> artigos) {
}
