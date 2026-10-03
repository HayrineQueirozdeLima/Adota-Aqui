import { useRef, useState } from "react";
import { Link, Navigate, useNavigate } from "react-router-dom";
import Botao from "../Botao/Botao";
import CampoTexto from "../CampoTexto/CampoTexto";
import CamposEndereco from "../CamposEndereco/CamposEndereco";
import { useAuth } from "../../contexts/AuthContext";
import { useFocoNoPrimeiroErro } from "../../hooks/useFocoNoPrimeiroErro";
import { cadastrarAbrigo, cadastrarUsuario } from "../../services/autenticacao";
import {
  mascaraCnpj,
  mascaraCpf,
  mascaraTelefone,
  somenteNumeros,
} from "../../utils/mascaras";
import { validarCadastro } from "../../utils/validacoes";

// Os nomes dos campos são os mesmos do JSON da API (docs/api.md, POST /api/usuarios e /api/abrigos)
const formularioVazio = {
  cpf: "",
  cnpj: "",
  nome: "",
  razaoSocial: "",
  email: "",
  telefone: "",
  senha: "",
  confirmacaoSenha: "",
  endereco: {
    cep: "",
    cidade: "",
    estado: "",
    logradouro: "",
    bairro: "",
    numero: "",
  },
};

// O que muda de um cadastro pro outro
const textos = {
  USUARIO: {
    titulo: "Criar conta pessoal",
    endereco: "Endereço",
    botao: "Criar conta",
    enviando: "Criando conta...",
  },
  ABRIGO: {
    titulo: "Cadastrar Abrigo / ONG",
    endereco: "Endereço da instituição",
    botao: "Cadastrar abrigo",
    enviando: "Cadastrando abrigo...",
  },
};

// Tira as máscaras e monta o JSON que a API espera
function montarCorpo(dados, tipo) {
  const corpo = {
    nome: dados.nome.trim(),
    email: dados.email.trim(),
    telefone: somenteNumeros(dados.telefone),
    senha: dados.senha,
    confirmacaoSenha: dados.confirmacaoSenha,
    endereco: {
      ...dados.endereco,
      cep: somenteNumeros(dados.endereco.cep),
      cidade: dados.endereco.cidade.trim(),
      estado: dados.endereco.estado.trim().toUpperCase(),
      numero: dados.endereco.numero.trim(),
    },
  };
  if (tipo === "ABRIGO") {
    corpo.cnpj = somenteNumeros(dados.cnpj);
    corpo.razaoSocial = dados.razaoSocial.trim();
  } else {
    corpo.cpf = somenteNumeros(dados.cpf);
  }
  return corpo;
}

// CPF, CNPJ ou e-mail repetidos (409) chegam só com a mensagem, sem "campos".
// Pelo texto dá pra saber de qual campo é e mostrar embaixo dele, como no Figma.
function campoDaMensagem(mensagem) {
  if (/CNPJ/.test(mensagem)) return "cnpj";
  if (/CPF/.test(mensagem)) return "cpf";
  if (/e-mail/i.test(mensagem)) return "email";
  return null;
}

