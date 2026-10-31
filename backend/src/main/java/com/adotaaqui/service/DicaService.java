package com.adotaaqui.service;

import com.adotaaqui.dto.DicaFiltroRequest;
import com.adotaaqui.dto.DicaRequest;
import com.adotaaqui.dto.DicaResponse;
import com.adotaaqui.dto.DicaResumoResponse;
import com.adotaaqui.dto.MinhasDicasResponse;
import com.adotaaqui.dto.PaginaResponse;
import com.adotaaqui.exception.AcessoNegadoException;
import com.adotaaqui.exception.DadosInvalidosException;
import com.adotaaqui.exception.RecursoNaoEncontradoException;
import com.adotaaqui.model.Abrigo;
import com.adotaaqui.model.Dica;
import com.adotaaqui.model.Endereco;
import com.adotaaqui.model.Usuario;
import com.adotaaqui.model.enums.TipoConta;
import com.adotaaqui.repository.AbrigoRepository;
import com.adotaaqui.repository.AnimalRepository;
import com.adotaaqui.repository.DicaRepository;
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

// Blog de dicas pra quem vai adotar ou já adotou, escritas pelos protetores
@Service
@Transactional(readOnly = true)
public class DicaService {
    private static final int TAMANHO_DO_RESUMO = 180;
    private static final Sort MAIS_NOVAS_PRIMEIRO = Sort.by(Sort.Order.desc("publicadaEm"), Sort.Order.asc("id"));

    private final DicaRepository dicas;
    private final AnimalRepository animais;
    private final UsuarioRepository usuarios;
    private final AbrigoRepository abrigos;
    private final FotoService fotos;
    private final LimpezaDeFotos limpezaDeFotos;

    public DicaService(DicaRepository dicas, AnimalRepository animais, UsuarioRepository usuarios,
                       AbrigoRepository abrigos, FotoService fotos, LimpezaDeFotos limpezaDeFotos) {
        this.dicas = dicas;
        this.animais = animais;
        this.usuarios = usuarios;
        this.abrigos = abrigos;
        this.fotos = fotos;
        this.limpezaDeFotos = limpezaDeFotos;
    }

    // GET /api/dicas: todas ou de um assunto, das mais novas pras mais antigas
    public PaginaResponse<DicaResumoResponse> listar(DicaFiltroRequest filtro) {
        PageRequest pagina = PageRequest.of(filtro.paginaPedida(), filtro.tamanhoPedido(), MAIS_NOVAS_PRIMEIRO);
        Page<Dica> resultado = filtro.getCategoria() == null
                ? dicas.findAll(pagina)
                : dicas.findByCategoria(filtro.getCategoria(), pagina);
        return PaginaResponse.de(resultado, DicaService::resumo);
    }

    // GET /api/dicas/{id}
    public DicaResponse buscar(UUID id, Authentication autenticacao) {
        Conta conta = conta(autenticacao, false);
        return resposta(encontrar(id), conta);
    }

    // GET /api/dicas/minhas
    public MinhasDicasResponse minhas(Authentication autenticacao) {
        Conta conta = conta(autenticacao, true);
        List<Dica> lista = conta.usuario() != null
                ? dicas.findByUsuarioIdOrderByPublicadaEmDesc(conta.usuario().getId())
                : dicas.findByAbrigoIdOrderByPublicadaEmDesc(conta.abrigo().getId());
        return new MinhasDicasResponse(podePublicar(conta), lista.stream().map(DicaService::resumo).toList());
    }

    // POST /api/dicas: só protetor publica (abrigo, ou pessoa que já cadastrou animal)
    @Transactional
    public DicaResponse publicar(DicaRequest request, Authentication autenticacao) {
        Conta conta = conta(autenticacao, true);
        if (!podePublicar(conta)) {
            throw new AcessoNegadoException("Só protetores publicam dicas. Cadastre um animal antes de escrever a sua");
        }
        Dica dica = new Dica();
        dica.setUsuario(conta.usuario());
        dica.setAbrigo(conta.abrigo());
        preencher(dica, request);
        dicas.saveAndFlush(dica);
        return resposta(dica, conta);
    }

