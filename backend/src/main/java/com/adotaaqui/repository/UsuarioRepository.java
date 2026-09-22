package com.adotaaqui.repository;

import com.adotaaqui.model.Usuario;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.Optional;
import java.util.UUID;

public interface UsuarioRepository extends JpaRepository<Usuario, UUID> {

    Optional<Usuario> findByEmail(String email);

    Optional<Usuario> findByCpf(String cpf);
}
