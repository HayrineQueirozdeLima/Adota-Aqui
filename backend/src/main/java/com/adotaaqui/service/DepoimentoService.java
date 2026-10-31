package com.adotaaqui.service;

import com.adotaaqui.dto.DepoimentoRequest;
import com.adotaaqui.dto.DepoimentoResponse;
import com.adotaaqui.dto.PaginaRequest;
import com.adotaaqui.dto.PaginaResponse;
import com.adotaaqui.exception.AcessoNegadoException;
import com.adotaaqui.exception.DadosInvalidosException;
import com.adotaaqui.exception.RecursoNaoEncontradoException;
import com.adotaaqui.exception.RegraNegocioException;
import com.adotaaqui.model.Animal;
import com.adotaaqui.model.Depoimento;
import com.adotaaqui.model.Interesse;
import com.adotaaqui.model.Usuario;
import com.adotaaqui.model.enums.StatusAdocao;
import com.adotaaqui.model.enums.StatusInteresse;
import com.adotaaqui.repository.AnimalRepository;
import com.adotaaqui.repository.DepoimentoRepository;
import com.adotaaqui.repository.InteresseRepository;
import com.adotaaqui.repository.UsuarioRepository;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Sort;
import org.springframework.security.authentication.AnonymousAuthenticationToken;
import org.springframework.security.authentication.AuthenticationCredentialsNotFoundException;
import org.springframework.security.core.Authentication;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.Comparator;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.UUID;
import java.util.stream.Collectors;

// Depoimento de quem adotou e mural de histórias de adoção (RF11, UC09, ERS 6.3)
@Service
@Transactional(readOnly = true)
public class DepoimentoService {
    // ERS 6.3: o novo tutor tem 30 dias, a partir da aprovação, pra contar como foi
    static final int PRAZO_EM_DIAS = 30;

    private static final Sort MAIS_NOVOS_PRIMEIRO = Sort.by(Sort.Order.desc("dataHora"), Sort.Order.asc("id"));

    private final DepoimentoRepository depoimentos;
    private final InteresseRepository interesses;
    private final AnimalRepository animais;
    private final UsuarioRepository usuarios;
    private final FotoService fotos;
    private final LimpezaDeFotos limpezaDeFotos;

    public DepoimentoService(DepoimentoRepository depoimentos, InteresseRepository interesses, AnimalRepository animais,
                             UsuarioRepository usuarios, FotoService fotos, LimpezaDeFotos limpezaDeFotos) {
        this.depoimentos = depoimentos;
        this.interesses = interesses;
        this.animais = animais;
        this.usuarios = usuarios;
        this.fotos = fotos;
        this.limpezaDeFotos = limpezaDeFotos;
    }

    // O que Minhas candidaturas precisa saber de cada interesse: se já tem depoimento,
    // se a pessoa ainda pode escrever e até quando
    public record Situacao(UUID depoimentoId, boolean podeContar, LocalDate prazo) {
        static final Situacao NENHUMA = new Situacao(null, false, null);
    }

    // POST /api/interesses/{id}/depoimento
    @Transactional
    public DepoimentoResponse escrever(UUID interesseId, DepoimentoRequest request, Authentication autenticacao) {
        Usuario autor = autor(autenticacao, "Contas de abrigo não adotam pelo site, então não têm depoimento");
        UUID animalId = interesses.findAnimalIdById(interesseId)
                .orElseThrow(() -> new RecursoNaoEncontradoException("Interesse não encontrado"));
        // Trava o animal: dois envios ao mesmo tempo não criam dois depoimentos pra mesma adoção
        animais.findByIdParaAtualizacao(animalId)
                .orElseThrow(() -> new RecursoNaoEncontradoException("Interesse não encontrado"));
        Interesse interesse = interesses.findById(interesseId)
                .orElseThrow(() -> new RecursoNaoEncontradoException("Interesse não encontrado"));

        if (!interesse.getUsuario().getId().equals(autor.getId())) {
            throw new AcessoNegadoException("Somente quem adotou pode contar como foi a adoção");
        }
        if (depoimentos.existsByInteresseId(interesseId)) {
            throw new RegraNegocioException("Você já contou como foi essa adoção");
        }
        if (!adocaoAtual(interesse)) {
            throw new RegraNegocioException("Só dá pra contar como foi depois que a adoção é aprovada");
        }
        LocalDate prazo = prazo(interesse);
        if (prazo != null && LocalDate.now().isAfter(prazo)) {
            throw new RegraNegocioException("O prazo de " + PRAZO_EM_DIAS + " dias pra contar como foi a adoção acabou");
        }
        String foto = request.getFotoUrl() == null || request.getFotoUrl().isBlank() ? null : request.getFotoUrl().strip();
        // O mural é público: só entra foto que passou pela conferência do POST /api/fotos
        if (foto != null && fotos.chaveDe(foto).isEmpty()) {
            throw new DadosInvalidosException("Envie a foto pelo próprio site");
        }

        Depoimento depoimento = new Depoimento();
        depoimento.setInteresse(interesse);
        depoimento.setTexto(request.getTexto().strip());
        depoimento.setFotoUrl(foto);
        depoimentos.saveAndFlush(depoimento);
        return resposta(depoimento);
    }

    // GET /api/depoimentos: o mural, dos mais novos pros mais antigos
    public PaginaResponse<DepoimentoResponse> mural(PaginaRequest pedido) {
        PageRequest pagina = PageRequest.of(pedido.paginaPedida(), pedido.tamanhoPedido(), MAIS_NOVOS_PRIMEIRO);
        return PaginaResponse.de(depoimentos.findAll(pagina), this::resposta);
    }

