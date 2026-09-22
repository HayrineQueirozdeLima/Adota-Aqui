package com.adotaaqui.repository;

import com.adotaaqui.model.Ong;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.Optional;
import java.util.UUID;

public interface OngRepository extends JpaRepository<Ong, UUID> {

    Optional<Ong> findByEmail(String email);

    Optional<Ong> findByCnpj(String cnpj);
}
