package com.adotaaqui.model.enums;

// Todo animal nasce DISPONIVEL. Ele só vira ADOTADO quando o protetor aprova
// um interesse (RF10). Se a adoção não der certo, o protetor volta ele pra
// DISPONIVEL pela tela de edição (UC05 FA04).
public enum StatusAdocao {
    DISPONIVEL,
    ADOTADO
}
