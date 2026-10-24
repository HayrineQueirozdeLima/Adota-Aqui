package com.adotaaqui.service;

import com.adotaaqui.dto.AbrigoResponse;
import com.adotaaqui.dto.AlterarSenhaRequest;
import com.adotaaqui.dto.AtualizarAbrigoRequest;
import com.adotaaqui.dto.AtualizarUsuarioRequest;
import com.adotaaqui.dto.EnderecoDto;
import com.adotaaqui.dto.UsuarioResponse;
import com.adotaaqui.exception.AcessoNegadoException;
import com.adotaaqui.exception.DadosInvalidosException;
import com.adotaaqui.exception.RegraNegocioException;
import com.adotaaqui.model.Abrigo;
import com.adotaaqui.model.Endereco;
import com.adotaaqui.model.Usuario;
import com.adotaaqui.repository.AbrigoRepository;
import com.adotaaqui.repository.UsuarioRepository;
import org.springframework.security.authentication.AnonymousAuthenticationToken;
import org.springframework.security.authentication.AuthenticationCredentialsNotFoundException;
import org.springframework.security.core.Authentication;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.UUID;

// Perfil da conta logada (docs/api.md, seção 7, RF17, UC10).
// A conta sai do token, nunca de um id na URL: ninguém vê nem edita a conta de outra pessoa.
// CPF e CNPJ não mudam, porque é com eles que a pessoa entra
@Service
@Transactional(readOnly = true)
public class PerfilService {

    private static final String SO_PESSOA = "Este perfil é de conta pessoal (CPF). A conta de abrigo usa /api/abrigos/me";
    private static final String SO_ABRIGO = "Este perfil é de conta de abrigo (CNPJ). A conta pessoal usa /api/usuarios/me";

    private final UsuarioRepository usuarios;
    private final AbrigoRepository abrigos;
    private final PasswordEncoder passwordEncoder;

    public PerfilService(UsuarioRepository usuarios, AbrigoRepository abrigos, PasswordEncoder passwordEncoder) {
        this.usuarios = usuarios;
        this.abrigos = abrigos;
        this.passwordEncoder = passwordEncoder;
    }

    // ----- Usuario (pessoa física) -----

    public UsuarioResponse usuario(Authentication autenticacao) {
        return resposta(usuarioLogado(autenticacao));
    }

    @Transactional
    public UsuarioResponse atualizarUsuario(AtualizarUsuarioRequest request, Authentication autenticacao) {
        Usuario usuario = usuarioLogado(autenticacao);
        usuario.setEmail(emailDisponivel(request.getEmail(), usuario.getEmail()));
        usuario.setNome(request.getNome().trim());
        usuario.setTelefone(request.getTelefone().trim());
        // O animal não guarda estado, usa o de quem cadastrou. Trocar o estado aqui muda a vitrine
        // da pessoa e também o estado dos animais que ela cadastrou (RF14)
        usuario.setEndereco(CadastroService.toEndereco(request.getEndereco()));
        // O flush aqui faz um e-mail repetido que escapou da conferência virar 409, e não 500
        return resposta(usuarios.saveAndFlush(usuario));
    }

    @Transactional
    public void alterarSenhaUsuario(AlterarSenhaRequest request, Authentication autenticacao) {
        Usuario usuario = usuarioLogado(autenticacao);
        usuario.setSenha(novaSenha(request, usuario.getSenha()));
    }

    // ----- Abrigo -----

    public AbrigoResponse abrigo(Authentication autenticacao) {
        return resposta(abrigoLogado(autenticacao));
    }

    @Transactional
    public AbrigoResponse atualizarAbrigo(AtualizarAbrigoRequest request, Authentication autenticacao) {
        Abrigo abrigo = abrigoLogado(autenticacao);
        abrigo.setEmail(emailDisponivel(request.getEmail(), abrigo.getEmail()));
        abrigo.setNome(request.getNome().trim());
        abrigo.setRazaoSocial(request.getRazaoSocial().trim());
        abrigo.setTelefone(request.getTelefone().trim());
        abrigo.setEndereco(CadastroService.toEndereco(request.getEndereco()));
        return resposta(abrigos.saveAndFlush(abrigo));
    }

