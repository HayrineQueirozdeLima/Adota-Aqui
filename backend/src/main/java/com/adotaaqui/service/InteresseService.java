package com.adotaaqui.service;

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
import com.adotaaqui.repository.AnimalRepository;
import com.adotaaqui.repository.InteresseRepository;
import com.adotaaqui.repository.UsuarioRepository;
import org.springframework.security.authentication.AnonymousAuthenticationToken;
import org.springframework.security.authentication.AuthenticationCredentialsNotFoundException;
import org.springframework.security.core.Authentication;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.EnumSet;
import java.util.Objects;
import java.util.Set;
import java.util.UUID;

// Interesse em adotar (docs/api.md, seção 9): demonstrar (RF08, RF13, RF14, RF15) e desistir (UC07 FA01)
@Service
@Transactional(readOnly = true)
public class InteresseService {
    // Interesse "em andamento": o candidato ainda pode desistir, e não pode abrir outro no mesmo animal
    static final Set<StatusInteresse> ATIVOS = EnumSet.of(StatusInteresse.PENDENTE, StatusInteresse.EM_CONTATO);

    private final InteresseRepository interesses;
    private final AnimalRepository animais;
    private final UsuarioRepository usuarios;

    public InteresseService(InteresseRepository interesses, AnimalRepository animais, UsuarioRepository usuarios) {
        this.interesses = interesses;
        this.animais = animais;
        this.usuarios = usuarios;
    }

    // POST /api/animais/{id}/interesses
    // A ordem das checagens segue a tabela de erros do api.md: quem é, o animal existe, pode, está livre
    @Transactional
    public InteresseResponse demonstrar(UUID animalId, InteresseRequest request, Authentication autenticacao) {
        Usuario candidato = candidato(autenticacao,
                "Contas de abrigo não demonstram interesse. Para adotar, use uma conta pessoal (CPF)");
        Animal animal = animais.findById(animalId)
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
        Interesse interesse = interesses.findById(interesseId)
                .orElseThrow(() -> new RecursoNaoEncontradoException("Interesse não encontrado"));

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