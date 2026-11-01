package com.adotaaqui.service;

import com.adotaaqui.dto.ArtigoFiltroRequest;
import com.adotaaqui.dto.ArtigoRequest;
import com.adotaaqui.dto.ArtigoResponse;
import com.adotaaqui.dto.ArtigoResumoResponse;
import com.adotaaqui.dto.MeusArtigosResponse;
import com.adotaaqui.dto.PaginaResponse;
import com.adotaaqui.exception.AcessoNegadoException;
import com.adotaaqui.exception.DadosInvalidosException;
import com.adotaaqui.exception.RecursoNaoEncontradoException;
import com.adotaaqui.model.Abrigo;
import com.adotaaqui.model.Artigo;
import com.adotaaqui.model.Endereco;
import com.adotaaqui.model.Usuario;
import com.adotaaqui.model.enums.TipoConta;
import com.adotaaqui.repository.AbrigoRepository;
import com.adotaaqui.repository.AnimalRepository;
import com.adotaaqui.repository.ArtigoRepository;
import com.adotaaqui.repository.UsuarioRepository;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Sort;
import org.springframework.security.authentication.AnonymousAuthenticationToken;
import org.springframework.security.authentication.AuthenticationCredentialsNotFoundException;
import org.springframework.security.core.Authentication;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.List;
import java.util.UUID;

// Blog para tutores: artigos pra quem vai adotar ou já adotou, escritos pelos protetores
@Service
@Transactional(readOnly = true)
public class ArtigoService {
    private static final int TAMANHO_DO_RESUMO = 180;
    private static final Sort MAIS_NOVOS_PRIMEIRO = Sort.by(Sort.Order.desc("publicadoEm"), Sort.Order.asc("id"));

    private final ArtigoRepository artigos;
    private final AnimalRepository animais;
    private final UsuarioRepository usuarios;
    private final AbrigoRepository abrigos;
    private final FotoService fotos;
    private final LimpezaDeFotos limpezaDeFotos;

    public ArtigoService(ArtigoRepository artigos, AnimalRepository animais, UsuarioRepository usuarios,
                       AbrigoRepository abrigos, FotoService fotos, LimpezaDeFotos limpezaDeFotos) {
        this.artigos = artigos;
        this.animais = animais;
        this.usuarios = usuarios;
        this.abrigos = abrigos;
        this.fotos = fotos;
        this.limpezaDeFotos = limpezaDeFotos;
    }

    // GET /api/artigos: todos ou de um assunto, dos mais novos pros mais antigos
    public PaginaResponse<ArtigoResumoResponse> listar(ArtigoFiltroRequest filtro) {
        PageRequest pagina = PageRequest.of(filtro.paginaPedida(), filtro.tamanhoPedido(), MAIS_NOVOS_PRIMEIRO);
        Page<Artigo> resultado = filtro.getCategoria() == null
                ? artigos.findAll(pagina)
                : artigos.findByCategoria(filtro.getCategoria(), pagina);
        return PaginaResponse.de(resultado, ArtigoService::resumo);
    }

    // GET /api/artigos/{id}
    public ArtigoResponse buscar(UUID id, Authentication autenticacao) {
        Conta conta = conta(autenticacao, false);
        return resposta(encontrar(id), conta);
    }

    // GET /api/artigos/meus
    public MeusArtigosResponse meus(Authentication autenticacao) {
        Conta conta = conta(autenticacao, true);
        List<Artigo> lista = conta.usuario() != null
                ? artigos.findByUsuarioIdOrderByPublicadoEmDesc(conta.usuario().getId())
                : artigos.findByAbrigoIdOrderByPublicadoEmDesc(conta.abrigo().getId());
        return new MeusArtigosResponse(podePublicar(conta), lista.stream().map(ArtigoService::resumo).toList());
    }

    // POST /api/artigos: só protetor publica (abrigo, ou pessoa que já cadastrou animal)
    @Transactional
    public ArtigoResponse publicar(ArtigoRequest request, Authentication autenticacao) {
        Conta conta = conta(autenticacao, true);
        if (!podePublicar(conta)) {
            throw new AcessoNegadoException("Só protetores publicam artigos. Cadastre um animal antes de escrever o seu");
        }
        Artigo artigo = new Artigo();
        artigo.setUsuario(conta.usuario());
        artigo.setAbrigo(conta.abrigo());
        preencher(artigo, request);
        artigos.saveAndFlush(artigo);
        return resposta(artigo, conta);
    }

    // PUT /api/artigos/{id}: só quem escreveu
    @Transactional
    public ArtigoResponse editar(UUID id, ArtigoRequest request, Authentication autenticacao) {
        Conta conta = conta(autenticacao, true);
        Artigo artigo = encontrar(id);
        exigirAutor(artigo, conta);
        String capaAntes = artigo.getFotoCapa();
        preencher(artigo, request);
        artigo.setAtualizadoEm(LocalDateTime.now());
        artigos.flush();
        // A capa trocada ou tirada sai também do S3
        if (capaAntes != null && !capaAntes.equals(artigo.getFotoCapa())) {
            limpezaDeFotos.apagarDepoisDeSalvar(List.of(capaAntes));
        }
        return resposta(artigo, conta);
    }

