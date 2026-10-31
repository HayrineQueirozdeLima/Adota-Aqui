package com.adotaaqui.dto;

import java.util.List;

// GET /api/dicas/minhas: as dicas da conta logada e se ela pode publicar (é protetor)
public record MinhasDicasResponse(boolean podePublicar, List<DicaResumoResponse> dicas) {
}
