import { useEffect, useState } from "react";
import Botao from "../Botao/Botao";
import { artigoDefinido, localDoAnimal } from "../../utils/rotulos";

// Tempo que o "Link copiado" fica no botão antes de voltar pra "Copiar link"
const AVISO_DE_COPIADO_MS = 3000;

// Quadro "Ajude a Mel a achar um lar", no perfil do animal.
// WhatsApp e copiar o link funcionam em qualquer navegador. "Outros apps" abre o menu de
// compartilhar do sistema (Instagram, Telegram...), e só aparece no navegador que tem esse menu
export default function CompartilharAnimal({ animal }) {
  const [copiado, setCopiado] = useState(false);
  const [erroAoCopiar, setErroAoCopiar] = useState(false);
  const { id, nome, sexo } = animal;
  const a = artigoDefinido(sexo);
  const endereco = `${window.location.origin}/animais/${id}`;
  const texto = `Conheça ${a} ${nome}, que procura um lar em ${localDoAnimal(animal)}, no Adota Aqui:`;
  const temMenuDoSistema = typeof navigator.share === "function";

  useEffect(() => {
    if (!copiado) return undefined;
    const espera = setTimeout(() => setCopiado(false), AVISO_DE_COPIADO_MS);
    return () => clearTimeout(espera);
  }, [copiado]);

  async function copiar() {
    try {
      await navigator.clipboard.writeText(endereco);
      setErroAoCopiar(false);
      setCopiado(true);
    } catch {
      // Navegador sem permissão pra copiar: o link aparece escrito pra pessoa copiar na mão
      setErroAoCopiar(true);
    }
  }

  async function abrirMenuDoSistema() {
    try {
      await navigator.share({ title: `${nome} | Adota Aqui`, text: texto, url: endereco });
    } catch {
      // A pessoa fechou o menu sem escolher nada: não tem o que avisar
    }
  }

  return (
    <section
      aria-labelledby="compartilhar-animal"
      className="rounded-[16px] border border-borda-sutil bg-fundo-superficie p-5"
    >
      <h2
        id="compartilhar-animal"
        className="font-titulo text-item font-semibold text-texto-principal"
      >
        Ajude {a} {nome} a achar um lar
      </h2>
      <p className="mt-1 text-compacto text-texto-secundario">
        Mande o perfil pra quem pode adotar ou ajudar a divulgar.
      </p>

      <div className="mt-4 grid grid-cols-2 gap-2">
        <Botao
          variante="secundario"
          href={`https://wa.me/?text=${encodeURIComponent(`${texto} ${endereco}`)}`}
          className="col-span-2"
        >
          Enviar no WhatsApp
        </Botao>
        <Botao
          variante="neutro"
          onClick={copiar}
          className={temMenuDoSistema ? "" : "col-span-2"}
        >
          {copiado ? "Link copiado" : "Copiar link"}
        </Botao>
        {temMenuDoSistema && (
          <Botao variante="neutro" onClick={abrirMenuDoSistema}>
            Outros apps
          </Botao>
        )}
      </div>

      {/* O texto do botão muda, e o leitor de tela fica sabendo por aqui */}
      <p role="status" className="sr-only">
        {copiado ? "Link copiado" : ""}
      </p>
      {erroAoCopiar && (
        <p role="alert" className="mt-3 break-all text-compacto text-texto-secundario">
          Não deu pra copiar sozinho. O link é {endereco}
        </p>
      )}
    </section>
  );
}
