import { useEffect } from "react";
import { useLocation, useNavigationType } from "react-router-dom";

// O React Router troca de página sem recarregar, e o navegador mantinha a rolagem da página anterior:
// quem clicava num link do rodapé caía no meio da página nova. Aqui, toda página nova abre no topo.
// Fica de fora:
//   o endereço com #, como o "Como adotar" do rodapé, que rola até a seção (pages/Home)
//   o voltar e o avançar do navegador (POP), que devolvem a pessoa onde ela estava
export default function RolarParaOTopo() {
  const { pathname, hash } = useLocation();
  const tipo = useNavigationType();

  useEffect(() => {
    if (!hash && tipo !== "POP") window.scrollTo(0, 0);
  }, [pathname, hash, tipo]);

  return null;
}