    // DELETE /api/artigos/{id}: só quem escreveu
    @Transactional
    public void apagar(UUID id, Authentication autenticacao) {
        Conta conta = conta(autenticacao, true);
        Artigo artigo = encontrar(id);
        exigirAutor(artigo, conta);
        String capa = artigo.getFotoCapa();
        artigos.delete(artigo);
        artigos.flush();
        if (capa != null) limpezaDeFotos.apagarDepoisDeSalvar(List.of(capa));
    }

    private void preencher(Artigo artigo, ArtigoRequest request) {
        String capa = request.getFotoCapa() == null || request.getFotoCapa().isBlank()
                ? null : request.getFotoCapa().strip();
        // O artigo é público: só entra foto que passou pela conferência do POST /api/fotos
        if (capa != null && fotos.chaveDe(capa).isEmpty()) {
            throw new DadosInvalidosException("Envie a foto pelo próprio site");
        }
        artigo.setTitulo(request.getTitulo().strip());
        artigo.setConteudo(request.getConteudo().strip());
        artigo.setCategoria(request.getCategoria());
        artigo.setFotoCapa(capa);
    }

    private boolean podePublicar(Conta conta) {
        return conta.abrigo() != null || animais.existsByUsuarioId(conta.usuario().getId());
    }

    private Artigo encontrar(UUID id) {
        return artigos.findById(id).orElseThrow(() -> new RecursoNaoEncontradoException("Artigo não encontrado"));
    }

    private static boolean ehAutor(Artigo artigo, Conta conta) {
        if (conta == null) return false;
        return conta.usuario() != null && artigo.getUsuario() != null
                    && artigo.getUsuario().getId().equals(conta.usuario().getId())
                || conta.abrigo() != null && artigo.getAbrigo() != null
                    && artigo.getAbrigo().getId().equals(conta.abrigo().getId());
    }

    private static void exigirAutor(Artigo artigo, Conta conta) {
        if (!ehAutor(artigo, conta)) throw new AcessoNegadoException("Somente quem escreveu pode alterar ou apagar o artigo");
    }

    private static ArtigoResponse resposta(Artigo artigo, Conta conta) {
        return new ArtigoResponse(artigo.getId(), artigo.getTitulo(), artigo.getCategoria(), artigo.getCategoria().getNome(),
                artigo.getConteudo(), artigo.getFotoCapa(), autor(artigo), artigo.getPublicadoEm(), artigo.getAtualizadoEm(),
                ehAutor(artigo, conta));
    }

    private static ArtigoResumoResponse resumo(Artigo artigo) {
        return new ArtigoResumoResponse(artigo.getId(), artigo.getTitulo(), artigo.getCategoria(),
                artigo.getCategoria().getNome(), resumoDoTexto(artigo.getConteudo()), artigo.getFotoCapa(), autor(artigo),
                artigo.getPublicadoEm());
    }

    private static ArtigoResponse.Autor autor(Artigo artigo) {
        Usuario usuario = artigo.getUsuario();
        Abrigo abrigo = artigo.getAbrigo();
        Endereco endereco = usuario != null ? usuario.getEndereco() : abrigo.getEndereco();
        return new ArtigoResponse.Autor(usuario != null ? usuario.getNome() : abrigo.getNome(),
                usuario != null ? TipoConta.USUARIO : TipoConta.ABRIGO, endereco.getCidade(), endereco.getEstado());
    }

    // O começo do artigo, até uns 180 caracteres, sem cortar palavra no meio
    static String resumoDoTexto(String conteudo) {
        String corrido = conteudo.strip().replaceAll("\\s+", " ");
        if (corrido.length() <= TAMANHO_DO_RESUMO) return corrido;
        int corte = corrido.lastIndexOf(' ', TAMANHO_DO_RESUMO);
        return corrido.substring(0, corte > 0 ? corte : TAMANHO_DO_RESUMO) + "...";
    }

    private record Conta(Usuario usuario, Abrigo abrigo) {}

    private Conta conta(Authentication autenticacao, boolean obrigatoria) {
        if (autenticacao == null || !autenticacao.isAuthenticated()
                || autenticacao instanceof AnonymousAuthenticationToken) {
            if (obrigatoria) throw sessaoInvalida();
            return null;
        }
        UUID id;
        try {
            id = UUID.fromString(autenticacao.getName());
        } catch (IllegalArgumentException ex) {
            throw sessaoInvalida();
        }
        boolean usuario = autenticacao.getAuthorities().stream().anyMatch(a -> a.getAuthority().equals("ROLE_USUARIO"));
        boolean abrigo = autenticacao.getAuthorities().stream().anyMatch(a -> a.getAuthority().equals("ROLE_ABRIGO"));
        if (usuario == abrigo) throw sessaoInvalida();
        return usuario ? new Conta(usuarios.findById(id).orElseThrow(ArtigoService::sessaoInvalida), null)
                : new Conta(null, abrigos.findById(id).orElseThrow(ArtigoService::sessaoInvalida));
    }

    private static AuthenticationCredentialsNotFoundException sessaoInvalida() {
        return new AuthenticationCredentialsNotFoundException("Conta autenticada não encontrada ou inválida");
    }
}
