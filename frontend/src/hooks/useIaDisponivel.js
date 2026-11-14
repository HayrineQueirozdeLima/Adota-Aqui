import { useEffect, useState } from 'react';
import { iaDisponivel } from '../services/ia';

// Se a IA está ligada no servidor: null enquanto pergunta, depois true ou false.
// A resposta fica guardada enquanto a página está aberta, pra não perguntar de novo a cada tela.
// Se der erro, a IA fica escondida e a próxima tela pergunta de novo
let consulta = null;

export function useIaDisponivel() {
    const [disponivel, setDisponivel] = useState(null);

    useEffect(() => {
        let cancelado = false;
        if (!consulta) {
            consulta = iaDisponivel()
                .then((resposta) => resposta?.disponivel === true)
                .catch(() => {
                    consulta = null;
                    return false;
                });
        }
        consulta.then((ligada) => {
            if (!cancelado) setDisponivel(ligada);
        });
        return () => {
            cancelado = true;
        };
    }, []);

    return disponivel;
}

// Pros testes: cada teste começa sem a resposta guardada
export function esquecerIaDisponivel() {
    consulta = null;
}
