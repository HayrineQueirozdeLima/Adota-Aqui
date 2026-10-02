package com.adotaaqui.service;

import com.adotaaqui.dto.AnimalFiltroRequest;
import com.adotaaqui.dto.AnimalListagemResponse;
import com.adotaaqui.dto.AnimalRequest;
import com.adotaaqui.dto.AnimalResponse;
import com.adotaaqui.dto.AtualizarAnimalRequest;
import com.adotaaqui.dto.InteresseResumoResponse;
import com.adotaaqui.dto.VacinaRequest;
import com.adotaaqui.exception.DadosInvalidosException;
import com.adotaaqui.exception.RecursoNaoEncontradoException;
import com.adotaaqui.exception.RegraNegocioException;
import com.adotaaqui.model.Abrigo;
import com.adotaaqui.model.Animal;
import com.adotaaqui.model.Interesse;
import com.adotaaqui.model.Usuario;
import com.adotaaqui.model.Vacina;
import com.adotaaqui.model.enums.StatusAdocao;
import com.adotaaqui.model.enums.StatusInteresse;
import com.adotaaqui.repository.AbrigoRepository;
import com.adotaaqui.repository.AnimalRepository;
import com.adotaaqui.repository.AnimalSpecifications;
import com.adotaaqui.repository.InteresseRepository;
import com.adotaaqui.repository.UsuarioRepository;
import jakarta.validation.Valid;
import jakarta.validation.constraints.NotNull;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.security.authentication.AnonymousAuthenticationToken;
import org.springframework.security.authentication.AuthenticationCredentialsNotFoundException;
import org.springframework.security.core.Authentication;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.validation.annotation.Validated;

import java.time.LocalDate;
import java.util.ArrayList;
import java.util.List;
import java.util.Map;
import java.util.Objects;
import java.util.UUID;
import java.util.function.Function;
import java.util.stream.Collectors;

@Service
@Validated
@Transactional(readOnly = true)
public class AnimalService {
    private final AnimalRepository animais;
    private final UsuarioRepository usuarios;
    private final AbrigoRepository abrigos;
    private final InteresseRepository interesses;

    public AnimalService(AnimalRepository animais, UsuarioRepository usuarios,
                         AbrigoRepository abrigos, InteresseRepository interesses) {
        this.animais = animais;
        this.usuarios = usuarios;
        this.abrigos = abrigos;
        this.interesses = interesses;
    }

    @Transactional
    public AnimalResponse cadastrar(@NotNull @Valid AnimalRequest request, Authentication autenticacao) {
        Conta conta = conta(autenticacao, true);
        validarRaca(request);
        Animal animal = new Animal();
        animal.setUsuario(conta.usuario());
        animal.setAbrigo(conta.abrigo());
        if ((animal.getUsuario() == null) == (animal.getAbrigo() == null)) {
            throw new DadosInvalidosException("O animal deve ter exatamente um cadastrante");
        }
        animal.setStatusAdocao(StatusAdocao.DISPONIVEL);
        atualizarDados(animal, request);
        animais.saveAndFlush(animal);
        return resposta(animal, conta);
    }

    public List<AnimalListagemResponse> listar(AnimalFiltroRequest filtro, Authentication autenticacao) {
        Conta conta = conta(autenticacao, false);
        String estado = conta != null && conta.usuario() != null ? conta.usuario().getEndereco().getEstado() : null;
        return animais.findAll(AnimalSpecifications.disponiveis(filtro, estado)).stream()
                .map(AnimalMapper::item).toList();
    }

    public List<AnimalListagemResponse> listarMeus(Authentication autenticacao) {
        Conta conta = conta(autenticacao, true);
        List<Animal> resultado = conta.usuario() != null
                ? animais.findByUsuarioId(conta.usuario().getId())
                : animais.findByAbrigoId(conta.abrigo().getId());
        return resultado.stream().map(AnimalMapper::item).toList();
    }

