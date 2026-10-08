package com.adotaaqui.repository;

import com.adotaaqui.model.Interesse;
import com.adotaaqui.model.enums.StatusInteresse;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import java.util.Optional;

import java.util.Collection;
import java.util.List;
import java.util.UUID;

public interface InteresseRepository extends JpaRepository<Interesse, UUID> {

    // Primeiro localiza o animal sem carregar entidades antes de adquirir o bloqueio.
    @Query("SELECT i.animal.id FROM Interesse i WHERE i.id = :id")
    Optional<UUID> findAnimalIdById(@Param("id") UUID id);

    @Query("""
            SELECT i FROM Interesse i
            JOIN i.animal a
            LEFT JOIN a.usuario u
            LEFT JOIN a.abrigo ab
            WHERE ((:abrigo = true AND ab.id = :contaId)
                OR (:abrigo = false AND u.id = :contaId))
              AND (:animalId IS NULL OR a.id = :animalId)
              AND (:status IS NULL OR i.statusAndamento = :status)
            ORDER BY i.dataHora DESC, i.id DESC
            """)
    List<Interesse> findRecebidos(@Param("contaId") UUID contaId, @Param("abrigo") boolean abrigo,
                                 @Param("animalId") UUID animalId, @Param("status") StatusInteresse status);

    List<Interesse> findByUsuarioIdAndAnimalIdOrderByDataHoraDesc(UUID usuarioId, UUID animalId);

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
