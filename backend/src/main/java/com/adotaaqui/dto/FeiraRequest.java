package com.adotaaqui.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.Size;

import java.time.LocalDate;
import java.time.LocalTime;

// POST /api/feiras e PUT /api/feiras/{id}. Data no passado e fim antes do início, quem confere é o service
public class FeiraRequest {

    @NotBlank(message = "O título é obrigatório")
    @Size(min = 5, max = 120, message = "O título deve ter de 5 a 120 caracteres")
    private String titulo;

    // Opcional
    @Size(max = 1000, message = "A descrição pode ter no máximo 1000 caracteres")
    private String descricao;

    @NotNull(message = "Informe a data da feira")
    private LocalDate data;

    @NotNull(message = "Informe a hora em que a feira começa")
    private LocalTime horaInicio;

    @NotNull(message = "Informe a hora em que a feira termina")
    private LocalTime horaFim;

    @NotBlank(message = "Informe o nome do local")
    @Size(max = 120, message = "O nome do local deve ter no máximo 120 caracteres")
    private String local;

    @NotBlank(message = "Informe o endereço")
    @Size(max = 200, message = "O endereço deve ter no máximo 200 caracteres")
    private String endereco;

    @NotBlank(message = "Informe a cidade")
    @Size(max = 80, message = "A cidade deve ter no máximo 80 caracteres")
    private String cidade;

    @NotBlank(message = "Escolha o estado")
    @Pattern(regexp = "AC|AL|AP|AM|BA|CE|DF|ES|GO|MA|MT|MS|MG|PA|PB|PR|PE|PI|RJ|RN|RS|RO|RR|SC|SP|SE|TO",
            message = "Escolha um estado válido")
    private String estado;

    public String getTitulo() {
        return titulo;
    }

    public void setTitulo(String titulo) {
        this.titulo = titulo;
    }

    public String getDescricao() {
        return descricao;
    }

    public void setDescricao(String descricao) {
        this.descricao = descricao;
    }

    public LocalDate getData() {
        return data;
    }

    public void setData(LocalDate data) {
        this.data = data;
    }

    public LocalTime getHoraInicio() {
        return horaInicio;
    }

    public void setHoraInicio(LocalTime horaInicio) {
        this.horaInicio = horaInicio;
    }

    public LocalTime getHoraFim() {
        return horaFim;
    }

    public void setHoraFim(LocalTime horaFim) {
        this.horaFim = horaFim;
    }

    public String getLocal() {
        return local;
    }

    public void setLocal(String local) {
        this.local = local;
    }

    public String getEndereco() {
        return endereco;
    }

    public void setEndereco(String endereco) {
        this.endereco = endereco;
    }

    public String getCidade() {
        return cidade;
    }

    public void setCidade(String cidade) {
        this.cidade = cidade;
    }

    public String getEstado() {
        return estado;
    }

    public void setEstado(String estado) {
        this.estado = estado;
    }
}
