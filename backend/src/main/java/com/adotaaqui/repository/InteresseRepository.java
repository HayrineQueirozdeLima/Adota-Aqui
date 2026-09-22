package com.adotaaqui.repository;

import com.adotaaqui.model.Interesse;
import com.adotaaqui.model.enums.StatusInteresse;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.Collection;
import java.util.List;
import java.util.UUID;

public interface InteresseRepository extends JpaRepository<Interesse, UUID> {

    List<Interesse> findByAnimalId(UUID animalId);

    List<Interesse> findByUsuarioId(UUID usuarioId);

    // RF10: ao aprovar um interesse, os demais pendentes/em contato do mesmo animal são descontinuados
    List<Interesse> findByAnimalIdAndStatusAndamentoIn(UUID animalId, Collection<StatusInteresse> status);

    boolean existsByUsuarioIdAndAnimalIdAndStatusAndamentoIn(UUID usuarioId, UUID animalId,
                                                             Collection<StatusInteresse> status);
}
