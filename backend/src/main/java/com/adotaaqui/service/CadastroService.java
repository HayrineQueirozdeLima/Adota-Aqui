package com.adotaaqui.service;

import com.adotaaqui.dto.CadastroAbrigoRequest;
import com.adotaaqui.dto.CadastroUsuarioRequest;
import com.adotaaqui.dto.LoginResponse;
import com.adotaaqui.model.enums.TipoConta;
import com.adotaaqui.dto.EnderecoDto;
import com.adotaaqui.exception.DocumentoInvalidoException;
import com.adotaaqui.exception.RegraNegocioException;
import com.adotaaqui.model.Abrigo;
import com.adotaaqui.model.Endereco;
import com.adotaaqui.model.Usuario;
import com.adotaaqui.repository.AbrigoRepository;
import com.adotaaqui.repository.UsuarioRepository;
import com.adotaaqui.util.DocumentoUtils;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
public class CadastroService {

    private final UsuarioRepository usuarioRepository;
    private final AbrigoRepository abrigoRepository;
    private final PasswordEncoder passwordEncoder;
    private final AutenticacaoService autenticacaoService;

    public CadastroService(UsuarioRepository usuarioRepository, AbrigoRepository abrigoRepository,
                           PasswordEncoder passwordEncoder, AutenticacaoService autenticacaoService) {
        this.usuarioRepository = usuarioRepository;
        this.abrigoRepository = abrigoRepository;
        this.passwordEncoder = passwordEncoder;
        this.autenticacaoService = autenticacaoService;
    }

    @Transactional
    public LoginResponse cadastrarUsuario(CadastroUsuarioRequest request) {
        String cpf = DocumentoUtils.normalizar(request.getCpf());
        if (!DocumentoUtils.isCpfValido(cpf)) {
            throw new DocumentoInvalidoException("CPF inválido");
        }
        if (usuarioRepository.existsByCpf(cpf)) {
            throw new RegraNegocioException("Já existe uma conta cadastrada com este CPF");
        }
        String email = normalizarEmail(request.getEmail());
        validarEmailDisponivel(email);

        Usuario usuario = new Usuario();
        usuario.setCpf(cpf);
        usuario.setNome(request.getNome().trim());
        usuario.setEmail(email);
        usuario.setTelefone(request.getTelefone().trim());
        usuario.setSenha(passwordEncoder.encode(request.getSenha()));
        usuario.setEndereco(toEndereco(request.getEndereco()));

        usuarioRepository.save(usuario);
        return autenticacaoService.montarResposta(usuario.getId(), TipoConta.USUARIO, usuario.getNome());
    }

    @Transactional
    public LoginResponse cadastrarAbrigo(CadastroAbrigoRequest request) {
        String cnpj = DocumentoUtils.normalizar(request.getCnpj());
        if (!DocumentoUtils.isCnpjValido(cnpj)) {
            throw new DocumentoInvalidoException("CNPJ inválido");
        }
        if (abrigoRepository.existsByCnpj(cnpj)) {
            throw new RegraNegocioException("Já existe uma conta cadastrada com este CNPJ");
        }
        String email = normalizarEmail(request.getEmail());
        validarEmailDisponivel(email);

        Abrigo abrigo = new Abrigo();
        abrigo.setCnpj(cnpj);
        abrigo.setNome(request.getNome().trim());
        abrigo.setRazaoSocial(request.getRazaoSocial().trim());
        abrigo.setEmail(email);
        abrigo.setTelefone(request.getTelefone().trim());
        abrigo.setSenha(passwordEncoder.encode(request.getSenha()));
        abrigo.setEndereco(toEndereco(request.getEndereco()));

        abrigoRepository.save(abrigo);
        return autenticacaoService.montarResposta(abrigo.getId(), TipoConta.ABRIGO, abrigo.getNome());
    }

    // O e-mail precisa ser único entre as duas tabelas: uma mesma caixa de entrada
    // não pode responder por contas diferentes.
    private void validarEmailDisponivel(String email) {
        if (usuarioRepository.existsByEmail(email) || abrigoRepository.existsByEmail(email)) {
            throw new RegraNegocioException("Já existe uma conta cadastrada com este e-mail");
        }
    }

    private String normalizarEmail(String email) {
        return email.trim().toLowerCase();
    }

    private Endereco toEndereco(EnderecoDto dto) {
        Endereco endereco = new Endereco();
        endereco.setCep(DocumentoUtils.normalizar(dto.getCep()));
        endereco.setEstado(dto.getEstado().trim().toUpperCase());
        endereco.setCidade(dto.getCidade().trim());
        endereco.setLogradouro(dto.getLogradouro());
        endereco.setNumero(dto.getNumero().trim());
        endereco.setBairro(dto.getBairro());
        return endereco;
    }
}
