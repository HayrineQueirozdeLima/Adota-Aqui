package com.adotaaqui.dto;

import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.Min;

// Os parâmetros ?pagina= e ?tamanho= das listagens paginadas. A primeira página é a 0
public class PaginaRequest {

    @Min(value = 0, message = "A página deve ser 0 ou maior")
    private Integer pagina;

    @Min(value = 1, message = "O tamanho da página deve ser de 1 a 48")
    @Max(value = 48, message = "O tamanho da página deve ser de 1 a 48")
    private Integer tamanho;

    public Integer getPagina() {
        return pagina;
    }

    public void setPagina(Integer pagina) {
        this.pagina = pagina;
    }

    public Integer getTamanho() {
        return tamanho;
    }

    public void setTamanho(Integer tamanho) {
        this.tamanho = tamanho;
    }

    // Os valores que a busca usa, com o padrão quando o parâmetro não veio
    public int paginaPedida() {
        return pagina == null ? 0 : pagina;
    }

    public int tamanhoPedido() {
        return tamanho == null ? 12 : tamanho;
    }
}
