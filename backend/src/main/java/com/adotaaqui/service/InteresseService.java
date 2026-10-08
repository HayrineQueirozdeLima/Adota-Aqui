package com.adotaaqui.service;

import com.adotaaqui.dto.AtualizarStatusInteresseRequest;
import com.adotaaqui.dto.InteresseFiltroRequest;
import com.adotaaqui.dto.InteresseRecebidoResponse;
import com.adotaaqui.exception.DadosInvalidosException;
import com.adotaaqui.dto.InteresseRequest;
import com.adotaaqui.dto.InteresseResponse;
import com.adotaaqui.dto.TriagemDto;
import com.adotaaqui.exception.AcessoNegadoException;
import com.adotaaqui.exception.RecursoNaoEncontradoException;
import com.adotaaqui.exception.RegraNegocioException;
import com.adotaaqui.model.Animal;
import com.adotaaqui.model.Interesse;
import com.adotaaqui.model.Usuario;
import com.adotaaqui.model.enums.StatusAdocao;
import com.adotaaqui.model.enums.StatusInteresse;
import com.adotaaqui.repository.AbrigoRepository;
import com.adotaaqui.repository.AnimalRepository;
import com.adotaaqui.repository.InteresseRepository;
import com.adotaaqui.repository.UsuarioRepository;
import org.springframework.security.authentication.AnonymousAuthenticationToken;
import org.springframework.security.authentication.AuthenticationCredentialsNotFoundException;
import org.springframework.security.core.Authentication;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.EnumSet;
import java.util.List;
import java.util.Objects;
import java.util.Set;
import java.util.UUID;

// Interesse em adotar e gerenciamento pelo Protetor (docs/api.md, seção 9, UC07 e UC08).
@Service
@Transactional(readOnly = true)
public class InteresseService {
    // Interesse "em andamento": o candidato ainda pode desistir, e não pode abrir outro no mesmo animal
    static final Set<StatusInteresse> ATIVOS = EnumSet.of(StatusInteresse.PENDENTE, StatusInteresse.EM_CONTATO);

    private final InteresseRepository interesses;
    private final AnimalRepository animais;
    private final UsuarioRepository usuarios;
    private final AbrigoRepository abrigos;
    static final String MOTIVO_APROVACAO = "Outro candidato foi aprovado para este animal.";

    public InteresseService(InteresseRepository interesses, AnimalRepository animais, UsuarioRepository usuarios,
                            AbrigoRepository abrigos) {
        this.interesses = interesses;
        this.animais = animais;
        this.usuarios = usuarios;
        this.abrigos = abrigos;
    }

    // POST /api/animais/{id}/interesses
    // A ordem das checagens segue a tabela de erros do api.md: quem é, o animal existe, pode, está livre
    @Transactional
    public InteresseResponse demonstrar(UUID animalId, InteresseRequest request, Authentication autenticacao) {
        Usuario candidato = candidato(autenticacao,
                "Contas de abrigo não demonstram interesse. Para adotar, use uma conta pessoal (CPF)");
        Animal animal = animais.findByIdParaAtualizacao(animalId)
                .orElseThrow(() -> new RecursoNaoEncontradoException("Animal não encontrado"));

        if (animal.getUsuario() != null && animal.getUsuario().getId().equals(candidato.getId())) {
            throw new AcessoNegadoException("Você não pode demonstrar interesse em um animal que você cadastrou");
        }
        if (!Objects.equals(candidato.getEndereco().getEstado(), animal.getEstado())) {
            throw new AcessoNegadoException("Só é possível demonstrar interesse em animais do seu estado");
        }
        if (animal.getStatusAdocao() != StatusAdocao.DISPONIVEL) {
            throw new RegraNegocioException("Este animal não está disponível para adoção");
        }
        if (interesses.existsByUsuarioIdAndAnimalIdAndStatusAndamentoIn(candidato.getId(), animalId, ATIVOS)) {
            throw new RegraNegocioException("Você já demonstrou interesse neste animal");
        }

        Interesse interesse = new Interesse();
        interesse.setUsuario(candidato);
        interesse.setAnimal(animal);
        interesse.setStatusAndamento(StatusInteresse.PENDENTE);
        copiarTriagem(request.getTriagem(), interesse);
        interesses.saveAndFlush(interesse);
        return InteresseMapper.paraCandidato(interesse);
    }

    // DELETE /api/interesses/{id}: o candidato desiste e o interesse é apagado
    // Só vale pra interesse em andamento: aprovado ou descontinuado fica no histórico (RF06)
    @Transactional
    public void desistir(UUID interesseId, Authentication autenticacao) {
        String soOCandidato = "Somente quem demonstrou o interesse pode desistir dele";
        Usuario candidato = candidato(autenticacao, soOCandidato);
        Interesse interesse = interesseParaAtualizacao(interesseId);

        if (!interesse.getUsuario().getId().equals(candidato.getId())) {
            throw new AcessoNegadoException(soOCandidato);
        }
        if (!ATIVOS.contains(interesse.getStatusAndamento())) {
            throw new RegraNegocioException("Só é possível desistir de um interesse pendente ou em contato");
        }

        // Tira da lista do animal antes de apagar: assim o cascade do Animal não tenta salvar de novo
        interesse.getAnimal().getInteresses().remove(interesse);
        interesses.delete(interesse);
    }

    public List<InteresseRecebidoResponse> recebidos(InteresseFiltroRequest filtro, Authentication autenticacao) {
        Protetor protetor = protetor(autenticacao);
        return interesses.findRecebidos(protetor.id(), protetor.abrigo(), filtro.getAnimalId(), filtro.getStatus())
                .stream().map(InteresseMapper::paraProtetor).toList();
    }

