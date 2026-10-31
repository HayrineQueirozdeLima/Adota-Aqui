package com.adotaaqui.dto;

import org.springframework.data.domain.Page;

import java.util.List;
import java.util.function.Function;

// Uma página de resultados, igual pra toda listagem paginada da API.
// "pagina" começa em 0, e "totalItens" conta tudo o que a busca achou, não só esta página
public record PaginaResponse<T>(List<T> itens, int pagina, int tamanho, long totalItens, int totalPaginas) {

    public static <E, T> PaginaResponse<T> de(Page<E> pagina, Function<E, T> converter) {
        return new PaginaResponse<>(pagina.getContent().stream().map(converter).toList(),
                pagina.getNumber(), pagina.getSize(), pagina.getTotalElements(), pagina.getTotalPages());
    }
}
