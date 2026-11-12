package com.adotaaqui.config;

import com.adotaaqui.model.Animal;
import com.adotaaqui.repository.AnimalRepository;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.boot.ApplicationArguments;
import org.springframework.boot.ApplicationRunner;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

// Quando o animal ganhou cidade e estado próprios, os animais que já estavam no banco ficaram com as colunas vazias
// (o Hibernate cria a coluna nova, mas não sabe o que pôr nela). Toda vez que o back sobe, isto aqui procura
// animal sem local e coloca o endereço de quem cadastrou, que era o local que ele já mostrava antes.
// Na primeira subida depois da mudança acerta os animais antigos; nas próximas não acha ninguém e não faz nada.
// A gente não usa Flyway (as tabelas saem das entidades), por isso a "migração" dos dados ficou aqui
@Component
public class LocalDosAnimaisAntigos implements ApplicationRunner {

    private static final Logger log = LoggerFactory.getLogger(LocalDosAnimaisAntigos.class);

    private final AnimalRepository animais;

    public LocalDosAnimaisAntigos(AnimalRepository animais) {
        this.animais = animais;
    }

    @Override
    @Transactional
    public void run(ApplicationArguments argumentos) {
        List<Animal> semLocal = animais.findByCidadeIsNullOrEstadoIsNull();
        if (semLocal.isEmpty()) return;
        // Não precisa de save: dentro da transação o JPA percebe o que mudou e grava no fim
        semLocal.forEach(Animal::preencherLocalSeFaltar);
        log.info("Animais antigos sem local: {} ficaram com o endereço de quem cadastrou", semLocal.size());
    }
}
