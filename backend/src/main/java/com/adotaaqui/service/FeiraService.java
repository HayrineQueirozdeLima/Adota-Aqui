package com.adotaaqui.service;

import com.adotaaqui.dto.FeiraFiltroRequest;
import com.adotaaqui.dto.FeiraRequest;
import com.adotaaqui.dto.FeiraResponse;
import com.adotaaqui.dto.PaginaResponse;
import com.adotaaqui.dto.ProtetorResponse;
import com.adotaaqui.exception.AcessoNegadoException;
import com.adotaaqui.exception.DadosInvalidosException;
import com.adotaaqui.exception.RecursoNaoEncontradoException;
import com.adotaaqui.model.Abrigo;
import com.adotaaqui.model.FeiraDeAdocao;
import com.adotaaqui.model.Usuario;
import com.adotaaqui.repository.AbrigoRepository;
import com.adotaaqui.repository.FeiraRepository;
import com.adotaaqui.repository.FeiraSpecifications;
import com.adotaaqui.repository.UsuarioRepository;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Sort;
import org.springframework.security.authentication.AnonymousAuthenticationToken;
import org.springframework.security.authentication.AuthenticationCredentialsNotFoundException;
import org.springframework.security.core.Authentication;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.time.ZoneId;
import java.util.List;
import java.util.UUID;

// Feiras de adoção: os abrigos divulgam, qualquer pessoa vê as que ainda vão acontecer (docs/api.md, seção 14)
@Service
@Transactional(readOnly = true)
public class FeiraService {
    // "Hoje" no horário de Brasília. A feira de hoje continua na lista até o fim do dia
    private static final ZoneId BRASIL = ZoneId.of("America/Sao_Paulo");
    // A mais próxima primeiro. O id desempata, pra ordem não mudar de uma página pra outra
    private static final Sort MAIS_PROXIMAS_PRIMEIRO = Sort.by(Sort.Order.asc("data"), Sort.Order.asc("horaInicio"),
            Sort.Order.asc("id"));

    private final FeiraRepository feiras;
    private final UsuarioRepository usuarios;
    private final AbrigoRepository abrigos;

    public FeiraService(FeiraRepository feiras, UsuarioRepository usuarios, AbrigoRepository abrigos) {
        this.feiras = feiras;
        this.usuarios = usuarios;
        this.abrigos = abrigos;
    }

    // GET /api/feiras: as próximas, da mais perto pra mais longe no calendário
    public PaginaResponse<FeiraResponse> listar(FeiraFiltroRequest filtro, Authentication autenticacao) {
        Conta conta = conta(autenticacao, false);
        PageRequest pagina = PageRequest.of(filtro.paginaPedida(), filtro.tamanhoPedido(), MAIS_PROXIMAS_PRIMEIRO);
        return PaginaResponse.de(feiras.findAll(FeiraSpecifications.proximas(filtro, hoje()), pagina),
                feira -> resposta(feira, conta));
    }

    // GET /api/feiras/minhas: todas as do abrigo logado, inclusive as que já passaram
    public List<FeiraResponse> minhas(Authentication autenticacao) {
        Conta conta = conta(autenticacao, true);
        exigirAbrigo(conta);
        return feiras.findByAbrigoIdOrderByDataDescHoraInicioDesc(conta.abrigo().getId()).stream()
                .map(feira -> resposta(feira, conta)).toList();
    }

    // GET /api/feiras/{id}
    public FeiraResponse buscar(UUID id, Authentication autenticacao) {
        return resposta(encontrar(id), conta(autenticacao, false));
    }

    // POST /api/feiras: só abrigo divulga
    @Transactional
    public FeiraResponse criar(FeiraRequest request, Authentication autenticacao) {
        Conta conta = conta(autenticacao, true);
        exigirAbrigo(conta);
        validarDataEHorario(request);
        FeiraDeAdocao feira = new FeiraDeAdocao();
        feira.setAbrigo(conta.abrigo());
        preencher(feira, request);
        feiras.saveAndFlush(feira);
        return resposta(feira, conta);
    }

