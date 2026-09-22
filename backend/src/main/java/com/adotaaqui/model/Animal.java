package com.adotaaqui.model;

import com.adotaaqui.model.enums.NivelEnergia;
import com.adotaaqui.model.enums.SexoAnimal;
import com.adotaaqui.model.enums.StatusAdocao;
import com.adotaaqui.model.enums.StatusConvivencia;
import jakarta.persistence.CascadeType;
import jakarta.persistence.CollectionTable;
import jakarta.persistence.Column;
import jakarta.persistence.ElementCollection;
import jakarta.persistence.Entity;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
import jakarta.persistence.FetchType;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.OneToMany;
import jakarta.persistence.PrePersist;
import jakarta.persistence.PreUpdate;
import jakarta.persistence.Table;

import java.time.LocalDate;
import java.util.ArrayList;
import java.util.List;
import java.util.UUID;

@Entity
@Table(name = "animal")
public class Animal {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    @Column(nullable = false, length = 30)
    private String especie;

    @Column(nullable = false, length = 100)
    private String nome;

    @Column(nullable = false, length = 60)
    private String raca;

    @Column(nullable = false, length = 20)
    private String porte;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 10)
    private SexoAnimal sexo;

    private Double peso;

    @Enumerated(EnumType.STRING)
    @Column(name = "convivencia_crianca", nullable = false, length = 20)
    private StatusConvivencia convivenciaCrianca = StatusConvivencia.NAO_TESTADO;

    @Enumerated(EnumType.STRING)
    @Column(name = "convivencia_gato", nullable = false, length = 20)
    private StatusConvivencia convivenciaGato = StatusConvivencia.NAO_TESTADO;

    @Enumerated(EnumType.STRING)
    @Column(name = "convivencia_cao", nullable = false, length = 20)
    private StatusConvivencia convivenciaCao = StatusConvivencia.NAO_TESTADO;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 20)
    private NivelEnergia energia;

    @Column(name = "data_nasc_estimada", nullable = false)
    private LocalDate dataNascEstimada;

    @Column(name = "is_castrado", nullable = false)
    private Boolean castrado = false;

    // RF04: breve descrição da trajetória do animal
    @Column(nullable = false, length = 500)
    private String historia;

    // RF16: o banco guarda somente as URLs das imagens
    @ElementCollection
    @CollectionTable(name = "animal_pictures", joinColumns = @JoinColumn(name = "animal_id"))
    @Column(name = "url", nullable = false, length = 500)
    private List<String> pictures = new ArrayList<>();

    @Enumerated(EnumType.STRING)
    @Column(name = "status_adocao", nullable = false, length = 20)
    private StatusAdocao statusAdocao = StatusAdocao.DISPONIVEL;

    // Protetor responsável: Usuario OU Abrigo, nunca os dois ({xor})
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "usuario_id")
    private Usuario usuario;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "abrigo_id")
    private Abrigo abrigo;

    @OneToMany(mappedBy = "animal", cascade = CascadeType.ALL, orphanRemoval = true)
    private List<Vacina> vacinas = new ArrayList<>();

    public Animal() {
    }

    @PrePersist
    @PreUpdate
    private void validarProtetor() {
        if ((usuario == null) == (abrigo == null)) {
            throw new IllegalStateException(
                "O animal deve ter exatamente um protetor: um Usuario ou um Abrigo."
            );
        }
    }

    // RF14: o estado do animal é herdado do protetor que o cadastrou
    public String getEstado() {
        Endereco endereco = null;
        if (usuario != null) {
            endereco = usuario.getEndereco();
        } else if (abrigo != null) {
            endereco = abrigo.getEndereco();
        }
        return endereco != null ? endereco.getEstado() : null;
    }

    public void adicionarVacina(Vacina vacina) {
        vacina.setAnimal(this);
        vacinas.add(vacina);
    }

    public void removerVacina(Vacina vacina) {
        vacinas.remove(vacina);
        vacina.setAnimal(null);
    }

    public UUID getId() {
        return id;
    }

    public String getEspecie() {
        return especie;
    }

    public void setEspecie(String especie) {
        this.especie = especie;
    }

    public String getNome() {
        return nome;
    }

    public void setNome(String nome) {
        this.nome = nome;
    }

    public String getRaca() {
        return raca;
    }

    public void setRaca(String raca) {
        this.raca = raca;
    }

    public String getPorte() {
        return porte;
    }

    public void setPorte(String porte) {
        this.porte = porte;
    }

    public SexoAnimal getSexo() {
        return sexo;
    }

    public void setSexo(SexoAnimal sexo) {
        this.sexo = sexo;
    }

    public Double getPeso() {
        return peso;
    }

    public void setPeso(Double peso) {
        this.peso = peso;
    }

    public StatusConvivencia getConvivenciaCrianca() {
        return convivenciaCrianca;
    }

    public void setConvivenciaCrianca(StatusConvivencia convivenciaCrianca) {
        this.convivenciaCrianca = convivenciaCrianca;
    }

    public StatusConvivencia getConvivenciaGato() {
        return convivenciaGato;
    }

    public void setConvivenciaGato(StatusConvivencia convivenciaGato) {
        this.convivenciaGato = convivenciaGato;
    }

    public StatusConvivencia getConvivenciaCao() {
        return convivenciaCao;
    }

    public void setConvivenciaCao(StatusConvivencia convivenciaCao) {
        this.convivenciaCao = convivenciaCao;
    }

    public NivelEnergia getEnergia() {
        return energia;
    }

    public void setEnergia(NivelEnergia energia) {
        this.energia = energia;
    }

    public LocalDate getDataNascEstimada() {
        return dataNascEstimada;
    }

    public void setDataNascEstimada(LocalDate dataNascEstimada) {
        this.dataNascEstimada = dataNascEstimada;
    }

    public Boolean getCastrado() {
        return castrado;
    }

    public void setCastrado(Boolean castrado) {
        this.castrado = castrado;
    }

    public String getHistoria() {
        return historia;
    }

    public void setHistoria(String historia) {
        this.historia = historia;
    }

    public List<String> getPictures() {
        return pictures;
    }

    public void setPictures(List<String> pictures) {
        this.pictures = pictures;
    }

    public StatusAdocao getStatusAdocao() {
        return statusAdocao;
    }

    public void setStatusAdocao(StatusAdocao statusAdocao) {
        this.statusAdocao = statusAdocao;
    }

    public Usuario getUsuario() {
        return usuario;
    }

    public void setUsuario(Usuario usuario) {
        this.usuario = usuario;
    }

    public Abrigo getAbrigo() {
        return abrigo;
    }

    public void setAbrigo(Abrigo abrigo) {
        this.abrigo = abrigo;
    }

    public List<Vacina> getVacinas() {
        return vacinas;
    }
}
