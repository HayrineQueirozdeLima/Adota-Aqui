package com.adotaaqui.repository;

import com.adotaaqui.model.Usuario;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;

import java.util.List;
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

    // Protetores independentes: as pessoas que já cadastraram pelo menos um animal
    @Query("SELECT u FROM Usuario u WHERE EXISTS (SELECT a FROM Animal a WHERE a.usuario = u)")
    List<Usuario> findProtetores();
}
