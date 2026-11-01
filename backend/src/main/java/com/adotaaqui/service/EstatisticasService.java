package com.adotaaqui.service;

import com.adotaaqui.dto.EstatisticasResponse;
import com.adotaaqui.model.enums.StatusAdocao;
import com.adotaaqui.model.enums.StatusInteresse;
import com.adotaaqui.repository.AbrigoRepository;
import com.adotaaqui.repository.AnimalRepository;
import com.adotaaqui.repository.InteresseRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

// Números públicos da plataforma (ERS, escopo futuro 6.7): contam o site todo, sem filtro de estado
@Service
@Transactional(readOnly = true)
public class EstatisticasService {
    private final InteresseRepository interesses;
    private final AnimalRepository animais;
    private final AbrigoRepository abrigos;

    public EstatisticasService(InteresseRepository interesses, AnimalRepository animais, AbrigoRepository abrigos) {
        this.interesses = interesses;
        this.animais = animais;
        this.abrigos = abrigos;
    }

    // Adoção é interesse aprovado: uma devolução não apaga a adoção que aconteceu (RF06).
    // Animal removido leva os interesses junto (cascata), então a adoção dele sai da conta
    public EstatisticasResponse buscar() {
        return new EstatisticasResponse(
                interesses.countByStatusAndamento(StatusInteresse.APROVADO),
                animais.countByStatusAdocao(StatusAdocao.DISPONIVEL),
                abrigos.count());
    }
}
