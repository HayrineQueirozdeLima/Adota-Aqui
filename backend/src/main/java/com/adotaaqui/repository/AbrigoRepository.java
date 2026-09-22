package com.adotaaqui.repository;

import com.adotaaqui.model.Abrigo;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.Optional;
import java.util.UUID;

public interface AbrigoRepository extends JpaRepository<Abrigo, UUID> {

    // RF03: login do Abrigo pelo CNPJ
    Optional<Abrigo> findByCnpj(String cnpj);

    boolean existsByCnpj(String cnpj);

    boolean existsByEmail(String email);
}