    // PUT /api/dicas/{id}: só quem escreveu
    @Transactional
    public DicaResponse editar(UUID id, DicaRequest request, Authentication autenticacao) {
        Conta conta = conta(autenticacao, true);
        Dica dica = encontrar(id);
        exigirAutor(dica, conta);
        String capaAntes = dica.getFotoCapa();
        preencher(dica, request);
        dica.setAtualizadaEm(LocalDateTime.now());
        dicas.flush();
        // A capa trocada ou tirada sai também do S3
        if (capaAntes != null && !capaAntes.equals(dica.getFotoCapa())) {
            limpezaDeFotos.apagarDepoisDeSalvar(List.of(capaAntes));
        }
        return resposta(dica, conta);
    }

    // DELETE /api/dicas/{id}: só quem escreveu
    @Transactional
    public void apagar(UUID id, Authentication autenticacao) {
        Conta conta = conta(autenticacao, true);
        Dica dica = encontrar(id);
        exigirAutor(dica, conta);
        String capa = dica.getFotoCapa();
        dicas.delete(dica);
        dicas.flush();
        if (capa != null) limpezaDeFotos.apagarDepoisDeSalvar(List.of(capa));
    }

    private void preencher(Dica dica, DicaRequest request) {
        String capa = request.getFotoCapa() == null || request.getFotoCapa().isBlank()
                ? null : request.getFotoCapa().strip();
        // A dica é pública: só entra foto que passou pela conferência do POST /api/fotos
        if (capa != null && fotos.chaveDe(capa).isEmpty()) {
            throw new DadosInvalidosException("Envie a foto pelo próprio site");
        }
        dica.setTitulo(request.getTitulo().strip());
        dica.setConteudo(request.getConteudo().strip());
        dica.setCategoria(request.getCategoria());
        dica.setFotoCapa(capa);
    }

    private boolean podePublicar(Conta conta) {
        return conta.abrigo() != null || animais.existsByUsuarioId(conta.usuario().getId());
    }

    private Dica encontrar(UUID id) {
        return dicas.findById(id).orElseThrow(() -> new RecursoNaoEncontradoException("Dica não encontrada"));
    }

    private static boolean ehAutor(Dica dica, Conta conta) {
        if (conta == null) return false;
        return conta.usuario() != null && dica.getUsuario() != null
                    && dica.getUsuario().getId().equals(conta.usuario().getId())
                || conta.abrigo() != null && dica.getAbrigo() != null
                    && dica.getAbrigo().getId().equals(conta.abrigo().getId());
    }

    private static void exigirAutor(Dica dica, Conta conta) {
        if (!ehAutor(dica, conta)) throw new AcessoNegadoException("Somente quem escreveu pode alterar ou apagar a dica");
    }

    private static DicaResponse resposta(Dica dica, Conta conta) {
        return new DicaResponse(dica.getId(), dica.getTitulo(), dica.getCategoria(), dica.getCategoria().getNome(),
                dica.getConteudo(), dica.getFotoCapa(), autor(dica), dica.getPublicadaEm(), dica.getAtualizadaEm(),
                ehAutor(dica, conta));
    }

    private static DicaResumoResponse resumo(Dica dica) {
        return new DicaResumoResponse(dica.getId(), dica.getTitulo(), dica.getCategoria(),
                dica.getCategoria().getNome(), resumoDoTexto(dica.getConteudo()), dica.getFotoCapa(), autor(dica),
                dica.getPublicadaEm());
    }

    private static DicaResponse.Autor autor(Dica dica) {
        Usuario usuario = dica.getUsuario();
        Abrigo abrigo = dica.getAbrigo();
        Endereco endereco = usuario != null ? usuario.getEndereco() : abrigo.getEndereco();
        return new DicaResponse.Autor(usuario != null ? usuario.getNome() : abrigo.getNome(),
                usuario != null ? TipoConta.USUARIO : TipoConta.ABRIGO, endereco.getCidade(), endereco.getEstado());
    }

    // O começo da dica, até uns 180 caracteres, sem cortar palavra no meio
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
        return usuario ? new Conta(usuarios.findById(id).orElseThrow(DicaService::sessaoInvalida), null)
                : new Conta(null, abrigos.findById(id).orElseThrow(DicaService::sessaoInvalida));
    }

    private static AuthenticationCredentialsNotFoundException sessaoInvalida() {
        return new AuthenticationCredentialsNotFoundException("Conta autenticada não encontrada ou inválida");
    }
}
