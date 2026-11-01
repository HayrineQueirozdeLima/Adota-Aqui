package com.adotaaqui.model.enums;

// Os assuntos dos artigos que os protetores publicam (blog para tutores)
public enum CategoriaArtigo {
    ADOCAO_RESPONSAVEL("Adoção responsável"),
    PRIMEIROS_DIAS("Primeiros dias em casa"),
    SAUDE("Saúde e vacinas"),
    COMPORTAMENTO("Comportamento"),
    ALIMENTACAO("Alimentação");

    private final String nome;

    CategoriaArtigo(String nome) {
        this.nome = nome;
    }

    public String getNome() {
        return nome;
    }
}
