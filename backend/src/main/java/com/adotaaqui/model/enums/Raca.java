package com.adotaaqui.model.enums;

import java.util.Arrays;
import java.util.List;

// Lista de raças por espécie, igual ao dicionário de domínios.
// Cada raça sabe de qual espécie ela é, assim o sistema consegue barrar
// um cadastro de "gato labrador", por exemplo.
//
// Sem raça definida (SRD) e OUTRA existem nas duas espécies, por isso ganharam
// o sufixo _CAO e _GATO.
//
// Precisa de uma raça nova? É só acrescentar aqui. O GET /api/racas lê desta lista,
// então o front não precisa mudar nada.
public enum Raca {

    // Cães
    SRD_CAO(Especie.CAO, "Sem raça definida"),
    LABRADOR(Especie.CAO, "Labrador"),
    GOLDEN_RETRIEVER(Especie.CAO, "Golden Retriever"),
    PASTOR_ALEMAO(Especie.CAO, "Pastor Alemão"),
    POODLE(Especie.CAO, "Poodle"),
    SHIH_TZU(Especie.CAO, "Shih Tzu"),
    YORKSHIRE(Especie.CAO, "Yorkshire"),
    PINSCHER(Especie.CAO, "Pinscher"),
    PIT_BULL(Especie.CAO, "Pit Bull"),
    ROTTWEILER(Especie.CAO, "Rottweiler"),
    BULLDOG(Especie.CAO, "Bulldog"),
    BEAGLE(Especie.CAO, "Beagle"),
    BORDER_COLLIE(Especie.CAO, "Border Collie"),
    HUSKY_SIBERIANO(Especie.CAO, "Husky Siberiano"),
    LHASA_APSO(Especie.CAO, "Lhasa Apso"),
    MALTES(Especie.CAO, "Maltês"),
    DACHSHUND(Especie.CAO, "Dachshund"),
    SPITZ_ALEMAO(Especie.CAO, "Spitz Alemão"),
    BOXER(Especie.CAO, "Boxer"),
    CHIHUAHUA(Especie.CAO, "Chihuahua"),
    COCKER_SPANIEL(Especie.CAO, "Cocker Spaniel"),
    PUG(Especie.CAO, "Pug"),
    SCHNAUZER(Especie.CAO, "Schnauzer"),
    OUTRA_CAO(Especie.CAO, "Outra"),

    // Gatos
    SRD_GATO(Especie.GATO, "Sem raça definida"),
    SIAMES(Especie.GATO, "Siamês"),
    PERSA(Especie.GATO, "Persa"),
    ANGORA(Especie.GATO, "Angorá"),
    MAINE_COON(Especie.GATO, "Maine Coon"),
    RAGDOLL(Especie.GATO, "Ragdoll"),
    BENGAL(Especie.GATO, "Bengal"),
    SPHYNX(Especie.GATO, "Sphynx"),
    BRITISH_SHORTHAIR(Especie.GATO, "British Shorthair"),
    ABISSINIO(Especie.GATO, "Abissínio"),
    BIRMANES(Especie.GATO, "Birmanês"),
    OUTRA_GATO(Especie.GATO, "Outra");

    private final Especie especie;
    private final String nome;

    Raca(Especie especie, String nome) {
        this.especie = especie;
        this.nome = nome;
    }

    public Especie getEspecie() {
        return especie;
    }

    // Nome bonitinho pra mostrar na tela. O valor que vai pra API é o nome do enum.
    public String getNome() {
        return nome;
    }

    public boolean pertenceA(Especie especie) {
        return this.especie == especie;
    }

    // Usado pelo GET /api/racas?especie=...
    public static List<Raca> listarPorEspecie(Especie especie) {
        return Arrays.stream(values())
                .filter(raca -> raca.pertenceA(especie))
                .toList();
    }
}
