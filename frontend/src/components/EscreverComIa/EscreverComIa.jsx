import { useState } from "react";
import Botao from "../Botao/Botao";
import { useAuth } from "../../contexts/AuthContext";
import { useIaDisponivel } from "../../hooks/useIaDisponivel";
import { escreverDescricao } from "../../services/ia";
import { formularioParaIa } from "../../utils/formularioAnimal";

// "Escrever com IA", embaixo da trajetória no formulário do animal.
// A IA usa o que o protetor já preencheu (e o que ele já escreveu, se escreveu) e sugere um texto.
// O texto aparece separado: só vai pro campo quando o protetor clica em "Usar este texto", e ele ainda pode editar.
// Sem a IA ligada no servidor, nada aparece
export default function EscreverComIa({ valores, aoUsar }) {
  const disponivel = useIaDisponivel();
  const { token, sair } = useAuth();
  const [escrevendo, setEscrevendo] = useState(false);
  const [sugestao, setSugestao] = useState("");
  const [erro, setErro] = useState("");

  if (disponivel !== true) return null;

  const faltaPreencher = !valores.nome.trim() || !valores.especie;
  const jaTemTexto = Boolean(valores.historia.trim());

  async function escrever() {
    setEscrevendo(true);
    setErro("");
    try {
      const { texto } = await escreverDescricao(formularioParaIa(valores), token);
      setSugestao(texto);
    } catch (erroDaApi) {
      if (erroDaApi.status === 401) {
        sair();
        return;
      }
      setErro(erroDaApi.message);
    } finally {
      setEscrevendo(false);
    }
  }

  function usar() {
    aoUsar(sugestao);
    setSugestao("");
  }

  return (
    <div className="mt-3 flex flex-col gap-3">
      {sugestao ? (
        <section
          aria-labelledby="sugestao-da-ia"
          className="rounded-[12px] border border-marca-roxo-suave bg-marca-roxo-suave p-4"
        >
          <h3
            id="sugestao-da-ia"
            className="font-titulo text-overline font-semibold uppercase text-marca-roxo"
          >
            Sugestão da IA
          </h3>
          <p className="mt-2 whitespace-pre-line text-corpo text-texto-principal">{sugestao}</p>
          <p className="mt-2 text-legenda text-texto-secundario">
            Confira se está tudo certo com o animal antes de publicar. Dá pra editar depois de usar.
          </p>
          <div className="mt-3 flex flex-wrap gap-2">
            <Botao onClick={usar}>Usar este texto</Botao>
            <Botao variante="secundario" onClick={escrever} disabled={escrevendo}>
              {escrevendo ? "Escrevendo..." : "Escrever outro"}
            </Botao>
            <Botao variante="neutro" onClick={() => setSugestao("")} disabled={escrevendo}>
              Descartar
            </Botao>
          </div>
        </section>
      ) : (
        <div className="flex flex-wrap items-center gap-3">
          <Botao variante="secundario" onClick={escrever} disabled={faltaPreencher || escrevendo}>
            {escrevendo ? "Escrevendo..." : jaTemTexto ? "Melhorar com IA" : "Escrever com IA"}
          </Botao>
          <p className="text-legenda text-texto-terciario">
            {faltaPreencher
              ? "Preencha o nome e a espécie pra IA poder ajudar."
              : "A IA escreve a partir do que você preencheu, e você revisa antes de usar."}
          </p>
        </div>
      )}

      {erro && (
        <p role="alert" className="text-compacto text-status-erro-texto">
          {erro}
        </p>
      )}
      <p role="status" className="sr-only">
        {sugestao ? "A IA sugeriu um texto. Revise antes de usar." : ""}
      </p>
    </div>
  );
}