    public AnimalResponse buscar(UUID id, Authentication autenticacao) {
        Conta conta = conta(autenticacao, false);
        Animal animal = animais.findById(id).orElseThrow(AnimalService::naoEncontrado);
        if (animal.getStatusAdocao() == StatusAdocao.ADOTADO && !ehDono(animal, conta)) {
            throw naoEncontrado();
        }
        return resposta(animal, conta);
    }

    @Transactional
    public AnimalResponse atualizar(UUID id, @NotNull @Valid AtualizarAnimalRequest request,
                                     Authentication autenticacao) {
        Conta conta = conta(autenticacao, true);
        Animal animal = animais.findByIdParaAtualizacao(id).orElseThrow(AnimalService::naoEncontrado);
        exigirDono(animal, conta);
        if (animal.getStatusAdocao() == StatusAdocao.ADOTADO) {
            if (!mesmosDados(animal, request)) {
                throw new RegraNegocioException("Animal adotado permite alterar somente o status. Reabra antes de editar os dados");
            }
            animal.setStatusAdocao(request.getStatusAdocao());
        } else {
            if (request.getStatusAdocao() != StatusAdocao.DISPONIVEL) {
                throw new RegraNegocioException("A adoção deve ser registrada pela aprovação de um interesse");
            }
            validarRaca(request);
            atualizarDados(animal, request);
        }
        animais.flush();
        return resposta(animal, conta);
    }

    @Transactional
    public void remover(UUID id, Authentication autenticacao) {
        Conta conta = conta(autenticacao, true);
        Animal animal = animais.findByIdParaAtualizacao(id).orElseThrow(AnimalService::naoEncontrado);
        exigirDono(animal, conta);
        // Remoção por entidade preserva os callbacks e a cascata dos dependentes.
        animais.delete(animal);
        animais.flush();
    }

    private void validarRaca(AnimalRequest request) {
        if (!request.getRaca().pertenceA(request.getEspecie())) {
            throw new DadosInvalidosException("A raça deve pertencer à espécie informada");
        }
    }

    private void atualizarDados(Animal animal, AnimalRequest request) {
        animal.setNome(request.getNome());
        animal.setEspecie(request.getEspecie());
        animal.setRaca(request.getRaca());
        animal.setSexo(request.getSexo());
        animal.setPorte(request.getPorte());
        animal.setPeso(request.getPeso());
        animal.setDataNascEstimada(request.getDataNascEstimada());
        animal.setCastrado(request.getCastrado());
        animal.setEnergia(request.getEnergia());
        animal.setConvivenciaCrianca(request.getConvivencia().getCrianca());
        animal.setConvivenciaGato(request.getConvivencia().getGato());
        animal.setConvivenciaCao(request.getConvivencia().getCao());
        animal.setHistoria(request.getHistoria());
        if (!animal.getFotos().equals(request.getFotos())) {
            animal.getFotos().clear();
            animal.getFotos().addAll(request.getFotos());
        }
        // Vacinas não têm ordem no modelo. Compare conteúdo e multiplicidade, não IDs.
        if (!vacinasAtuais(animal).equals(vacinasRecebidas(request))) {
            new ArrayList<>(animal.getVacinas()).forEach(animal::removerVacina);
            for (VacinaRequest dto : vacinas(request)) {
                Vacina vacina = new Vacina();
                vacina.setNome(dto.getNome());
                vacina.setDose(dto.getDose());
                vacina.setDataAplicacao(dto.getDataAplicacao());
                animal.adicionarVacina(vacina);
            }
        }
    }

