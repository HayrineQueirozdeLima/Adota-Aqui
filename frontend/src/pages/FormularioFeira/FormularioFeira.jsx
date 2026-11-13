import { useEffect, useRef, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import AvisoPagina from "../../components/AvisoPagina/AvisoPagina";
import Botao from "../../components/Botao/Botao";
import CampoSelecao from "../../components/CampoSelecao/CampoSelecao";
import CampoTexto from "../../components/CampoTexto/CampoTexto";
import CampoTextoLongo from "../../components/CampoTextoLongo/CampoTextoLongo";
import Carregando from "../../components/Carregando/Carregando";
import { useAuth } from "../../contexts/AuthContext";
import { useFocoNoPrimeiroErro } from "../../hooks/useFocoNoPrimeiroErro";
import { useTituloDaPagina } from "../../hooks/useTituloDaPagina";
import { buscarFeira, divulgarFeira, editarFeira } from "../../services/feiras";
import { buscarPerfil } from "../../services/perfil";
import { estados } from "../../utils/rotulos";

const vazia = {
  titulo: "",
  data: "",
  horaInicio: "",
  horaFim: "",
  local: "",
  endereco: "",
  cidade: "",
  estado: "",
  descricao: "",
};

const opcoesDeEstado = Object.entries(estados).map(([sigla, nome]) => ({ valor: sigla, nome }));

// Os campos que a API pode devolver com erro, na ordem da tela
const campos = Object.keys(vazia);

// Hoje no formato do campo de data ("2026-11-21"), no dia do computador da pessoa
function hoje() {
  const agora = new Date();
  const mes = String(agora.getMonth() + 1).padStart(2, "0");
  const dia = String(agora.getDate()).padStart(2, "0");
  return `${agora.getFullYear()}-${mes}-${dia}`;
}

// Divulgar uma feira (/feiras/nova) e editar (/feiras/:id/editar). Só abrigo chega aqui (RotaProtegida).
// Pra editar, tem que ser o abrigo que divulgou. A API confere tudo de novo
export default function FormularioFeira() {
  const { id } = useParams();
  const editando = Boolean(id);
  const navegar = useNavigate();
  const { usuario, token, sair } = useAuth();
  const [valores, setValores] = useState(vazia);
  // "carregando" | "pronto" | "sem-permissao" | "nao-encontrado" | "erro"
  const [situacao, setSituacao] = useState(editando ? "carregando" : "pronto");
  const [tentativa, setTentativa] = useState(0);
  const [erros, setErros] = useState({});
  const [erroGeral, setErroGeral] = useState("");
  const [enviando, setEnviando] = useState(false);
  const [tentativasDeEnvio, setTentativasDeEnvio] = useState(0);
  const formulario = useRef(null);
  useFocoNoPrimeiroErro(formulario, tentativasDeEnvio);
  useTituloDaPagina(editando ? "Editar feira" : "Divulgar uma feira");

  // Feira nova: a cidade e o estado do abrigo já vêm preenchidos (a pessoa pode trocar)
  useEffect(() => {
    if (editando) return undefined;
    let cancelado = false;
    buscarPerfil(usuario.tipoConta, token)
      .then((perfil) => {
        const endereco = perfil?.endereco;
        if (cancelado || !endereco) return;
        setValores((atuais) => ({
          ...atuais,
          cidade: atuais.cidade || endereco.cidade,
          estado: atuais.estado || endereco.estado,
        }));
      })
      .catch((erro) => {
        if (!cancelado && erro.status === 401) sair();
      });
    return () => {
      cancelado = true;
    };
  }, [editando, usuario.tipoConta, token, sair]);

  // Editando: busca a feira e confere se é do abrigo logado
  useEffect(() => {
    if (!editando) return undefined;
    let cancelado = false;
    buscarFeira(id, token)
      .then((feira) => {
        if (cancelado) return;
        if (!feira.ehMinha) {
          setSituacao("sem-permissao");
          return;
        }
        setValores({
          titulo: feira.titulo,
          data: feira.data,
          horaInicio: feira.horaInicio.slice(0, 5),
          horaFim: feira.horaFim.slice(0, 5),
          local: feira.local,
          endereco: feira.endereco,
          cidade: feira.cidade,
          estado: feira.estado,
          descricao: feira.descricao ?? "",
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
    setErros((atuais) => ({ ...atuais, [campo]: undefined }));
  }

  function validar() {
    const encontrados = {};
    if (valores.titulo.trim().length < 5) encontrados.titulo = "O título deve ter pelo menos 5 caracteres.";
    if (!valores.data) encontrados.data = "Informe a data da feira.";
    else if (valores.data < hoje()) encontrados.data = "A data da feira já passou.";
    if (!valores.horaInicio) encontrados.horaInicio = "Informe a hora em que a feira começa.";
    if (!valores.horaFim) encontrados.horaFim = "Informe a hora em que a feira termina.";
    else if (valores.horaInicio && valores.horaFim <= valores.horaInicio) {
      encontrados.horaFim = "A feira deve terminar depois de começar.";
    }
    if (!valores.local.trim()) encontrados.local = "Informe o nome do local.";
    if (!valores.endereco.trim()) encontrados.endereco = "Informe o endereço.";
    if (!valores.cidade.trim()) encontrados.cidade = "Informe a cidade.";
    if (!valores.estado) encontrados.estado = "Escolha o estado.";
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
    const dados = Object.fromEntries(
      Object.entries(valores).map(([campo, valor]) => [campo, valor.trim()]),
    );
    try {
      if (editando) await editarFeira(id, dados, token);
      else await divulgarFeira(dados, token);
      navegar("/feiras", {
        state: {
          aviso: editando
            ? "As alterações na feira foram salvas."
            : "A feira foi divulgada e já aparece pra quem procura feiras no estado dela.",
        },
      });
    } catch (erro) {
      if (erro.status === 401) {
        sair();
        return;
      }
      const daApi = Object.fromEntries(
        campos.filter((campo) => erro.campos?.[campo]).map((campo) => [campo, erro.campos[campo]]),
      );
      if (Object.keys(daApi).length > 0) {
        setErros(daApi);
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
        <Carregando texto="Carregando a feira..." />
      </main>
    );
  }

  if (situacao === "sem-permissao") {
    return (
      <AvisoPagina titulo="Só o abrigo que divulgou pode editar esta feira">
        <Botao para="/feiras" className="mt-2">
          Ver as feiras
        </Botao>
      </AvisoPagina>
    );
  }

  if (situacao === "nao-encontrado") {
    return (
      <AvisoPagina titulo="Feira não encontrada">
        <p>Ela pode ter sido apagada pelo abrigo.</p>
        <Botao para="/feiras" className="mt-5">
          Ver as feiras
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
          {editando ? "Editar feira" : "Divulgar uma feira"}
        </h1>
        <p className="mt-2 text-corpo text-texto-secundario">
          A feira aparece pra qualquer pessoa na página de feiras, com o nome do
          abrigo, até o fim do dia em que ela acontece.
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
          placeholder="Ex.: Feira de adoção do Parque da Cidade"
          value={valores.titulo}
          onChange={(evento) => mudar("titulo", evento.target.value)}
          maxLength={120}
          erro={erros.titulo}
        />

        <div className="grid gap-6 sm:grid-cols-3">
          <CampoTexto
            rotulo="Data"
            type="date"
            min={editando ? undefined : hoje()}
            value={valores.data}
            onChange={(evento) => mudar("data", evento.target.value)}
            erro={erros.data}
          />
          <CampoTexto
            rotulo="Começa às"
            type="time"
            value={valores.horaInicio}
            onChange={(evento) => mudar("horaInicio", evento.target.value)}
            erro={erros.horaInicio}
          />
          <CampoTexto
            rotulo="Termina às"
            type="time"
            value={valores.horaFim}
            onChange={(evento) => mudar("horaFim", evento.target.value)}
            erro={erros.horaFim}
          />
        </div>

        <CampoTexto
          rotulo="Nome do local"
          placeholder="Ex.: Praça Central, pet shop, escola"
          value={valores.local}
          onChange={(evento) => mudar("local", evento.target.value)}
          maxLength={120}
          erro={erros.local}
        />
        <CampoTexto
          rotulo="Endereço"
          placeholder="Rua, número e bairro"
          value={valores.endereco}
          onChange={(evento) => mudar("endereco", evento.target.value)}
          maxLength={200}
          erro={erros.endereco}
        />

        <div className="grid gap-6 sm:grid-cols-[2fr_1fr]">
          <CampoTexto
            rotulo="Cidade"
            value={valores.cidade}
            onChange={(evento) => mudar("cidade", evento.target.value)}
            maxLength={80}
            erro={erros.cidade}
          />
          <CampoSelecao
            rotulo="Estado"
            opcoes={opcoesDeEstado}
            value={valores.estado}
            onChange={(evento) => mudar("estado", evento.target.value)}
            erro={erros.estado}
          />
        </div>

        <CampoTextoLongo
          rotulo="Descrição (opcional)"
          value={valores.descricao}
          onChange={(evento) => mudar("descricao", evento.target.value)}
          maximo={1000}
          linhas={5}
          erro={erros.descricao}
          dica="Quantos animais vão, se estão castrados e vacinados, o que a pessoa precisa levar pra adotar."
        />

        {erroGeral && (
          <p role="alert" className="text-compacto text-status-erro-texto">
            {erroGeral}
          </p>
        )}

        <div className="flex flex-col gap-2 sm:flex-row">
          <Botao type="submit" disabled={enviando}>
            {enviando ? "Salvando..." : editando ? "Salvar alterações" : "Divulgar feira"}
          </Botao>
          <Botao variante="secundario" para="/feiras">
            Cancelar
          </Botao>
        </div>
      </form>
    </main>
  );
}