    @Transactional
    public void alterarSenhaAbrigo(AlterarSenhaRequest request, Authentication autenticacao) {
        Abrigo abrigo = abrigoLogado(autenticacao);
        abrigo.setSenha(novaSenha(request, abrigo.getSenha()));
    }

    // ----- Regras comuns -----

    // O e-mail continua único entre pessoas e abrigos. Manter o próprio e-mail não é conflito
    private String emailDisponivel(String informado, String atual) {
        String email = CadastroService.normalizarEmail(informado);
        if (!email.equalsIgnoreCase(atual) && (usuarios.existsByEmail(email) || abrigos.existsByEmail(email))) {
            throw new RegraNegocioException("Já existe uma conta cadastrada com este e-mail");
        }
        return email;
    }

    // Senha atual errada é 400, e não 401: o token continua valendo, e um 401 faria o front deslogar a pessoa
    private String novaSenha(AlterarSenhaRequest request, String hashAtual) {
        if (!passwordEncoder.matches(request.getSenhaAtual(), hashAtual)) {
            throw new DadosInvalidosException("A senha atual está incorreta", "senhaAtual");
        }
        return passwordEncoder.encode(request.getNovaSenha());
    }

    private Usuario usuarioLogado(Authentication autenticacao) {
        UUID id = contaLogada(autenticacao, "ROLE_USUARIO", SO_PESSOA);
        return usuarios.findById(id).orElseThrow(PerfilService::sessaoInvalida);
    }

    private Abrigo abrigoLogado(Authentication autenticacao) {
        UUID id = contaLogada(autenticacao, "ROLE_ABRIGO", SO_ABRIGO);
        return abrigos.findById(id).orElseThrow(PerfilService::sessaoInvalida);
    }

    // Conta do outro tipo recebe 403 com o motivo. Token sem tipo de conta ou com id estranho é 401
    private static UUID contaLogada(Authentication autenticacao, String papel, String mensagemParaOutroTipo) {
        if (autenticacao == null || !autenticacao.isAuthenticated()
                || autenticacao instanceof AnonymousAuthenticationToken) {
            throw sessaoInvalida();
        }
        if (!temPapel(autenticacao, papel)) {
            if (temPapel(autenticacao, "ROLE_USUARIO") || temPapel(autenticacao, "ROLE_ABRIGO")) {
                throw new AcessoNegadoException(mensagemParaOutroTipo);
            }
            throw sessaoInvalida();
        }
        try {
            return UUID.fromString(autenticacao.getName());
        } catch (IllegalArgumentException ex) {
            throw sessaoInvalida();
        }
    }

    private static boolean temPapel(Authentication autenticacao, String papel) {
        return autenticacao.getAuthorities().stream().anyMatch(a -> a.getAuthority().equals(papel));
    }

    private static AuthenticationCredentialsNotFoundException sessaoInvalida() {
        return new AuthenticationCredentialsNotFoundException("Conta autenticada não encontrada ou inválida");
    }

    private static UsuarioResponse resposta(Usuario usuario) {
        return new UsuarioResponse(usuario.getId(), usuario.getNome(), usuario.getCpf(), usuario.getTelefone(),
                usuario.getEmail(), endereco(usuario.getEndereco()));
    }

    private static AbrigoResponse resposta(Abrigo abrigo) {
        return new AbrigoResponse(abrigo.getId(), abrigo.getNome(), abrigo.getCnpj(), abrigo.getRazaoSocial(),
                abrigo.getTelefone(), abrigo.getEmail(), endereco(abrigo.getEndereco()));
    }

    private static EnderecoDto endereco(Endereco endereco) {
        EnderecoDto dto = new EnderecoDto();
        dto.setCep(endereco.getCep());
        dto.setNumero(endereco.getNumero());
        dto.setLogradouro(endereco.getLogradouro());
        dto.setBairro(endereco.getBairro());
        dto.setCidade(endereco.getCidade());
        dto.setEstado(endereco.getEstado());
        return dto;
    }
}