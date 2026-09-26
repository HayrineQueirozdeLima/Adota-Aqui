package com.adotaaqui.repository;

import com.adotaaqui.model.Animal;
import com.adotaaqui.model.enums.StatusAdocao;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;
import java.util.UUID;

public interface AnimalRepository extends JpaRepository<Animal, UUID> {

    // "Meus animais" (UC05): o protetor pode ser um Usuario ou um Abrigo
    List<Animal> findByUsuarioId(UUID usuarioId);

    List<Animal> findByAbrigoId(UUID abrigoId);

    // Listagem pra Visitante e Abrigo: animais de todos os estados (RF07)
    List<Animal> findByStatusAdocao(StatusAdocao status);

    // Listagem pra Usuario logado: só animais do mesmo estado dele (RF14).
    // Como o animal não tem estado próprio, a consulta olha o estado de quem cadastrou.
    //
    // Os outros filtros da vitrine (espécie, raça, porte, sexo, convivência, cidade)
    // ainda não estão aqui. Fica pra issue da listagem.
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
