package com.adotaaqui.repository;

import com.adotaaqui.model.Depoimento;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.EntityGraph;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.Collection;
import java.util.List;
import java.util.UUID;

public interface DepoimentoRepository extends JpaRepository<Depoimento, UUID> {

    // Mural: já traz o interesse, o adotante e o animal na mesma consulta
    @Override
    @EntityGraph(attributePaths = {"interesse", "interesse.usuario", "interesse.animal"})
    Page<Depoimento> findAll(Pageable pagina);

    boolean existsByInteresseId(UUID interesseId);

    // Minhas candidaturas: quais adoções da pessoa já têm depoimento
    List<Depoimento> findByInteresseIdIn(Collection<UUID> interesses);

    // Antes de apagar uma foto do S3: algum depoimento ainda usa?
    boolean existsByFotoUrl(String fotoUrl);

    // As fotos dos depoimentos de um animal, pra apagar do S3 quando o animal é removido
    @Query("SELECT d.fotoUrl FROM Depoimento d WHERE d.interesse.animal.id = :animalId AND d.fotoUrl IS NOT NULL")
    List<String> fotosDoAnimal(@Param("animalId") UUID animalId);
}
