package com.adotaaqui.model.enums;

// Os assuntos das dicas que os protetores publicam (blog de dicas)
public enum CategoriaDica {
    ADOCAO_RESPONSAVEL("Adoção responsável"),
    PRIMEIROS_DIAS("Primeiros dias em casa"),
    SAUDE("Saúde e vacinas"),
    COMPORTAMENTO("Comportamento"),
    ALIMENTACAO("Alimentação");

    private final String nome;

    CategoriaDica(String nome) {
        this.nome = nome;
    }

    public String getNome() {
        return nome;
    }
}
