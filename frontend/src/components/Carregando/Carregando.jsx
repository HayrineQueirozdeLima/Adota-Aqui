import { useEffect, useState } from "react";

// Quanto tempo esperar antes de avisar que o servidor pode estar acordando
const ESPERA_PRA_AVISAR_MS = 4000;

// Mensagem de carregamento das telas que buscam na API.
// O servidor gratuito do Render "dorme" sem uso e leva até 1 minuto pra acordar:
// se a resposta demorar, a pessoa fica sabendo que não travou.
export default function Carregando({ texto }) {
  const [demorando, setDemorando] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => setDemorando(true), ESPERA_PRA_AVISAR_MS);
    return () => clearTimeout(timer);
  }, []);

  return (
    <div role="status" className="py-10 text-center">
      <p className="text-legenda text-texto-terciario">{texto}</p>
      {demorando && (
        <p className="mt-2 text-legenda text-texto-terciario">
          O servidor estava parado e está acordando. Isso pode levar até 1
          minuto.
        </p>
      )}
    </div>
  );
}
