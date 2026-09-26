package com.adotaaqui.repository;

import com.adotaaqui.model.Interesse;
import com.adotaaqui.model.enums.StatusInteresse;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.Collection;
import java.util.List;
import java.util.UUID;

public interface InteresseRepository extends JpaRepository<Interesse, UUID> {

    List<Interesse> findByAnimalId(UUID animalId);

    // "Meus interesses" do candidato
    List<Interesse> findByUsuarioId(UUID usuarioId);

    // Quando o protetor aprova um interesse, os outros PENDENTE e EM_CONTATO
    // do mesmo animal são descontinuados (RF10). É esse método que acha eles.
    List<Interesse> findByAnimalIdAndStatusAndamentoIn(UUID animalId, Collection<StatusInteresse> status);

    // Evita interesse duplicado: a pessoa não pode ter dois interesses ativos
    // (PENDENTE ou EM_CONTATO) no mesmo animal
    boolean existsByUsuarioIdAndAnimalIdAndStatusAndamentoIn(UUID usuarioId, UUID animalId,
                                                             Collection<StatusInteresse> status);
}
