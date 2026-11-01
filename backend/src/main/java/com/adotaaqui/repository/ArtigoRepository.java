package com.adotaaqui.repository;

import com.adotaaqui.model.Artigo;
import com.adotaaqui.model.enums.CategoriaArtigo;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.EntityGraph;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.UUID;

public interface ArtigoRepository extends JpaRepository<Artigo, UUID> {

    // A lista mostra quem escreveu: o autor vem junto, numa consulta só
    @EntityGraph(attributePaths = {"usuario", "abrigo"})
    Page<Artigo> findAll(Pageable pagina);

    @EntityGraph(attributePaths = {"usuario", "abrigo"})
    Page<Artigo> findByCategoria(CategoriaArtigo categoria, Pageable pagina);

    // Os artigos da conta logada, do mais novo pro mais antigo
    List<Artigo> findByUsuarioIdOrderByPublicadoEmDesc(UUID usuarioId);

    List<Artigo> findByAbrigoIdOrderByPublicadoEmDesc(UUID abrigoId);

    // Antes de apagar uma foto do S3: algum artigo ainda usa como capa?
    boolean existsByFotoCapa(String fotoCapa);
}
