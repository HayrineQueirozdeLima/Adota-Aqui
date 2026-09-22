package com.adotaaqui.repository;

import com.adotaaqui.model.Animal;
import com.adotaaqui.model.enums.StatusAdocao;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;
import java.util.UUID;

public interface AnimalRepository extends JpaRepository<Animal, UUID> {

    List<Animal> findByUsuarioId(UUID usuarioId);

    List<Animal> findByAbrigoId(UUID abrigoId);

    // RF07: Visitante vê os animais de todos os estados
    List<Animal> findByStatusAdocao(StatusAdocao status);

    // RF07 + RF14: Usuario autenticado vê apenas os animais do seu estado
    @Query("""
            SELECT a FROM Animal a
            LEFT JOIN a.usuario u
            LEFT JOIN a.abrigo ab
            WHERE a.statusAdocao = :status
              AND (u.endereco.estado = :estado OR ab.endereco.estado = :estado)
            """)
    List<Animal> findByStatusAndEstado(@Param("status") StatusAdocao status,
                                       @Param("estado") String estado);
}
