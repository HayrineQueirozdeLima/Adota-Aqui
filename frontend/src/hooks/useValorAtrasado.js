import { useEffect, useState } from "react";

// Devolve o valor só depois que ele fica "espera" milissegundos sem mudar
// Na vitrine quem digita "porto velho" dispara uma busca só, no fim, e não uma por letra
// O primeiro valor sai na hora, sem esperar.
export function useValorAtrasado(valor, espera) {
    const [atrasado, setAtrasado] = useState(valor);

    useEffect(() => {
        const timer = setTimeout(() => setAtrasado(valor), espera);
        // mudou de novo antes do tempo acabar? cancela e começa a contar outra vez
        return () => clearTimeout(timer);
    }, [valor, espera]);

    return atrasado;
}