import { useEffect, useRef, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import AvisoPagina from "../../components/AvisoPagina/AvisoPagina";
import Botao from "../../components/Botao/Botao";
import CampoSelecao from "../../components/CampoSelecao/CampoSelecao";
import CampoTexto from "../../components/CampoTexto/CampoTexto";
import CampoTextoLongo from "../../components/CampoTextoLongo/CampoTextoLongo";
import Carregando from "../../components/Carregando/Carregando";
import EnvioFotoUnica from "../../components/EnvioFotoUnica/EnvioFotoUnica";
import { useAuth } from "../../contexts/AuthContext";
import { useFocoNoPrimeiroErro } from "../../hooks/useFocoNoPrimeiroErro";
import { useTituloDaPagina } from "../../hooks/useTituloDaPagina";
import { buscarArtigo, editarArtigo, meusArtigos, publicarArtigo } from "../../services/artigos";
import { categoriasDeArtigo } from "../../utils/rotulos";

const vazia = { titulo: "", categoria: "", conteudo: "", fotoCapa: null };

// Escrever um artigo (/blog/novo) e editar (/blog/:id/editar). Precisa de login.
// Pra escrever, a conta tem que ser de protetor: abrigo, ou pessoa que já cadastrou animal.
// Pra editar, tem que ser de quem escreveu. A API confere as duas coisas de novo
export default function FormularioArtigo() {
  const { id } = useParams();
  const editando = Boolean(id);
  const navegar = useNavigate();
  const { token, sair } = useAuth();
  const [valores, setValores] = useState(vazia);
  // "carregando" | "pronto" | "nao-protetor" | "sem-permissao" | "nao-encontrado" | "erro"
  const [situacao, setSituacao] = useState("carregando");
  const [tentativa, setTentativa] = useState(0);
  const [erros, setErros] = useState({});
  const [erroGeral, setErroGeral] = useState("");
  const [enviando, setEnviando] = useState(false);
  const [tentativasDeEnvio, setTentativasDeEnvio] = useState(0);
  const formulario = useRef(null);
  useFocoNoPrimeiroErro(formulario, tentativasDeEnvio);
  useTituloDaPagina(editando ? "Editar artigo" : "Escrever um artigo");

  useEffect(() => {
    let cancelado = false;
    const busca = editando ? buscarArtigo(id, token) : meusArtigos(token);
    busca
      .then((resposta) => {
        if (cancelado) return;
        if (!editando) {
          setSituacao(resposta.podePublicar ? "pronto" : "nao-protetor");
          return;
        }
        if (!resposta.ehMeu) {
          setSituacao("sem-permissao");
          return;
        }
        setValores({
          titulo: resposta.titulo,
          categoria: resposta.categoria,
          conteudo: resposta.conteudo,
          fotoCapa: resposta.fotoCapa,
        });
        setSituacao("pronto");
      })
      .catch((erro) => {
        if (cancelado) return;
        if (erro.status === 401) {
          sair();
          return;
        }
        setSituacao(erro.status === 404 ? "nao-encontrado" : "erro");
      });
    return () => {
      cancelado = true;
    };
  }, [id, editando, token, sair, tentativa]);

  function mudar(campo, valor) {
    setValores((atuais) => ({ ...atuais, [campo]: valor }));
    // a mensagem de erro some assim que a pessoa mexe no campo
    setErros((atuais) => ({ ...atuais, [campo]: undefined }));
  }

  function validar() {
    const encontrados = {};
    if (valores.titulo.trim().length < 5) encontrados.titulo = "O título deve ter pelo menos 5 caracteres.";
    if (!valores.categoria) encontrados.categoria = "Escolha o assunto do artigo.";
    if (valores.conteudo.trim().length < 50) encontrados.conteudo = "O texto deve ter pelo menos 50 caracteres.";
    return encontrados;
  }

  async function enviar(evento) {
    evento.preventDefault();
    setErroGeral("");
    const encontrados = validar();
    setErros(encontrados);
    if (Object.keys(encontrados).length > 0) {
      setTentativasDeEnvio((atual) => atual + 1);
      return;
    }
    setEnviando(true);
    const dados = {
      titulo: valores.titulo.trim(),
      categoria: valores.categoria,
      conteudo: valores.conteudo.trim(),
      fotoCapa: valores.fotoCapa,
    };
    try {
      const salva = editando ? await editarArtigo(id, dados, token) : await publicarArtigo(dados, token);
      navegar(`/blog/${salva.id}`, {
        state: { aviso: editando ? "As alterações no artigo foram salvas." : "Seu artigo foi publicado." },
      });
    } catch (erro) {
      if (erro.status === 401) {
        sair();
        return;
      }
      const { titulo, categoria, conteudo } = erro.campos ?? {};
      if (titulo || categoria || conteudo) {
        setErros({ titulo, categoria, conteudo });
        setTentativasDeEnvio((atual) => atual + 1);
      } else {
        setErroGeral(erro.message);
      }
      setEnviando(false);
    }
  }

  if (situacao === "carregando") {
    return (
      <main className="px-5 py-12">
        <Carregando texto="Carregando..." />
      </main>
    );
  }

  if (situacao === "nao-protetor") {
    return (
      <AvisoPagina titulo="Pra escrever artigos, cadastre um animal primeiro">
        <p>
          Os artigos são escritos por abrigos e por quem já resgatou um animal. Depois de cadastrar o seu, é só
          voltar aqui.
        </p>
        <Botao para="/meus-animais/novo" className="mt-5">
          Cadastrar um animal
        </Botao>
      </AvisoPagina>
    );
  }

  if (situacao === "sem-permissao") {
    return (
      <AvisoPagina titulo="Só quem escreveu pode editar este artigo">
        <Botao para={`/blog/${id}`} className="mt-2">
          Ler o artigo
        </Botao>
      </AvisoPagina>
    );
  }

  if (situacao === "nao-encontrado") {
    return (
      <AvisoPagina titulo="Artigo não encontrado">
        <Botao para="/blog" className="mt-2">
          Ver todos os artigos
        </Botao>
      </AvisoPagina>
    );
  }

  if (situacao === "erro") {
    return (
      <AvisoPagina titulo="Não foi possível carregar" alerta>
        <p>Confira sua conexão e tente de novo.</p>
        <Botao
          onClick={() => {
            setSituacao("carregando");
            setTentativa((atual) => atual + 1);
          }}
          className="mt-5"
        >
          Tentar de novo
        </Botao>
      </AvisoPagina>
    );
  }

  return (
    <main className="mx-auto flex w-full max-w-[760px] flex-col gap-6 px-5 pb-12 pt-6 md:pt-8">
      <div>
        <h1 className="font-titulo text-secao font-semibold text-texto-principal">
          {editando ? "Editar artigo" : "Escrever um artigo"}
        </h1>
        <p className="mt-2 text-corpo text-texto-secundario">
          O blog existe pra comunidade se ajudar: conte o que você aprendeu cuidando dos seus animais, pra quem vai
          adotar chegar mais preparado. Escreva com as suas palavras, como quem conversa com alguém que vai adotar.
        </p>
        <p className="mt-2 text-compacto text-texto-secundario">
          O artigo fica público, com o seu nome, a sua cidade e o seu estado.
        </p>
      </div>

      <form
        ref={formulario}
        onSubmit={enviar}
        noValidate
        className="flex flex-col gap-6 rounded-[18px] border border-borda-sutil bg-fundo-superficie p-5 md:p-7"
      >
        <CampoTexto
          rotulo="Título"
          value={valores.titulo}
          onChange={(evento) => mudar("titulo", evento.target.value)}
          maxLength={120}
          erro={erros.titulo}
        />
        <CampoSelecao
          rotulo="Assunto"
          opcoes={categoriasDeArtigo}
          value={valores.categoria}
          onChange={(evento) => mudar("categoria", evento.target.value)}
          erro={erros.categoria}
        />
        <EnvioFotoUnica
          rotulo="Foto de capa (opcional)"
          foto={valores.fotoCapa}
          aoMudar={(url) => mudar("fotoCapa", url)}
          descricao="Foto de capa do artigo"
        />
        <CampoTextoLongo
          rotulo="Texto do artigo"
          value={valores.conteudo}
          onChange={(evento) => mudar("conteudo", evento.target.value)}
          maximo={10000}
          linhas={14}
          erro={erros.conteudo}
          dica="Separe os parágrafos com uma linha em branco."
        />

        {erroGeral && (
          <p role="alert" className="text-compacto text-status-erro-texto">
            {erroGeral}
          </p>
        )}

        <div className="flex flex-col gap-2 sm:flex-row">
          <Botao type="submit" disabled={enviando}>
            {enviando ? "Salvando..." : editando ? "Salvar alterações" : "Publicar artigo"}
          </Botao>
          <Botao variante="secundario" para={editando ? `/blog/${id}` : "/blog"}>
            Cancelar
          </Botao>
        </div>
      </form>
    </main>
  );
}
