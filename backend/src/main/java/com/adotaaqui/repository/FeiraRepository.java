package com.adotaaqui.repository;

import com.adotaaqui.model.FeiraDeAdocao;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.domain.Specification;
import org.springframework.data.jpa.repository.EntityGraph;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.JpaSpecificationExecutor;

import java.util.List;
import java.util.UUID;

public interface FeiraRepository extends JpaRepository<FeiraDeAdocao, UUID>, JpaSpecificationExecutor<FeiraDeAdocao> {

    // A lista mostra o abrigo que organiza: ele vem junto, numa consulta só
    @EntityGraph(attributePaths = {"abrigo"})
    Page<FeiraDeAdocao> findAll(Specification<FeiraDeAdocao> filtro, Pageable pagina);

    // As feiras do abrigo logado, inclusive as que já passaram, da mais nova pra mais antiga
    List<FeiraDeAdocao> findByAbrigoIdOrderByDataDescHoraInicioDesc(UUID abrigoId);
}
