package com.adotaaqui.repository;

import com.adotaaqui.model.Abrigo;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

public interface AbrigoRepository extends JpaRepository<Abrigo, UUID> {

    // Login do Abrigo (RF03)
    Optional<Abrigo> findByCnpj(String cnpj);

    boolean existsByCnpj(String cnpj);

    // Mesma regra do UsuarioRepository: e-mail único entre usuarios E abrigos
    boolean existsByEmail(String email);

    // Quantos abrigos cada estado tem, pelo endereço do abrigo, pro observatório
    @Query("""
            SELECT new com.adotaaqui.repository.ContagemPorEstado(ab.endereco.estado, COUNT(ab))
            FROM Abrigo ab
            WHERE ab.endereco.estado IS NOT NULL
            GROUP BY ab.endereco.estado
            """)
    List<ContagemPorEstado> contarPorEstado();

    // A limpeza das fotos (LimpezaDeFotos) não apaga do bucket uma foto que ainda é de perfil
    boolean existsByFotoUrl(String fotoUrl);
}
