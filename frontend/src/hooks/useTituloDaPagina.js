import { useEffect } from 'react';

// Muda o título da aba do navegador conforme a página: "Meus animais | Adota Aqui".
// Ajuda quem tem várias abas abertas, e o leitor de tela lê o título quando a página muda.
// Sem título (ex.: enquanto carrega), fica só "Adota Aqui"
export function useTituloDaPagina(titulo) {
    useEffect(() => {
        document.title = titulo ? `${titulo} | Adota Aqui` : 'Adota Aqui';
    }, [titulo]);
}