package com.adotaaqui.service;

import com.adotaaqui.dto.LoginRequest;
import com.adotaaqui.dto.LoginResponse;
import com.adotaaqui.exception.CredenciaisInvalidasException;
import com.adotaaqui.exception.DocumentoInvalidoException;
import com.adotaaqui.model.Abrigo;
import com.adotaaqui.model.Usuario;
import com.adotaaqui.model.enums.TipoConta;
import com.adotaaqui.repository.AbrigoRepository;
import com.adotaaqui.repository.UsuarioRepository;
import com.adotaaqui.security.JwtService;
import com.adotaaqui.util.DocumentoUtils;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Instant;
import java.util.UUID;

@Service
public class AutenticacaoService {

    private final UsuarioRepository usuarioRepository;
    private final AbrigoRepository abrigoRepository;
    private final PasswordEncoder passwordEncoder;
    private final JwtService jwtService;

    public AutenticacaoService(UsuarioRepository usuarioRepository, AbrigoRepository abrigoRepository,
                               PasswordEncoder passwordEncoder, JwtService jwtService) {
        this.usuarioRepository = usuarioRepository;
        this.abrigoRepository = abrigoRepository;
        this.passwordEncoder = passwordEncoder;
        this.jwtService = jwtService;
    }

    /**
     * RF03: o tamanho do documento define em qual tabela a conta é procurada.
     * 11 dígitos -> usuario (CPF), 14 dígitos -> abrigo (CNPJ).
     */
    @Transactional(readOnly = true)
    public LoginResponse autenticar(LoginRequest request) {
        String documento = DocumentoUtils.normalizar(request.getDocumento());
        return switch (documento.length()) {
            case DocumentoUtils.TAMANHO_CPF -> autenticarUsuario(documento, request.getSenha());
            case DocumentoUtils.TAMANHO_CNPJ -> autenticarAbrigo(documento, request.getSenha());
            default -> throw new DocumentoInvalidoException(
                    "Documento com formato inválido: informe um CPF (11 dígitos) ou um CNPJ (14 dígitos)");
        };
    }

    private LoginResponse autenticarUsuario(String cpf, String senha) {
        Usuario usuario = usuarioRepository.findByCpf(cpf)
                .orElseThrow(CredenciaisInvalidasException::new);
        conferirSenha(senha, usuario.getSenha());
        return montarResposta(usuario.getId(), TipoConta.USUARIO, usuario.getNome());
    }

    private LoginResponse autenticarAbrigo(String cnpj, String senha) {
        Abrigo abrigo = abrigoRepository.findByCnpj(cnpj)
                .orElseThrow(CredenciaisInvalidasException::new);
        conferirSenha(senha, abrigo.getSenha());
        return montarResposta(abrigo.getId(), TipoConta.ABRIGO, abrigo.getNome());
    }

    private void conferirSenha(String senhaInformada, String hashArmazenado) {
        if (!passwordEncoder.matches(senhaInformada, hashArmazenado)) {
            throw new CredenciaisInvalidasException();
        }
    }

    LoginResponse montarResposta(UUID id, TipoConta tipoConta, String nome) {
        Instant expiraEm = jwtService.calcularExpiracao();
        String token = jwtService.gerarToken(id, tipoConta, expiraEm);
        return new LoginResponse(token, tipoConta, id, nome, expiraEm);
    }
}
