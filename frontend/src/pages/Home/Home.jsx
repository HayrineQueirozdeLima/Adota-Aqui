import { useCallback, useEffect, useState } from "react";
import { useLocation } from "react-router-dom";
import Apresentacao from "../../components/Apresentacao/Apresentacao";
import ComoFunciona from "../../components/ComoFunciona/ComoFunciona";
import VitrineAnimais from "../../components/VitrineAnimais/VitrineAnimais";
import { useTituloDaPagina } from "../../hooks/useTituloDaPagina";

// Home (Figma: Home): apresentação, vitrine e como funciona a adoção. O rodapé vem do Layout
export default function Home() {
  const { hash, key } = useLocation();
  const [vitrinePronta, setVitrinePronta] = useState(false);
  const marcarVitrinePronta = useCallback(() => setVitrinePronta(true), []);
  useTituloDaPagina(null);

  // O link "Como adotar" do rodapé chega com #como-funciona: rola até a seção.
  // Rola de novo quando a vitrine carrega, porque os cards empurram a seção pra baixo
  useEffect(() => {
    if (!hash) return;
    document
      .getElementById(hash.slice(1))
      ?.scrollIntoView?.({ behavior: "smooth" });
  }, [hash, key, vitrinePronta]);

  return (
    <main>
      <Apresentacao />
      <section
        aria-labelledby="vitrine-titulo"
        className="mx-auto w-full max-w-[1440px] px-5 py-8 md:px-14"
      >
        <h2 id="vitrine-titulo" className="sr-only">
          Animais para adoção
        </h2>
        <VitrineAnimais aoCarregar={marcarVitrinePronta} />
      </section>
      <ComoFunciona />
    </main>
  );
}
