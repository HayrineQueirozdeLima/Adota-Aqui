import { useId, useState } from "react";
import { useAuth } from "../../contexts/AuthContext";
import { enviarFoto } from "../../services/fotos";
import {
  LIMITE_DA_FOTO_EM_BYTES,
  TIPOS_DE_FOTO,
} from "../../utils/formularioAnimal";

// Fotos do animal (RF16): cada arquivo escolhido vai pro POST /api/fotos, que devolve a URL.
// O formulário guarda só as URLs. A primeira da lista é a capa do card.
export default function EnvioFotos({
  fotos,
  aoAdicionar,
  aoRemover,
  aoTornarPrincipal,
  erro,
  desativado = false,
}) {
  const { token, sair } = useAuth();
  const id = useId();
  const [enviando, setEnviando] = useState(0);
  const [problemas, setProblemas] = useState([]);

  async function escolher(evento) {
    const arquivos = Array.from(evento.target.files);
    // limpa o campo, pra dar pra escolher o mesmo arquivo de novo depois
    evento.target.value = "";

    // Confere antes de enviar, pra não gastar internet com arquivo que o back vai recusar
    const encontrados = [];
    const validos = arquivos.filter((arquivo) => {
      if (!TIPOS_DE_FOTO.includes(arquivo.type)) {
        encontrados.push(`${arquivo.name}: envie uma imagem JPG, PNG ou WEBP.`);
        return false;
      }
      if (arquivo.size > LIMITE_DA_FOTO_EM_BYTES) {
        encontrados.push(`${arquivo.name}: a imagem pode ter no máximo 5 MB.`);
        return false;
      }
      return true;
    });

    // Uma de cada vez: o back recebe uma imagem por requisição
    for (const arquivo of validos) {
      setEnviando((total) => total + 1);
      try {
        const { url } = await enviarFoto(arquivo, token);
        aoAdicionar(url);
      } catch (erroDaApi) {
        if (erroDaApi.status === 401) {
          sair();
          return;
        }
        encontrados.push(`${arquivo.name}: ${erroDaApi.message}`);
      } finally {
        setEnviando((total) => total - 1);
      }
    }
    setProblemas(encontrados);
  }

  const [capa, ...demais] = fotos;

  return (
    <div>
      {capa ? (
        <div className="relative">
          <img
            src={capa}
            alt="Foto principal do animal"
            className="aspect-[4/3] w-full rounded-[12px] object-cover"
          />
          <span className="absolute left-2 top-2 rounded-full bg-fundo-superficie px-2.5 py-1 text-legenda font-semibold text-texto-principal">
            Principal
          </span>
          {!desativado && (
            <button
              type="button"
              onClick={() => aoRemover(0)}
              className="absolute right-2 top-2 rounded-full bg-fundo-superficie px-2.5 py-1 text-legenda font-semibold text-status-erro-texto"
            >
              Remover a foto principal
            </button>
          )}
        </div>
      ) : (
        <div className="flex aspect-[4/3] w-full items-center justify-center rounded-[12px] bg-marca-roxo-suave px-4 text-center text-legenda text-texto-terciario">
          Nenhuma foto ainda
        </div>
      )}

      {demais.length > 0 && (
        <ul className="mt-2 grid grid-cols-3 gap-2">
          {demais.map((url, indice) => {
            const posicao = indice + 1;
            return (
              <li key={url} className="flex flex-col gap-1">
                <img
                  src={url}
                  alt={`Foto ${posicao + 1} do animal`}
                  className="aspect-[4/3] w-full rounded-[10px] object-cover"
                />
                {!desativado && (
                  <div className="flex flex-wrap gap-x-2 text-legenda font-semibold">
                    <button
                      type="button"
                      onClick={() => aoTornarPrincipal(posicao)}
                      className="text-marca-roxo underline"
                    >
                      Principal
                    </button>
                    <button
                      type="button"
                      onClick={() => aoRemover(posicao)}
                      className="text-status-erro-texto underline"
                    >
                      Remover
                    </button>
                  </div>
                )}
              </li>
            );
          })}
        </ul>
      )}

      {!desativado && (
        <div className="mt-3">
          <label
            htmlFor={id}
            className="inline-flex cursor-pointer items-center rounded-[10px] border-[1.5px] border-marca-roxo px-4 py-2.5 font-titulo font-semibold text-campo text-marca-roxo has-[:focus-visible]:outline has-[:focus-visible]:outline-2 has-[:focus-visible]:outline-offset-2 has-[:focus-visible]:outline-marca-roxo"
          >
            Adicionar fotos
            <input
              id={id}
              type="file"
              accept={TIPOS_DE_FOTO.join(",")}
              multiple
              onChange={escolher}
              aria-invalid={erro ? true : undefined}
              className="sr-only"
            />
          </label>
        </div>
      )}

      <p className="mt-2 text-legenda text-texto-terciario">
        JPG, PNG ou WEBP até 5 MB cada. A primeira foto vira a principal no card
        de apresentação do animal.
      </p>
      {enviando > 0 && (
        <p role="status" className="mt-2 text-legenda text-texto-secundario">
          Enviando {enviando === 1 ? "1 foto" : `${enviando} fotos`}...
        </p>
      )}
      {(erro || problemas.length > 0) && (
        <ul className="mt-2 flex flex-col gap-1 text-legenda text-status-erro-texto">
          {erro && <li>{erro}</li>}
          {problemas.map((problema) => (
            <li key={problema}>{problema}</li>
          ))}
        </ul>
      )}
    </div>
  );
}