    private boolean mesmosDados(Animal a, AnimalRequest r) {
        return Objects.equals(a.getNome(), r.getNome()) && a.getEspecie() == r.getEspecie()
                && a.getRaca() == r.getRaca() && a.getSexo() == r.getSexo() && a.getPorte() == r.getPorte()
                && Objects.equals(a.getPeso(), r.getPeso())
                && Objects.equals(a.getDataNascEstimada(), r.getDataNascEstimada())
                && Objects.equals(a.getCastrado(), r.getCastrado()) && a.getEnergia() == r.getEnergia()
                && a.getConvivenciaCrianca() == r.getConvivencia().getCrianca()
                && a.getConvivenciaGato() == r.getConvivencia().getGato()
                && a.getConvivenciaCao() == r.getConvivencia().getCao()
                && Objects.equals(a.getHistoria(), r.getHistoria())
                && a.getFotos().equals(r.getFotos()) && vacinasAtuais(a).equals(vacinasRecebidas(r));
    }

    private List<VacinaRequest> vacinas(AnimalRequest request) {
        return request.getVacinas() == null ? List.of() : request.getVacinas();
    }

    private record DadosVacina(String nome, Integer dose, LocalDate data) {}

    private Map<DadosVacina, Long> vacinasAtuais(Animal animal) {
        return animal.getVacinas().stream().map(v -> new DadosVacina(v.getNome(), v.getDose(), v.getDataAplicacao()))
                .collect(Collectors.groupingBy(Function.identity(), Collectors.counting()));
    }

    private Map<DadosVacina, Long> vacinasRecebidas(AnimalRequest request) {
        return vacinas(request).stream().map(v -> new DadosVacina(v.getNome(), v.getDose(), v.getDataAplicacao()))
                .collect(Collectors.groupingBy(Function.identity(), Collectors.counting()));
    }

    private AnimalResponse resposta(Animal animal, Conta conta) {
        boolean dono = ehDono(animal, conta);
        List<Interesse> registros = conta != null && conta.usuario() != null
                ? interesses.findByUsuarioIdAndAnimalIdOrderByDataHoraDesc(conta.usuario().getId(), animal.getId())
                : List.of();
        Interesse ativo = registros.stream().filter(this::ativo).findFirst().orElse(null);
        Interesse escolhido = ativo != null ? ativo : registros.stream().findFirst().orElse(null);
        InteresseResumoResponse resumo = escolhido == null ? null
                : new InteresseResumoResponse(escolhido.getId(), escolhido.getStatusAndamento());
        boolean podeInteresse = conta != null && conta.usuario() != null && !dono
                && animal.getStatusAdocao() == StatusAdocao.DISPONIVEL
                && Objects.equals(conta.usuario().getEndereco().getEstado(), animal.getEstado()) && ativo == null;
        return AnimalMapper.completo(animal, dono, podeInteresse, resumo);
    }

    private boolean ativo(Interesse interesse) {
        return interesse.getStatusAndamento() == StatusInteresse.PENDENTE
                || interesse.getStatusAndamento() == StatusInteresse.EM_CONTATO;
    }

    private boolean ehDono(Animal animal, Conta conta) {
        if (conta == null) return false;
        return conta.usuario() != null && animal.getUsuario() != null
                    && conta.usuario().getId().equals(animal.getUsuario().getId())
                || conta.abrigo() != null && animal.getAbrigo() != null
                    && conta.abrigo().getId().equals(animal.getAbrigo().getId());
    }

    private void exigirDono(Animal animal, Conta conta) {
        if (!ehDono(animal, conta)) throw new AccessDeniedException("Somente o cadastrante pode alterar ou remover o animal");
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
        return usuario ? new Conta(usuarios.findById(id).orElseThrow(AnimalService::sessaoInvalida), null)
                : new Conta(null, abrigos.findById(id).orElseThrow(AnimalService::sessaoInvalida));
    }

    private static AuthenticationCredentialsNotFoundException sessaoInvalida() {
        return new AuthenticationCredentialsNotFoundException("Conta autenticada não encontrada ou inválida");
    }

    private static RecursoNaoEncontradoException naoEncontrado() {
        return new RecursoNaoEncontradoException("Animal não encontrado");
    }
}

