import VitrineAnimais from "../../components/VitrineAnimais/VitrineAnimais";
import { useTituloDaPagina } from "../../hooks/useTituloDaPagina";

export default function ListaAnimais() {
  useTituloDaPagina("Animais para adoção");
  return (
    <main className="mx-auto w-full max-w-[1440px] px-5 py-8 md:px-14">
      <h1 className="mb-6 font-titulo font-semibold text-display text-texto-principal">
        Animais para adoção
      </h1>
      {/* Aqui o nome de cada animal é h2, logo abaixo do h1 da página */}
      <VitrineAnimais nivelDoTitulo={2} />
    </main>
  );
}