    @Transactional
    public InteresseRecebidoResponse atualizarStatus(UUID id, AtualizarStatusInteresseRequest request,
                                                     Authentication autenticacao) {
        Protetor protetor = protetor(autenticacao);
        Interesse interesse = interesseParaAtualizacao(id);
        Animal animal = interesse.getAnimal();
        boolean tutor = protetor.abrigo()
                ? animal.getAbrigo() != null && animal.getAbrigo().getId().equals(protetor.id())
                : animal.getUsuario() != null && animal.getUsuario().getId().equals(protetor.id());
        if (!tutor) {
            throw new AcessoNegadoException("Somente o protetor do animal pode gerenciar este interesse");
        }
        StatusInteresse destino = request.getStatusAndamento();
        if (destino == null) throw new DadosInvalidosException("O status de andamento é obrigatório");
        if (!ATIVOS.contains(interesse.getStatusAndamento()) || destino == StatusInteresse.PENDENTE
                || destino == interesse.getStatusAndamento()) {
            throw new RegraNegocioException("Transição de status não permitida para este interesse");
        }
        String motivo = request.getMotivoDescontinuacao();
        if (destino == StatusInteresse.DESCONTINUADO
                && (motivo == null || motivo.isBlank() || motivo.length() > 255)) {
            throw new DadosInvalidosException("Descontinuar um interesse exige motivo de até 255 caracteres");
        }
        if (destino == StatusInteresse.APROVADO) {
            if (animal.getStatusAdocao() != StatusAdocao.DISPONIVEL) {
                throw new RegraNegocioException("Este animal já está adotado");
            }
            animal.setStatusAdocao(StatusAdocao.ADOTADO);
            for (Interesse outro : interesses.findByAnimalIdAndStatusAndamentoIn(animal.getId(), ATIVOS)) {
                if (!outro.getId().equals(id)) {
                    outro.setStatusAndamento(StatusInteresse.DESCONTINUADO);
                    outro.setMotivoDescontinuacao(MOTIVO_APROVACAO);
                }
            }
        }
        interesse.setStatusAndamento(destino);
        interesse.setMotivoDescontinuacao(destino == StatusInteresse.DESCONTINUADO ? motivo.strip() : null);
        interesses.flush();
        return InteresseMapper.paraProtetor(interesse);
    }

       private Interesse interesseParaAtualizacao(UUID id) {
        UUID animalId = interesses.findAnimalIdById(id)
                .orElseThrow(() -> new RecursoNaoEncontradoException("Interesse não encontrado"));
        animais.findByIdParaAtualizacao(animalId)
                .orElseThrow(() -> new RecursoNaoEncontradoException("Animal não encontrado"));
        return interesses.findById(id)
                .orElseThrow(() -> new RecursoNaoEncontradoException("Interesse não encontrado"));
    }

    private record Protetor(UUID id, boolean abrigo) {}

    private Protetor protetor(Authentication autenticacao) {
        if (autenticacao == null || !autenticacao.isAuthenticated()
                || autenticacao instanceof AnonymousAuthenticationToken) throw sessaoInvalida();
        boolean usuario = temPapel(autenticacao, "ROLE_USUARIO");
        boolean abrigo = temPapel(autenticacao, "ROLE_ABRIGO");
        if (usuario == abrigo) throw sessaoInvalida();
        UUID id;
        try {
            id = UUID.fromString(autenticacao.getName());
        } catch (IllegalArgumentException ex) {
            throw sessaoInvalida();
        }
        if (abrigo ? !abrigos.existsById(id) : !usuarios.existsById(id)) throw sessaoInvalida();
        return new Protetor(id, abrigo);
    }

    private static void copiarTriagem(TriagemDto triagem, Interesse interesse) {
        interesse.setMoradia(triagem.getMoradia());
        interesse.setCriancas(triagem.getCriancas());
        interesse.setTempoSozinho(triagem.getTempoSozinho());
        interesse.setOutrosAnimais(triagem.getOutrosAnimais());
        interesse.setProgramacaoViagem(triagem.getProgramacaoViagem());
        interesse.setMomentoContato(triagem.getMomentoContato());
    }

    // Só conta de Usuario (pessoa física) demonstra interesse e desiste. Abrigo recebe 403 com o motivo
    private Usuario candidato(Authentication autenticacao, String mensagemParaAbrigo) {
        if (autenticacao == null || !autenticacao.isAuthenticated()
                || autenticacao instanceof AnonymousAuthenticationToken) {
            throw sessaoInvalida();
        }
        if (temPapel(autenticacao, "ROLE_ABRIGO")) {
            throw new AcessoNegadoException(mensagemParaAbrigo);
        }
        if (!temPapel(autenticacao, "ROLE_USUARIO")) {
            throw sessaoInvalida();
        }
        UUID id;
        try {
            id = UUID.fromString(autenticacao.getName());
        } catch (IllegalArgumentException ex) {
            throw sessaoInvalida();
        }
        return usuarios.findById(id).orElseThrow(InteresseService::sessaoInvalida);
    }

    private static boolean temPapel(Authentication autenticacao, String papel) {
        return autenticacao.getAuthorities().stream().anyMatch(a -> a.getAuthority().equals(papel));
    }

    private static AuthenticationCredentialsNotFoundException sessaoInvalida() {
        return new AuthenticationCredentialsNotFoundException("Conta autenticada não encontrada ou inválida");
    }
}