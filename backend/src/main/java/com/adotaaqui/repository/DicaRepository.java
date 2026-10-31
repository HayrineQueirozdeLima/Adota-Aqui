package com.adotaaqui.repository;

import com.adotaaqui.model.Dica;
import com.adotaaqui.model.enums.CategoriaDica;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.EntityGraph;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.UUID;

public interface DicaRepository extends JpaRepository<Dica, UUID> {

    // A lista mostra quem escreveu: o autor vem junto, numa consulta só
    @EntityGraph(attributePaths = {"usuario", "abrigo"})
    Page<Dica> findAll(Pageable pagina);

    @EntityGraph(attributePaths = {"usuario", "abrigo"})
    Page<Dica> findByCategoria(CategoriaDica categoria, Pageable pagina);

    // As dicas da conta logada, da mais nova pra mais antiga
    List<Dica> findByUsuarioIdOrderByPublicadaEmDesc(UUID usuarioId);

    List<Dica> findByAbrigoIdOrderByPublicadaEmDesc(UUID abrigoId);

    // Antes de apagar uma foto do S3: alguma dica ainda usa como capa?
    boolean existsByFotoCapa(String fotoCapa);
}
