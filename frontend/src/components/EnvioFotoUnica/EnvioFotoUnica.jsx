import { useId, useState } from "react";
import { useAuth } from "../../contexts/AuthContext";
import { enviarFoto } from "../../services/fotos";
import {
  LIMITE_DA_FOTO_EM_BYTES,
  TIPOS_DE_FOTO,
} from "../../utils/formularioAnimal";

// Uma foto só (a do depoimento e a capa do artigo do blog). Vai pro POST /api/fotos, como as fotos dos animais,
// e o formulário guarda só a URL que volta. aoMudar recebe a URL nova, ou null quando a pessoa tira a foto
export default function EnvioFotoUnica({ rotulo, foto, aoMudar, descricao }) {
  const { token, sair } = useAuth();
  const id = useId();
  const idProblema = `${id}-problema`;
  const [enviando, setEnviando] = useState(false);
  const [problema, setProblema] = useState("");

  async function escolher(evento) {
    const arquivo = evento.target.files[0];
    // limpa o campo, pra dar pra escolher o mesmo arquivo de novo depois
    evento.target.value = "";
    if (!arquivo) return;
    // Confere antes de enviar, pra não gastar internet com arquivo que o back vai recusar
    if (!TIPOS_DE_FOTO.includes(arquivo.type)) {
      setProblema("Envie uma imagem JPG, PNG ou WEBP.");
      return;
    }
    if (arquivo.size > LIMITE_DA_FOTO_EM_BYTES) {
      setProblema("A imagem pode ter no máximo 5 MB.");
      return;
    }
    setProblema("");
    setEnviando(true);
    try {
      const { url } = await enviarFoto(arquivo, token);
      aoMudar(url);
    } catch (erroDaApi) {
      if (erroDaApi.status === 401) {
        sair();
        return;
      }
      setProblema(erroDaApi.message);
    } finally {
      setEnviando(false);
    }
  }

  return (
    <div>
      <p className="mb-[7px] font-titulo text-campo font-semibold text-texto-principal">
        {rotulo}
      </p>
      {foto ? (
        <img
          src={foto}
          alt={descricao}
          className="aspect-[4/3] w-full max-w-[360px] rounded-[12px] object-cover"
        />
      ) : (
        <div className="flex aspect-[4/3] w-full max-w-[360px] items-center justify-center rounded-[12px] bg-marca-roxo-suave px-4 text-center text-legenda text-texto-secundario">
          Nenhuma foto ainda
        </div>
      )}
      <div className="mt-3 flex flex-wrap items-center gap-3">
        <label
          htmlFor={id}
          className="inline-flex cursor-pointer items-center rounded-[10px] border-[1.5px] border-marca-roxo px-4 py-2.5 font-titulo font-semibold text-campo text-marca-roxo has-[:focus-visible]:outline has-[:focus-visible]:outline-2 has-[:focus-visible]:outline-offset-2 has-[:focus-visible]:outline-marca-roxo"
        >
          {foto ? "Trocar a foto" : "Escolher uma foto"}
          <input
            id={id}
            type="file"
            accept={TIPOS_DE_FOTO.join(",")}
            onChange={escolher}
            disabled={enviando}
            aria-describedby={problema ? idProblema : undefined}
            className="sr-only"
          />
        </label>
        {foto && (
          <button
            type="button"
            onClick={() => aoMudar(null)}
            className="min-h-6 text-legenda font-semibold text-status-erro-texto underline"
          >
            Tirar a foto
          </button>
        )}
        {enviando && (
          <span role="status" className="text-legenda text-texto-secundario">
            Enviando a foto...
          </span>
        )}
      </div>
      <p className="mt-2 text-legenda text-texto-secundario">
        JPG, PNG ou WEBP até 5 MB.
      </p>
      {problema && (
        <p
          id={idProblema}
          role="alert"
          className="mt-1 text-legenda text-status-erro-texto"
        >
          {problema}
        </p>
      )}
    </div>
  );
}
