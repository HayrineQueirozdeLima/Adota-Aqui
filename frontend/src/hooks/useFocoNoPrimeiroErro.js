import { useEffect } from 'react';

// Depois de uma tentativa de envio com erro, leva o foco pro primeiro campo com problema.
// Quem usa teclado ou leitor de tela cai direto no que precisa corrigir.
// "tentativas" é um contador que a tela aumenta a cada envio que deu erro.
export function useFocoNoPrimeiroErro(refFormulario, tentativas) {
    useEffect(() => {
        if (tentativas === 0) return;
        refFormulario.current?.querySelector('[aria-invalid="true"]')?.focus();
    }, [refFormulario, tentativas]);
}