// Formulário dos dois cadastros. tipo = "USUARIO" (CPF) ou "ABRIGO" (CNPJ)
export default function FormularioCadastro({ tipo }) {
  const { usuario, entrar } = useAuth();
  const navegar = useNavigate();
  const refFormulario = useRef(null);
  const [dados, setDados] = useState(formularioVazio);
  const [erros, setErros] = useState({});
  const [erroGeral, setErroGeral] = useState("");
  const [enviando, setEnviando] = useState(false);
  const [tentativas, setTentativas] = useState(0);
  useFocoNoPrimeiroErro(refFormulario, tentativas);

  // Quem já está logado não precisa criar conta
  if (usuario) return <Navigate to="/animais" replace />;

  const ehAbrigo = tipo === "ABRIGO";
  const texto = textos[tipo];

  function limparErros(campos) {
    setErros((atuais) => {
      const restantes = { ...atuais };
      campos.forEach((campo) => delete restantes[campo]);
      return restantes;
    });
  }

  function mudar(campo, valor) {
    setDados((atuais) => ({ ...atuais, [campo]: valor }));
    limparErros([campo]);
  }

  function mudarEndereco(parcial) {
    setDados((atuais) => ({
      ...atuais,
      endereco: { ...atuais.endereco, ...parcial },
    }));
    limparErros(Object.keys(parcial).map((campo) => `endereco.${campo}`));
  }

  // Liga um input a um campo do formulário, aplicando a máscara quando tem
  function campo(nome, mascara) {
    return {
      name: nome,
      value: dados[nome],
      erro: erros[nome],
      onChange: (evento) =>
        mudar(
          nome,
          mascara ? mascara(evento.target.value) : evento.target.value,
        ),
    };
  }

  function mostrarErros(novosErros, mensagemGeral = "") {
    setErros(novosErros);
    setErroGeral(mensagemGeral);
    setTentativas((total) => total + 1);
  }

  async function enviar(evento) {
    evento.preventDefault();

    const encontrados = validarCadastro(dados, tipo);
    if (Object.keys(encontrados).length > 0) {
      mostrarErros(encontrados);
      return;
    }

    setErroGeral("");
    setEnviando(true);
    try {
      const cadastrar = ehAbrigo ? cadastrarAbrigo : cadastrarUsuario;
      // O cadastro já devolve o token (UC01 e UC02): a pessoa sai daqui logada
      const sessao = await cadastrar(montarCorpo(dados, tipo));
      entrar(sessao);
      navegar("/animais", { replace: true });
    } catch (erro) {
      const doServidor = { ...erro.campos };
      const campoDoErro = campoDaMensagem(erro.message);
      if (Object.keys(doServidor).length === 0 && campoDoErro) {
        doServidor[campoDoErro] = erro.message;
      }
      const semCampo = Object.keys(doServidor).length === 0;
      mostrarErros(doServidor, semCampo ? erro.message : "");
      setEnviando(false);
    }
  }

  return (
    <>
      <h1 className="font-titulo text-secao font-semibold text-texto-principal">
        {texto.titulo}
      </h1>
      {!ehAbrigo && (
        <p className="mt-2 text-compacto text-texto-secundario">
          A mesma conta serve para adotar e para cadastrar um animal que você
          resgatou.
        </p>
      )}

      <form
        ref={refFormulario}
        onSubmit={enviar}
        noValidate
        className="mt-6 flex flex-col gap-[18px]"
      >
        {ehAbrigo ? (
          <>
            <div className="grid gap-x-3 gap-y-[18px] md:grid-cols-2">
              <CampoTexto
                rotulo="CNPJ"
                inputMode="numeric"
                placeholder="00.000.000/0001-00"
                {...campo("cnpj", mascaraCnpj)}
              />
              <CampoTexto
                rotulo="Nome institucional"
                autoComplete="organization"
                placeholder="Instituto Quatro Patas"
                {...campo("nome")}
              />
            </div>
            <CampoTexto
              rotulo="Razão social"
              placeholder="Instituto Quatro Patas Ltda"
              {...campo("razaoSocial")}
            />
            <div className="grid gap-x-3 gap-y-[18px] md:grid-cols-3">
              <CampoTexto
                rotulo="E-mail institucional"
                type="email"
                autoComplete="email"
                placeholder="contato@quatropatas.org"
                className="md:col-span-2"
                {...campo("email")}
              />
              <CampoTexto
                rotulo="Telefone (DDD)"
                type="tel"
                autoComplete="tel"
                placeholder="(69) 3222-1111"
                {...campo("telefone", mascaraTelefone)}
              />
            </div>
          </>
        ) : (
          <>
            <CampoTexto
              rotulo="Nome completo"
              autoComplete="name"
              placeholder="Marina Prado"
              {...campo("nome")}
            />
            <div className="grid gap-x-3 gap-y-[18px] md:grid-cols-3">
              <CampoTexto
                rotulo="CPF"
                inputMode="numeric"
                placeholder="000.000.000-00"
                {...campo("cpf", mascaraCpf)}
              />
              <CampoTexto
                rotulo="E-mail"
                type="email"
                autoComplete="email"
                placeholder="voce@email.com"
                {...campo("email")}
              />
              <CampoTexto
                rotulo="Telefone (DDD)"
                type="tel"
                autoComplete="tel"
                placeholder="(69) 99999-9999"
                {...campo("telefone", mascaraTelefone)}
              />
            </div>
          </>
        )}

        <div className="grid gap-x-3 gap-y-[18px] md:grid-cols-2">
          <CampoTexto
            rotulo="Senha"
            type="password"
            autoComplete="new-password"
            dica="Mínimo de 8 caracteres."
            {...campo("senha")}
          />
          <CampoTexto
            rotulo="Confirmar senha"
            type="password"
            autoComplete="new-password"
            {...campo("confirmacaoSenha")}
          />
        </div>

        <CamposEndereco
          titulo={texto.endereco}
          endereco={dados.endereco}
          erros={erros}
          aoMudar={mudarEndereco}
        />

        {!ehAbrigo && (
          <p className="rounded-[10px] bg-status-atencao-fundo px-4 py-3 text-compacto text-status-atencao-texto">
            O estado define quais animais você vai ver: a listagem mostra apenas
            animais do seu estado.
          </p>
        )}

        {erroGeral && (
          <p
            role="alert"
            className="rounded-[10px] bg-status-erro-fundo px-4 py-3 text-compacto text-status-erro-texto"
          >
            {erroGeral}
          </p>
        )}

        <Botao type="submit" className="w-full" disabled={enviando}>
          {enviando ? texto.enviando : texto.botao}
        </Botao>
        {enviando && (
          <p role="status" className="text-legenda text-texto-terciario">
            Se o servidor estava parado, a primeira resposta pode levar até 1
            minuto.
          </p>
        )}
      </form>

      <div className="mt-5 flex flex-col gap-1 text-compacto text-texto-secundario">
        <p>
          Já tem conta?{" "}
          <Link
            to="/login"
            className="font-titulo font-semibold text-marca-roxo hover:underline"
          >
            Entrar
          </Link>
        </p>
        {ehAbrigo ? (
          <p>
            É pessoa física?{" "}
            <Link
              to="/cadastro/usuario"
              className="font-titulo font-semibold text-marca-roxo hover:underline"
            >
              Cadastre com CPF
            </Link>
          </p>
        ) : (
          <p>
            É uma ONG ou abrigo?{" "}
            <Link
              to="/cadastro/abrigo"
              className="font-titulo font-semibold text-marca-roxo hover:underline"
            >
              Cadastre o CNPJ
            </Link>
          </p>
        )}
      </div>
    </>
  );
}
