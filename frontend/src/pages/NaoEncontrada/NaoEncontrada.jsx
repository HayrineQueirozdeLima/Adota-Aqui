import AvisoPagina from "../../components/AvisoPagina/AvisoPagina";
import Botao from "../../components/Botao/Botao";
import foto from "../../assets/fotos/pagina-nao-encontrada.webp";

// Qualquer endereço que não existe cai aqui (AppRoutes, rota "*")
export default function NaoEncontrada() {
  return (
    <AvisoPagina titulo="Página não encontrada" imagem={foto}>
      <p>O endereço pode estar errado ou a página mudou de lugar.</p>
      <div className="mt-5 flex flex-col gap-3 sm:flex-row sm:justify-center">
        <Botao para="/animais">Ver animais disponíveis</Botao>
        <Botao variante="secundario" para="/">
          Ir para a página inicial
        </Botao>
      </div>
    </AvisoPagina>
  );
}
