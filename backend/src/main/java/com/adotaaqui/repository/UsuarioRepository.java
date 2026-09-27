package com.adotaaqui.repository;

import com.adotaaqui.model.Usuario;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.Optional;
import java.util.UUID;

// Repository é quem conversa com o banco. O Spring monta o SQL sozinho
// a partir do nome do método: findByCpf vira "procura o usuario com este cpf".
public interface UsuarioRepository extends JpaRepository<Usuario, UUID> {

    // Login do Usuario (RF03)
    Optional<Usuario> findByCpf(String cpf);

    boolean existsByCpf(String cpf);

    // O e-mail precisa ser único no sistema inteiro, entre usuarios E abrigos.
    // No cadastro, confiram nos dois repositories antes de salvar.
    boolean existsByEmail(String email);
}
