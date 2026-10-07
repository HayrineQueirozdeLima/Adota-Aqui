import { requisicao } from './api';

// POST /api/fotos (docs/api.md, seção 8): uma imagem por vez, no campo "arquivo".
// Devolve { url }, que vai depois na lista "fotos" do animal
export function enviarFoto(arquivo, token) {
    const formulario = new FormData();
    formulario.append('arquivo', arquivo);
    return requisicao('/api/fotos', { metodo: 'POST', corpo: formulario, token });
}