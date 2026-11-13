package com.adotaaqui.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.Size;

import java.util.List;

/** O que entra e sai das rotas da IA (docs/api.md, seção 15). */
public final class IaResponses {

    private IaResponses() {}

    // GET /api/ia/disponivel: se a chave está configurada no servidor. O front só mostra os botões de IA com true
    public record Disponivel(boolean disponivel) {}

    // POST /api/ia/descricao: o texto sugerido, que o protetor revisa antes de salvar
    public record Descricao(String texto) {}

    // POST /api/ia/sugestoes: a rotina da pessoa. O estado só vale pra visitante; pessoa logada usa o do perfil
    public record PedidoDeSugestoes(
            @NotBlank(message = "Conte um pouco da sua rotina")
            @Size(min = 15, max = 600, message = "Conte a sua rotina em 15 a 600 caracteres")
            String rotina,
            @Pattern(regexp = "AC|AL|AP|AM|BA|CE|DF|ES|GO|MA|MT|MS|MG|PA|PB|PR|PE|PI|RJ|RN|RS|RO|RR|SC|SP|SE|TO",
                    message = "Escolha um estado válido")
            String estado) {}

    // Até 3 animais do site, cada um com o motivo, e um conselho curto pra adoção responsável
    public record Sugestoes(List<Sugestao> sugestoes, String conselho) {}

    public record Sugestao(AnimalListagemResponse animal, String motivo) {}
}
