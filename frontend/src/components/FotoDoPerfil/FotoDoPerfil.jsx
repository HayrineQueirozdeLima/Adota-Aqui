import { useId, useState } from "react";
import Avatar from "../Avatar/Avatar";
import { useAuth } from "../../contexts/AuthContext";
import { enviarFoto } from "../../services/fotos";
import { alterarFotoDoPerfil } from "../../services/perfil";
import { LIMITE_DA_FOTO_EM_BYTES, TIPOS_DE_FOTO } from "../../utils/formularioAnimal";

// Foto de perfil, em Meu perfil. A imagem vai pro POST /api/fotos (como as fotos dos animais)
// e o endereço que volta vai pro PUT .../me/foto. Salva na hora, sem o "Salvar alterações" do formulário.
// aoMudar recebe a foto nova, ou null quando a pessoa tira
export default function FotoDoPerfil({ nome, fotoUrl, aoMudar }) {
  const { usuario, token, sair } = useAuth();
  const id = useId();
  const idDica = `${id}-dica`;
  const [salvando, setSalvando] = useState(false);
  const [problema, setProblema] = useState("");
  const [aviso, setAviso] = useState("");

  async function salvar(acao, mensagem) {
    setProblema("");
    setAviso("");
    setSalvando(true);
    try {
      const url = await acao();
      const perfil = await alterarFotoDoPerfil(usuario.tipoConta, url, token);
      aoMudar(perfil.fotoUrl ?? null);
      setAviso(mensagem);
    } catch (erroDaApi) {
      if (erroDaApi.status === 401) {
        sair();
        return;
      }
      setProblema(erroDaApi.campos?.fotoUrl ?? erroDaApi.message);
    } finally {
      setSalvando(false);
    }
  }

  function escolher(evento) {
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
    salvar(async () => (await enviarFoto(arquivo, token)).url, "Foto salva.");
  }

  return (
    <div className="mt-3 flex flex-col gap-3">
      <div className="flex items-center gap-4">
        <Avatar
          nome={nome}
          fotoUrl={fotoUrl}
          className="size-20 bg-marca-roxo-suave text-subtitulo text-marca-roxo"
        />
        <div className="flex min-w-0 flex-col items-start gap-2">
          <label
            htmlFor={id}
            className={`inline-flex items-center rounded-[10px] border-[1.5px] border-marca-roxo px-4 py-2.5 font-titulo text-campo font-semibold text-marca-roxo has-[:focus-visible]:outline has-[:focus-visible]:outline-2 has-[:focus-visible]:outline-offset-2 has-[:focus-visible]:outline-marca-roxo ${
              salvando ? "cursor-not-allowed opacity-60" : "cursor-pointer"
            }`}
          >
            {salvando ? "Salvando..." : fotoUrl ? "Trocar a foto" : "Escolher uma foto"}
            <input
              id={id}
              type="file"
              accept={TIPOS_DE_FOTO.join(",")}
              onChange={escolher}
              disabled={salvando}
              aria-describedby={idDica}
              className="sr-only"
            />
          </label>
          {fotoUrl && (
            <button
              type="button"
              onClick={() => salvar(async () => null, "Foto removida.")}
              disabled={salvando}
              className="min-h-6 text-legenda font-semibold text-status-erro-texto underline disabled:opacity-60"
            >
              Tirar a foto
            </button>
          )}
        </div>
      </div>
      <p id={idDica} className="text-legenda text-texto-secundario">
        JPG, PNG ou WEBP, até 5 MB. Aparece no topo do site e nos cards dos seus animais, e é salva na hora.
      </p>
      <p role="status" className="text-legenda text-status-disponivel-texto empty:hidden">
        {aviso}
      </p>
      {problema && (
        <p role="alert" className="text-legenda text-status-erro-texto">
          {problema}
        </p>
      )}
    </div>
  );
}
