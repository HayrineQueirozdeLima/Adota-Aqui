package com.adotaaqui.service;

import com.adotaaqui.repository.AbrigoRepository;
import com.adotaaqui.repository.AnimalRepository;
import com.adotaaqui.repository.DepoimentoRepository;
import com.adotaaqui.repository.UsuarioRepository;
import com.adotaaqui.repository.ArtigoRepository;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Component;
import org.springframework.transaction.support.TransactionSynchronization;
import org.springframework.transaction.support.TransactionSynchronizationManager;

import java.util.Collection;
import java.util.List;
import java.util.Optional;

// Apaga do S3 as fotos que saíram de um animal (editado ou removido), de um depoimento, de um artigo ou de um perfil.
// Antes, o arquivo continuava no bucket pra sempre, ocupando espaço sem ninguém usar
@Component
public class LimpezaDeFotos {

    private static final Logger log = LoggerFactory.getLogger(LimpezaDeFotos.class);

    private final ArmazenamentoFotos armazenamento;
    private final FotoService fotos;
    private final AnimalRepository animais;
    private final DepoimentoRepository depoimentos;
    private final ArtigoRepository artigos;
    private final UsuarioRepository usuarios;
    private final AbrigoRepository abrigos;

    public LimpezaDeFotos(ArmazenamentoFotos armazenamento, FotoService fotos, AnimalRepository animais,
                          DepoimentoRepository depoimentos, ArtigoRepository artigos,
                          UsuarioRepository usuarios, AbrigoRepository abrigos) {
        this.armazenamento = armazenamento;
        this.fotos = fotos;
        this.animais = animais;
        this.depoimentos = depoimentos;
        this.artigos = artigos;
        this.usuarios = usuarios;
        this.abrigos = abrigos;
    }

    // Chamar dentro da transação, depois do flush, com as URLs que saíram.
    // Só apaga a foto que nenhum animal, depoimento, artigo ou perfil usa e que foi guardada pela própria API.
    // O arquivo só sai depois do commit: se a transação falhar, a foto continua lá
    public void apagarDepoisDeSalvar(Collection<String> urls) {
        List<String> chaves = urls.stream().distinct()
                .filter(url -> fotos.chaveDe(url).isPresent()
                        && !animais.algumAnimalUsaFoto(url) && !depoimentos.existsByFotoUrl(url)
                        && !artigos.existsByFotoCapa(url)
                        && !usuarios.existsByFotoUrl(url) && !abrigos.existsByFotoUrl(url))
                .map(fotos::chaveDe)
                .flatMap(Optional::stream)
                .toList();
        if (chaves.isEmpty()) return;
        if (TransactionSynchronizationManager.isSynchronizationActive()) {
            TransactionSynchronizationManager.registerSynchronization(new TransactionSynchronization() {
                @Override
                public void afterCommit() {
                    apagar(chaves);
                }
            });
        } else {
            apagar(chaves);
        }
    }

    private void apagar(List<String> chaves) {
        for (String chave : chaves) {
            try {
                armazenamento.apagar(chave);
            } catch (RuntimeException e) {
                // O animal já foi salvo: um arquivo que sobrou no bucket não atrapalha ninguém, só fica no log
                log.warn("Não foi possível apagar a foto {} do armazenamento: {}", chave, e.getMessage());
            }
        }
    }
}
