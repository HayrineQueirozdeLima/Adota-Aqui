package com.adotaaqui.repository;

import com.adotaaqui.model.Abrigo;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.Optional;
import java.util.UUID;

public interface AbrigoRepository extends JpaRepository<Abrigo, UUID> {

    // Login do Abrigo (RF03)
    Optional<Abrigo> findByCnpj(String cnpj);

    boolean existsByCnpj(String cnpj);

    // Mesma regra do UsuarioRepository: e-mail único entre usuarios E abrigos
    boolean existsByEmail(String email);
}
