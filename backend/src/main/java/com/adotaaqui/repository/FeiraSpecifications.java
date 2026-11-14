package com.adotaaqui.repository;

import com.adotaaqui.dto.FeiraFiltroRequest;
import com.adotaaqui.model.FeiraDeAdocao;
import jakarta.persistence.criteria.Predicate;
import org.springframework.data.jpa.domain.Specification;

import java.time.LocalDate;
import java.util.ArrayList;
import java.util.List;

/** Busca das feiras de adoção: só as que ainda vão acontecer, com o estado e a cidade, se vierem. */
public final class FeiraSpecifications {

    private FeiraSpecifications() {}

    public static Specification<FeiraDeAdocao> proximas(FeiraFiltroRequest filtro, LocalDate hoje) {
        return (root, query, cb) -> {
            List<Predicate> criterios = new ArrayList<>();
            // A feira de hoje continua aparecendo até o fim do dia
            criterios.add(cb.greaterThanOrEqualTo(root.get("data"), hoje));
            if (filtro.getEstado() != null && !filtro.getEstado().isBlank()) {
                criterios.add(cb.equal(root.get("estado"), filtro.getEstado()));
            }
            // Cidade: igual à da vitrine, basta conter o que foi digitado, sem ligar pra maiúscula nem acento
            if (filtro.getCidade() != null && !filtro.getCidade().isBlank()) {
                String cidade = "%" + AnimalSpecifications.semAcento(filtro.getCidade()) + "%";
                criterios.add(cb.like(AnimalSpecifications.semAcento(cb, root.get("cidade")), cidade));
            }
            return cb.and(criterios.toArray(Predicate[]::new));
        };
    }
}
