package com.adotaaqui.model;

import com.adotaaqui.model.enums.Especie;
import com.adotaaqui.model.enums.NivelEnergia;
import com.adotaaqui.model.enums.Porte;
import com.adotaaqui.model.enums.Raca;
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
import jakarta.persistence.OrderColumn;
import jakarta.persistence.PrePersist;
import jakarta.persistence.PreUpdate;
import jakarta.persistence.Table;
import org.hibernate.annotations.Check;

import java.time.LocalDate;
import java.util.ArrayList;
import java.util.List;
import java.util.UUID;

@Entity
@Table(name = "animal")
// Regra do xor: o animal tem que ter exatamente um dono, ou usuario_id ou abrigo_id.
// Deixei no banco também, além do Java, pra ninguém conseguir gravar errado nem por fora do sistema.
@Check(constraints = "(usuario_id IS NOT NULL AND abrigo_id IS NULL) OR (usuario_id IS NULL AND abrigo_id IS NOT NULL)")
public class Animal {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    @Column(nullable = false, length = 80)
    private String nome;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 10)
    private Especie especie;

    // A raça tem que ser da mesma espécie (ex.: nada de gato LABRADOR).
    // Quem barra isso é o service, usando raca.pertenceA(especie), e responde 400.
    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 40)
    private Raca raca;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 10)
    private SexoAnimal sexo;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 20)
    private Porte porte;

    // Em kg. É o único campo opcional do cadastro (RF04).
    private Double peso;

    // Convivência: se o protetor não sabe, fica NAO_TESTADO
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

    // O RF04 fala em "idade", mas a gente guarda a data de nascimento estimada,
    // porque idade muda com o tempo e a data não. O front pode perguntar a idade e converter.
    @Column(name = "data_nasc_estimada", nullable = false)
    private LocalDate dataNascEstimada;

    @Column(name = "is_castrado", nullable = false)
    private Boolean castrado = false;

    // A trajetória do animal (resgate, como ele é etc.)
    @Column(nullable = false, columnDefinition = "TEXT")
    private String historia;

    // Só as URLs das fotos ficam no banco, as imagens em si ficam no S3 (RF16).
    // A ordem importa: a primeira foto da lista é a capa.
    @ElementCollection
    @CollectionTable(name = "animal_foto", joinColumns = @JoinColumn(name = "animal_id"))
    @OrderColumn(name = "ordem")
    @Column(name = "url", nullable = false, length = 500)
    private List<String> fotos = new ArrayList<>();

    @Enumerated(EnumType.STRING)
    @Column(name = "status_adocao", nullable = false, length = 20)
    private StatusAdocao statusAdocao = StatusAdocao.DISPONIVEL;

    // Quem cadastrou o animal (o "protetor"): um desses dois fica preenchido e o outro fica nulo
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "usuario_id")
    private Usuario usuario;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "abrigo_id")
    private Abrigo abrigo;

    // Remover o animal apaga junto as vacinas e os interesses dele (UC05 FA03).
    // As fotos já vão junto sozinhas, porque são @ElementCollection.
    @OneToMany(mappedBy = "animal", cascade = CascadeType.ALL, orphanRemoval = true)
    private List<Vacina> vacinas = new ArrayList<>();

    @OneToMany(mappedBy = "animal", cascade = CascadeType.ALL, orphanRemoval = true)
    private List<Interesse> interesses = new ArrayList<>();

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

    // O animal não tem estado próprio, ele "herda" o estado de quem cadastrou (RF14).
    // É isso que a listagem compara com o estado do Usuario logado.
    public String getEstado() {
        Endereco endereco = null;
        if (usuario != null) {
            endereco = usuario.getEndereco();
        } else if (abrigo != null) {
            endereco = abrigo.getEndereco();
        }
        return endereco != null ? endereco.getEstado() : null;
    }

    // Use estes dois métodos em vez de mexer direto na lista,
    // assim a vacina já fica ligada ao animal certo.
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

    public String getNome() {
        return nome;
    }

    public void setNome(String nome) {
        this.nome = nome;
    }

    public Especie getEspecie() {
        return especie;
    }

    public void setEspecie(Especie especie) {
        this.especie = especie;
    }

    public Raca getRaca() {
        return raca;
    }

    public void setRaca(Raca raca) {
        this.raca = raca;
    }

    public SexoAnimal getSexo() {
        return sexo;
    }

    public void setSexo(SexoAnimal sexo) {
        this.sexo = sexo;
    }

    public Porte getPorte() {
        return porte;
    }

    public void setPorte(Porte porte) {
        this.porte = porte;
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

    public List<String> getFotos() {
        return fotos;
    }

    public void setFotos(List<String> fotos) {
        this.fotos = fotos;
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

    public List<Interesse> getInteresses() {
        return interesses;
    }
}
