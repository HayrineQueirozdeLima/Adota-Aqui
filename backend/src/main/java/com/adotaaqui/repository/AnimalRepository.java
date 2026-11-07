package com.adotaaqui.repository;

import com.adotaaqui.model.Animal;
import com.adotaaqui.model.enums.StatusAdocao;
import jakarta.persistence.LockModeType;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.JpaSpecificationExecutor;
import org.springframework.data.jpa.repository.Lock;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

public interface AnimalRepository extends JpaRepository<Animal, UUID>, JpaSpecificationExecutor<Animal> {

    @Lock(LockModeType.PESSIMISTIC_WRITE)
    @Query("SELECT a FROM Animal a WHERE a.id = :id")
    Optional<Animal> findByIdParaAtualizacao(@Param("id") UUID id);

    // "Meus animais" (UC05): o protetor pode ser um Usuario ou um Abrigo
    List<Animal> findByUsuarioId(UUID usuarioId);

    List<Animal> findByAbrigoId(UUID abrigoId);

    // Quem já cadastrou animal é protetor e pode publicar artigos
    boolean existsByUsuarioId(UUID usuarioId);

    // Algum animal ainda usa essa foto? Antes de apagar o arquivo do armazenamento
    @Query("SELECT CASE WHEN COUNT(a) > 0 THEN true ELSE false END FROM Animal a JOIN a.fotos f WHERE f = :url")
    boolean algumAnimalUsaFoto(@Param("url") String url);

    // Listagem pra Visitante e Abrigo: animais de todos os estados (RF07)
    List<Animal> findByStatusAdocao(StatusAdocao status);

    // Números da Home (GET /api/estatisticas)
    long countByStatusAdocao(StatusAdocao status);

    // Quantos animais com esse status cada protetor tem, pra página de abrigos e protetores.
    // LEFT JOIN nos dois porque cada animal tem só um protetor: ou a pessoa, ou o abrigo
    @Query("""
            SELECT new com.adotaaqui.repository.ContagemPorProtetor(u.id, ab.id, COUNT(a))
            FROM Animal a
            LEFT JOIN a.usuario u
            LEFT JOIN a.abrigo ab
            WHERE a.statusAdocao = :status
            GROUP BY u.id, ab.id
            """)
    List<ContagemPorProtetor> contarPorProtetor(@Param("status") StatusAdocao status);

    // Animais sem local: os que já existiam antes das colunas cidade e estado (ver LocalDosAnimaisAntigos)
    List<Animal> findByCidadeIsNullOrEstadoIsNull();
}
