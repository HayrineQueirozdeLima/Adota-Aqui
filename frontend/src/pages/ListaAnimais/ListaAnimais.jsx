import { useSearchParams } from "react-router-dom";
import VitrineAnimais from "../../components/VitrineAnimais/VitrineAnimais";
import { useTituloDaPagina } from "../../hooks/useTituloDaPagina";

export default function ListaAnimais() {
  useTituloDaPagina("Animais para adoção");
  // O "Ver animais" da página de abrigos e protetores chega com ?busca=nome do protetor.
  // O key recomeça a vitrine se a busca da URL mudar com a página já aberta
  const [parametros] = useSearchParams();
  const busca = parametros.get("busca") ?? "";

  return (
    <main className="mx-auto w-full max-w-[1440px] px-5 py-8 md:px-14">
      <h1 className="mb-6 font-titulo font-semibold text-display text-texto-principal">
        Animais para adoção
      </h1>
      {/* Aqui o nome de cada animal é h2, logo abaixo do h1 da página */}
      <VitrineAnimais key={busca} nivelDoTitulo={2} buscaInicial={busca} />
    </main>
  );
}
