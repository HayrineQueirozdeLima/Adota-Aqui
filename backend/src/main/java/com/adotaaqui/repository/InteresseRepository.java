package com.adotaaqui.repository;

import com.adotaaqui.model.Interesse;
import com.adotaaqui.model.enums.StatusInteresse;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.Collection;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

public interface InteresseRepository extends JpaRepository<Interesse, UUID> {

    // Só o id do animal, sem carregar nada: serve pra travar o animal antes de mexer no interesse
    @Query("SELECT i.animal.id FROM Interesse i WHERE i.id = :id")
    Optional<UUID> findAnimalIdById(@Param("id") UUID id);

    // Painel do protetor: todos os interesses nos animais da conta, do mais recente pro mais antigo.
    // Os filtros (animal e status) ficam no service. Aqui não dá pra usar "(:animalId IS NULL OR ...)":
    // no PostgreSQL, um UUID nulo chega sem tipo e a consulta quebra com
    // "could not determine data type of parameter". O H2 dos testes aceita, por isso o erro só apareceria no Render
    @Query("""
            SELECT i FROM Interesse i
            JOIN i.animal a
            LEFT JOIN a.usuario u
            LEFT JOIN a.abrigo ab
            WHERE (:abrigo = true AND ab.id = :contaId)
               OR (:abrigo = false AND u.id = :contaId)
            ORDER BY i.dataHora DESC, i.id DESC
            """)
    List<Interesse> findRecebidos(@Param("contaId") UUID contaId, @Param("abrigo") boolean abrigo);

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