    // DELETE /api/depoimentos/{id}: quem escreveu pode tirar do mural quando quiser
    @Transactional
    public void apagar(UUID id, Authentication autenticacao) {
        Usuario autor = autor(autenticacao, "Somente quem escreveu pode apagar o depoimento");
        Depoimento depoimento = depoimentos.findById(id)
                .orElseThrow(() -> new RecursoNaoEncontradoException("Depoimento não encontrado"));
        if (!depoimento.getInteresse().getUsuario().getId().equals(autor.getId())) {
            throw new AcessoNegadoException("Somente quem escreveu pode apagar o depoimento");
        }
        String foto = depoimento.getFotoUrl();
        depoimentos.delete(depoimento);
        depoimentos.flush();
        if (foto != null) limpezaDeFotos.apagarDepoisDeSalvar(List.of(foto));
    }

    // Pra Minhas candidaturas: a situação do depoimento de cada interesse da lista
    public Map<UUID, Situacao> situacoes(List<Interesse> lista) {
        Map<UUID, UUID> escritos = depoimentos.findByInteresseIdIn(lista.stream().map(Interesse::getId).toList())
                .stream().collect(Collectors.toMap(d -> d.getInteresse().getId(), Depoimento::getId));
        LocalDate hoje = LocalDate.now();
        Map<UUID, Situacao> resultado = new HashMap<>();
        for (Interesse interesse : lista) {
            UUID escrito = escritos.get(interesse.getId());
            if (escrito != null) {
                resultado.put(interesse.getId(), new Situacao(escrito, false, null));
                continue;
            }
            if (!adocaoAtual(interesse)) {
                resultado.put(interesse.getId(), Situacao.NENHUMA);
                continue;
            }
            LocalDate prazo = prazo(interesse);
            boolean noPrazo = prazo == null || !hoje.isAfter(prazo);
            resultado.put(interesse.getId(), noPrazo ? new Situacao(null, true, prazo) : Situacao.NENHUMA);
        }
        return resultado;
    }

    // A adoção que vale é a atual: o interesse foi aprovado, o animal está Adotado e nenhum outro
    // interesse dele foi aprovado depois. Depois de uma devolução e de uma nova adoção, o interesse
    // antigo continua Aprovado no histórico (RF06), mas a história agora é de outra pessoa
    private boolean adocaoAtual(Interesse interesse) {
        Animal animal = interesse.getAnimal();
        if (interesse.getStatusAndamento() != StatusInteresse.APROVADO
                || animal.getStatusAdocao() != StatusAdocao.ADOTADO) {
            return false;
        }
        return animal.getInteresses().stream()
                .filter(outro -> outro.getStatusAndamento() == StatusInteresse.APROVADO)
                .max(Comparator.comparing(DepoimentoService::quandoFoiAprovado)
                        .thenComparing(outro -> outro.getId().toString()))
                .map(maisRecente -> maisRecente.getId().equals(interesse.getId()))
                .orElse(false);
    }

    // Interesse aprovado antes de existir a data da aprovação fica sem prazo
    private static LocalDate prazo(Interesse interesse) {
        return interesse.getAprovadoEm() == null ? null
                : interesse.getAprovadoEm().toLocalDate().plusDays(PRAZO_EM_DIAS);
    }

    private static LocalDateTime quandoFoiAprovado(Interesse interesse) {
        return interesse.getAprovadoEm() != null ? interesse.getAprovadoEm() : interesse.getDataHora();
    }

    private DepoimentoResponse resposta(Depoimento depoimento) {
        Interesse interesse = depoimento.getInteresse();
        Usuario adotante = interesse.getUsuario();
        Animal animal = interesse.getAnimal();
        String capa = animal.getFotos().isEmpty() ? null : animal.getFotos().get(0);
        String protetor = animal.getUsuario() != null ? animal.getUsuario().getNome() : animal.getAbrigo().getNome();
        return new DepoimentoResponse(depoimento.getId(), depoimento.getTexto(), depoimento.getFotoUrl(),
                depoimento.getDataHora(), primeiroNome(adotante.getNome()), adotante.getEndereco().getEstado(),
                new DepoimentoResponse.Animal(animal.getNome(), animal.getEspecie(), capa), protetor);
    }

    // "Ana Clara Souza" vira "Ana": o sobrenome não vai pro mural
    static String primeiroNome(String nome) {
        return nome.strip().split("\\s+")[0];
    }

    // Só conta de Usuario (pessoa física) adota, então só ela escreve e apaga depoimento
    private Usuario autor(Authentication autenticacao, String mensagemParaAbrigo) {
        if (autenticacao == null || !autenticacao.isAuthenticated()
                || autenticacao instanceof AnonymousAuthenticationToken) {
            throw sessaoInvalida();
        }
        boolean abrigo = autenticacao.getAuthorities().stream().anyMatch(a -> a.getAuthority().equals("ROLE_ABRIGO"));
        if (abrigo) throw new AcessoNegadoException(mensagemParaAbrigo);
        UUID id;
        try {
            id = UUID.fromString(autenticacao.getName());
        } catch (IllegalArgumentException ex) {
            throw sessaoInvalida();
        }
        return usuarios.findById(id).orElseThrow(DepoimentoService::sessaoInvalida);
    }

    private static AuthenticationCredentialsNotFoundException sessaoInvalida() {
        return new AuthenticationCredentialsNotFoundException("Conta autenticada não encontrada ou inválida");
    }
}
