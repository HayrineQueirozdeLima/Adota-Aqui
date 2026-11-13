import { requisicao } from './api';

// Ajudas com IA (docs/api.md, seção 15). A IA só funciona com a chave configurada no servidor:
// sem ela, o GET /api/ia/disponivel responde { disponivel: false } e o site esconde os botões

// GET /api/ia/disponivel
export function iaDisponivel() {
    return requisicao('/api/ia/disponivel');
}

// POST /api/ia/descricao: o que o protetor preencheu no formulário (formularioParaIa) e devolve { texto }
export function escreverDescricao(dados, token) {
    return requisicao('/api/ia/descricao', { metodo: 'POST', corpo: dados, token });
}

// POST /api/ia/sugestoes: { rotina, estado } e devolve { sugestoes: [{ animal, motivo }], conselho }.
// Pra quem está logado, o estado que vale é o do perfil (a API decide)
export function sugerirAnimais(pedido, token = null) {
    return requisicao('/api/ia/sugestoes', { metodo: 'POST', corpo: pedido, token });
}
