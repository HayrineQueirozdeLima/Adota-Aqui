package com.adotaaqui.service;

import com.adotaaqui.dto.PaginaResponse;
import com.adotaaqui.dto.ProtetorFiltroRequest;
import com.adotaaqui.dto.ProtetorListagemResponse;
import com.adotaaqui.model.Abrigo;
import com.adotaaqui.model.Endereco;
import com.adotaaqui.model.Usuario;
import com.adotaaqui.model.enums.StatusAdocao;
import com.adotaaqui.model.enums.StatusInteresse;
import com.adotaaqui.model.enums.TipoConta;
import com.adotaaqui.repository.AbrigoRepository;
import com.adotaaqui.repository.AnimalRepository;
import com.adotaaqui.repository.ContagemPorProtetor;
import com.adotaaqui.repository.InteresseRepository;
import com.adotaaqui.repository.UsuarioRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.text.Collator;
import java.text.Normalizer;
import java.util.ArrayList;
import java.util.Comparator;
import java.util.HashMap;
import java.util.List;
import java.util.Locale;
import java.util.Map;
import java.util.UUID;

// Página de abrigos e protetores (o "Abrigos e protetores independentes" do rodapé): quem cuida dos
// animais do site, em ordem alfabética. Protetor independente é a pessoa que já cadastrou pelo menos um animal
@Service
@Transactional(readOnly = true)
public class ProtetorService {
    private final AbrigoRepository abrigos;
    private final UsuarioRepository usuarios;
    private final AnimalRepository animais;
    private final InteresseRepository interesses;

    public ProtetorService(AbrigoRepository abrigos, UsuarioRepository usuarios, AnimalRepository animais,
                           InteresseRepository interesses) {
        this.abrigos = abrigos;
        this.usuarios = usuarios;
        this.animais = animais;
        this.interesses = interesses;
    }

    // GET /api/protetores. Junta abrigos e pessoas, filtra, põe em ordem e corta a página aqui no Java.
    // Com centenas de protetores isso é rápido. Se um dia passar de alguns milhares, vale trocar
    // por uma consulta só no banco (docs/aspectos-relevantes.md)
    public PaginaResponse<ProtetorListagemResponse> listar(ProtetorFiltroRequest filtro) {
        Map<UUID, Long> disponiveis = porProtetor(animais.contarPorProtetor(StatusAdocao.DISPONIVEL));
        Map<UUID, Long> adocoes = porProtetor(interesses.contarPorProtetor(StatusInteresse.APROVADO));

        List<ProtetorListagemResponse> todos = new ArrayList<>();
        if (filtro.getTipo() != TipoConta.USUARIO) {
            for (Abrigo abrigo : abrigos.findAll()) {
                todos.add(item(abrigo.getId(), TipoConta.ABRIGO, abrigo.getNome(), abrigo.getEndereco(), abrigo.getFotoUrl(),
                        disponiveis, adocoes));
            }
        }
        if (filtro.getTipo() != TipoConta.ABRIGO) {
            for (Usuario usuario : usuarios.findProtetores()) {
                todos.add(item(usuario.getId(), TipoConta.USUARIO, usuario.getNome(), usuario.getEndereco(), usuario.getFotoUrl(),
                        disponiveis, adocoes));
            }
        }

        // Ordem do dicionário: "Ágata" vem junto com os nomes que começam com A, e não depois do Z.
        // O id desempata dois nomes iguais, pra ordem não mudar de uma página pra outra
        Collator alfabetica = Collator.getInstance(Locale.forLanguageTag("pt-BR"));
        List<ProtetorListagemResponse> encontrados = todos.stream()
                .filter(protetor -> passaNosFiltros(protetor, filtro))
                .sorted(Comparator.comparing(ProtetorListagemResponse::nome, alfabetica)
                        .thenComparing(protetor -> protetor.id().toString()))
                .toList();

        int pagina = filtro.paginaPedida();
        int tamanho = filtro.tamanhoPedido();
        int total = encontrados.size();
        int inicio = (int) Math.min((long) pagina * tamanho, total);
        int fim = Math.min(inicio + tamanho, total);
        int totalPaginas = (total + tamanho - 1) / tamanho;
        return new PaginaResponse<>(List.copyOf(encontrados.subList(inicio, fim)), pagina, tamanho, total,
                totalPaginas);
    }

    private static ProtetorListagemResponse item(UUID id, TipoConta tipo, String nome, Endereco endereco, String foto,
                                                 Map<UUID, Long> disponiveis, Map<UUID, Long> adocoes) {
        return new ProtetorListagemResponse(id, tipo, nome, endereco.getCidade(), endereco.getEstado(),
                disponiveis.getOrDefault(id, 0L), adocoes.getOrDefault(id, 0L), foto);
    }

    private static Map<UUID, Long> porProtetor(List<ContagemPorProtetor> contagens) {
        Map<UUID, Long> porId = new HashMap<>();
        for (ContagemPorProtetor contagem : contagens) {
            porId.put(contagem.protetorId(), contagem.total());
        }
        return porId;
    }

    // Filtro vazio não filtra. Estado é a sigla inteira; cidade e nome valem por parte do texto
    private static boolean passaNosFiltros(ProtetorListagemResponse protetor, ProtetorFiltroRequest filtro) {
        return (vazio(filtro.getEstado()) || protetor.estado().equalsIgnoreCase(filtro.getEstado().strip()))
                && (vazio(filtro.getCidade()) || semAcento(protetor.cidade()).contains(semAcento(filtro.getCidade())))
                && (vazio(filtro.getBusca()) || semAcento(protetor.nome()).contains(semAcento(filtro.getBusca())));
    }

    private static boolean vazio(String texto) {
        return texto == null || texto.isBlank();
    }

    // "São Paulo" vira "sao paulo": a busca não liga pra maiúscula nem acento
    private static String semAcento(String texto) {
        return Normalizer.normalize(texto.strip(), Normalizer.Form.NFD)
                .replaceAll("\\p{M}", "")
                .toLowerCase(Locale.ROOT);
    }
}
