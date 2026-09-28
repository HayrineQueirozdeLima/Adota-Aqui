package com.adotaaqui.model;

import jakarta.persistence.Column;
import jakarta.persistence.Embeddable;

// O endereço não tem tabela própria. Por ser @Embeddable, essas colunas ficam
// dentro da tabela de quem usa (usuario e abrigo).
//
// A pessoa digita só o CEP e o número. O resto vem do ViaCEP.
// O estado é importante: é ele que define quais animais o Usuario vê na listagem (RF14).
@Embeddable
public class Endereco {

    @Column(nullable = false, length = 8)
    private String cep;

    // UF com 2 letras, ex.: RO
    @Column(nullable = false, length = 2)
    private String estado;

    @Column(nullable = false, length = 80)
    private String cidade;

    // Logradouro e bairro podem vir vazios, tem CEP de cidade pequena que não traz isso
    @Column(length = 120)
    private String logradouro;

    // Texto e não número, porque aceita "s/n" e complemento
    @Column(nullable = false, length = 10)
    private String numero;

    @Column(length = 80)
    private String bairro;

    public Endereco() {
    }

    public String getCep() {
        return cep;
    }

    public void setCep(String cep) {
        this.cep = cep;
    }

    public String getEstado() {
        return estado;
    }

    public void setEstado(String estado) {
        this.estado = estado;
    }

    public String getCidade() {
        return cidade;
    }

    public void setCidade(String cidade) {
        this.cidade = cidade;
    }

    public String getLogradouro() {
        return logradouro;
    }

    public void setLogradouro(String logradouro) {
        this.logradouro = logradouro;
    }

    public String getNumero() {
        return numero;
    }

    public void setNumero(String numero) {
        this.numero = numero;
    }

    public String getBairro() {
        return bairro;
    }

    public void setBairro(String bairro) {
        this.bairro = bairro;
    }
}
