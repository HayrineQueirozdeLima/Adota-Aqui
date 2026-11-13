package com.adotaaqui.service;

import com.adotaaqui.dto.EstatisticasResponse;
import com.adotaaqui.model.enums.StatusAdocao;
import com.adotaaqui.model.enums.StatusInteresse;
import com.adotaaqui.repository.AbrigoRepository;
import com.adotaaqui.repository.AnimalRepository;
import com.adotaaqui.repository.ContagemPorEstado;
import com.adotaaqui.repository.InteresseRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

// Números públicos da plataforma (ERS, escopo futuro 6.7): contam o site todo, sem filtro de estado
@Service
@Transactional(readOnly = true)
public class EstatisticasService {
    private static final List<String> ESTADOS = List.of("AC", "AL", "AM", "AP", "BA", "CE", "DF", "ES", "GO", "MA",
            "MG", "MS", "MT", "PA", "PB", "PE", "PI", "PR", "RJ", "RN", "RO", "RR", "RS", "SC", "SE", "SP", "TO");

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

    // Os 27 estados, sempre, na ordem das siglas. Estado sem nada vem com zero, pro mapa ter todos.
    // Animais e adoções contam onde o animal está; abrigos, o endereço do abrigo
    public List<EstatisticasResponse.PorEstado> porEstado() {
        Map<String, Long> adocoes = porSigla(interesses.contarPorEstado(StatusInteresse.APROVADO));
        Map<String, Long> disponiveis = porSigla(animais.contarPorEstado(StatusAdocao.DISPONIVEL));
        Map<String, Long> abrigosPorEstado = porSigla(abrigos.contarPorEstado());
        return ESTADOS.stream()
                .map(estado -> new EstatisticasResponse.PorEstado(estado, adocoes.getOrDefault(estado, 0L),
                        disponiveis.getOrDefault(estado, 0L), abrigosPorEstado.getOrDefault(estado, 0L)))
                .toList();
    }

    private static Map<String, Long> porSigla(List<ContagemPorEstado> contagens) {
        return contagens.stream().collect(Collectors.toMap(ContagemPorEstado::estado, ContagemPorEstado::total));
    }
}