    // PUT /api/feiras/{id}: só o abrigo que divulgou
    @Transactional
    public FeiraResponse editar(UUID id, FeiraRequest request, Authentication autenticacao) {
        Conta conta = conta(autenticacao, true);
        FeiraDeAdocao feira = encontrar(id);
        exigirOrganizador(feira, conta);
        validarDataEHorario(request);
        preencher(feira, request);
        feiras.flush();
        return resposta(feira, conta);
    }

    // DELETE /api/feiras/{id}: só o abrigo que divulgou
    @Transactional
    public void apagar(UUID id, Authentication autenticacao) {
        Conta conta = conta(autenticacao, true);
        FeiraDeAdocao feira = encontrar(id);
        exigirOrganizador(feira, conta);
        feiras.delete(feira);
    }

    private static LocalDate hoje() {
        return LocalDate.now(BRASIL);
    }

    // Feira no passado não faz sentido divulgar, e a hora de terminar tem que vir depois da de começar
    private static void validarDataEHorario(FeiraRequest request) {
        if (request.getData().isBefore(hoje())) {
            throw new DadosInvalidosException("A data da feira já passou", "data");
        }
        if (!request.getHoraFim().isAfter(request.getHoraInicio())) {
            throw new DadosInvalidosException("A feira deve terminar depois de começar", "horaFim");
        }
    }

    private static void preencher(FeiraDeAdocao feira, FeiraRequest request) {
        String descricao = request.getDescricao() == null || request.getDescricao().isBlank()
                ? null : request.getDescricao().strip();
        feira.setTitulo(request.getTitulo().strip());
        feira.setDescricao(descricao);
        feira.setData(request.getData());
        feira.setHoraInicio(request.getHoraInicio());
        feira.setHoraFim(request.getHoraFim());
        feira.setLocal(request.getLocal().strip());
        feira.setEndereco(request.getEndereco().strip());
        feira.setCidade(request.getCidade().strip());
        feira.setEstado(request.getEstado());
    }

    private FeiraDeAdocao encontrar(UUID id) {
        return feiras.findById(id).orElseThrow(() -> new RecursoNaoEncontradoException("Feira não encontrada"));
    }

    private static void exigirAbrigo(Conta conta) {
        if (conta.abrigo() == null) throw new AcessoNegadoException("Só abrigos divulgam feiras de adoção");
    }

    private static boolean ehOrganizador(FeiraDeAdocao feira, Conta conta) {
        return conta != null && conta.abrigo() != null && feira.getAbrigo().getId().equals(conta.abrigo().getId());
    }

    private static void exigirOrganizador(FeiraDeAdocao feira, Conta conta) {
        if (!ehOrganizador(feira, conta)) {
            throw new AcessoNegadoException("Somente o abrigo que divulgou pode alterar ou apagar a feira");
        }
    }

    private static FeiraResponse resposta(FeiraDeAdocao feira, Conta conta) {
        Abrigo abrigo = feira.getAbrigo();
        ProtetorResponse organizador = new ProtetorResponse(abrigo.getNome(), abrigo.getEndereco().getCidade(),
                abrigo.getEndereco().getEstado());
        return new FeiraResponse(feira.getId(), feira.getTitulo(), feira.getDescricao(), feira.getData(),
                feira.getHoraInicio(), feira.getHoraFim(), feira.getLocal(), feira.getEndereco(), feira.getCidade(),
                feira.getEstado(), organizador, ehOrganizador(feira, conta));
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
        return usuario ? new Conta(usuarios.findById(id).orElseThrow(FeiraService::sessaoInvalida), null)
                : new Conta(null, abrigos.findById(id).orElseThrow(FeiraService::sessaoInvalida));
    }

    private static AuthenticationCredentialsNotFoundException sessaoInvalida() {
        return new AuthenticationCredentialsNotFoundException("Conta autenticada não encontrada ou inválida");
    }
}
