package com.adotaaqui.model.enums;

// Caminho de um interesse (ver a máquina de estados no documento de diagramas):
// PENDENTE -> EM_CONTATO -> APROVADO ou DESCONTINUADO.
// Do PENDENTE também dá pra ir direto pra APROVADO ou DESCONTINUADO.
// APROVADO e DESCONTINUADO são finais, não voltam.
//
// Quando o candidato desiste, o interesse é apagado, por isso não existe status de desistência.
public enum StatusInteresse {
    PENDENTE,
    EM_CONTATO,
    APROVADO,
    DESCONTINUADO
}
