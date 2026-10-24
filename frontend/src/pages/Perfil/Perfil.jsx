import { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import Botao from "../../components/Botao/Botao";
import CampoTexto from "../../components/CampoTexto/CampoTexto";
import CamposEndereco from "../../components/CamposEndereco/CamposEndereco";
import Carregando from "../../components/Carregando/Carregando";
import Tag from "../../components/Tag/Tag";
import { useAuth } from "../../contexts/AuthContext";
import { useFocoNoPrimeiroErro } from "../../hooks/useFocoNoPrimeiroErro";
import {
  alterarSenha,
  atualizarPerfil,
  buscarPerfil,
} from "../../services/perfil";
import {
  mascaraCep,
  mascaraCnpj,
  mascaraCpf,
  mascaraTelefone,
  somenteNumeros,
} from "../../utils/mascaras";
import { validarPerfil, validarTrocaDeSenha } from "../../utils/validacoes";

const senhasVazias = {
  senhaAtual: "",
  novaSenha: "",
  confirmacaoNovaSenha: "",
};

// O que muda entre a conta pessoal e a de abrigo
const textos = {
  USUARIO: {
    descricao:
      "Seus dados de contato e endereço. O CPF não muda, porque é ele que identifica a conta.",
    documento: "CPF",
    nome: "Nome completo",
    tipo: "Pessoa física",
    sobreATipo:
      "A mesma conta serve para adotar e para cadastrar um animal que você resgatou.",
    estadoTitulo: "Mudar o estado muda o que você vê.",
    estadoTexto:
      "A listagem de animais e a demonstração de interesse são restritas ao seu estado, e os animais que você cadastrou passam a aparecer pra quem é do estado novo.",
  },
  ABRIGO: {
    descricao:
      "Os dados de contato e o endereço da instituição. O CNPJ não muda, porque é ele que identifica a conta.",
    documento: "CNPJ",
    nome: "Nome institucional",
    tipo: "Abrigo ou ONG",
    sobreATipo:
      "Conta institucional: cadastra os animais do abrigo e acompanha os interesses recebidos.",
    estadoTitulo: "Mudar o estado muda quem vê os seus animais.",
    estadoTexto:
      "Cada pessoa vê só os animais do próprio estado, e os seus passam a aparecer pra quem é do estado novo.",
  },
};

// Resposta da API (só números) vira o formulário (com as máscaras)
function formularioDe(perfil) {
  const endereco = perfil.endereco ?? {};
  return {
    documento: perfil.cnpj
      ? mascaraCnpj(perfil.cnpj)
      : mascaraCpf(perfil.cpf ?? ""),
    nome: perfil.nome ?? "",
    razaoSocial: perfil.razaoSocial ?? "",
    telefone: mascaraTelefone(perfil.telefone ?? ""),
    email: perfil.email ?? "",
    endereco: {
      cep: mascaraCep(endereco.cep ?? ""),
      cidade: endereco.cidade ?? "",
      estado: endereco.estado ?? "",
      logradouro: endereco.logradouro ?? "",
      bairro: endereco.bairro ?? "",
      numero: endereco.numero ?? "",
    },
  };
}

// Tira as máscaras e monta o JSON do PUT (docs/api.md, PUT /api/usuarios/me). O documento não vai
function montarCorpo(dados, ehAbrigo) {
  const corpo = {
    nome: dados.nome.trim(),
    telefone: somenteNumeros(dados.telefone),
    email: dados.email.trim(),
    endereco: {
      ...dados.endereco,
      cep: somenteNumeros(dados.endereco.cep),
      cidade: dados.endereco.cidade.trim(),
      estado: dados.endereco.estado.trim().toUpperCase(),
      numero: dados.endereco.numero.trim(),
    },
  };
  if (ehAbrigo) corpo.razaoSocial = dados.razaoSocial.trim();
  return corpo;
}

// Meu perfil (RF17, UC10, Figma: Editar perfil), em /perfil. Vale pra pessoa e pra abrigo.
// Um botão só salva tudo: os dados vão no PUT, e a senha, se foi preenchida, no PATCH logo depois
export default function Perfil() {
  const { usuario, token, sair, atualizarNome } = useAuth();
  const navegar = useNavigate();
  const ehAbrigo = usuario.tipoConta === "ABRIGO";
  const texto = textos[ehAbrigo ? "ABRIGO" : "USUARIO"];
  const refFormulario = useRef(null);
  const refAviso = useRef(null);
  // O perfil como está salvo na API, e o formulário que a pessoa edita
  const [salvo, setSalvo] = useState(null);
  const [dados, setDados] = useState(null);
  const [senhas, setSenhas] = useState(senhasVazias);
  // "carregando" | "pronto" | "erro"
  const [situacao, setSituacao] = useState("carregando");
  const [versao, setVersao] = useState(0);
  const [erros, setErros] = useState({});
  const [erroGeral, setErroGeral] = useState("");
  const [aviso, setAviso] = useState("");
  const [enviando, setEnviando] = useState(false);
  const [tentativas, setTentativas] = useState(0);
  useFocoNoPrimeiroErro(refFormulario, tentativas);

  useEffect(() => {
    let cancelado = false;
    buscarPerfil(usuario.tipoConta, token)
      .then((perfil) => {
        if (cancelado) return;
        setSalvo(perfil);
        setDados(formularioDe(perfil));
        setSituacao("pronto");
      })
      .catch((erro) => {
        if (cancelado) return;
        if (erro.status === 401) {
          sair();
          return;
        }
        setSituacao("erro");
      });
    return () => {
      cancelado = true;
    };
  }, [usuario.tipoConta, token, sair, versao]);

  // Depois de salvar, o foco vai pro aviso: quem usa leitor de tela fica sabendo que deu certo
  useEffect(() => {
    if (aviso) refAviso.current?.focus();
  }, [aviso]);

  const dadosMudaram =
    salvo !== null &&
    JSON.stringify(montarCorpo(dados, ehAbrigo)) !==
      JSON.stringify(montarCorpo(formularioDe(salvo), ehAbrigo));
  const vaiTrocarSenha = Object.values(senhas).some(Boolean);
  const alterado = dadosMudaram || vaiTrocarSenha;

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
    setAviso("");
  }

  function mudarEndereco(parcial) {
    setDados((atuais) => ({
      ...atuais,
      endereco: { ...atuais.endereco, ...parcial },
    }));
    limparErros(Object.keys(parcial).map((campo) => `endereco.${campo}`));
    setAviso("");
  }

  function mudarSenha(campo, valor) {
    setSenhas((atuais) => ({ ...atuais, [campo]: valor }));
    limparErros(["senhaAtual", "novaSenha", "confirmacaoNovaSenha"]);
    setAviso("");
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

  function campoDeSenha(nome) {
    return {
      name: nome,
      type: "password",
      value: senhas[nome],
      erro: erros[nome],
      onChange: (evento) => mudarSenha(nome, evento.target.value),
    };
  }

  function mostrarErros(novosErros, mensagemGeral = "") {
    setErros(novosErros);
    setErroGeral(mensagemGeral);
    setTentativas((total) => total + 1);
  }

  function cancelar() {
    setDados(formularioDe(salvo));
    setSenhas(senhasVazias);
    setErros({});
    setErroGeral("");
    setAviso("");
  }

  function sairDaConta() {
    sair();
    navegar("/", { replace: true });
  }

  async function salvar(evento) {
    evento.preventDefault();
    setAviso("");

    const encontrados = {
      ...validarPerfil(dados, usuario.tipoConta),
      ...validarTrocaDeSenha(senhas),
    };
    if (Object.keys(encontrados).length > 0) {
      mostrarErros(encontrados);
      return;
    }
    if (!alterado) {
      setErroGeral("");
      setAviso("Nada para salvar: nenhum dado foi alterado.");
      return;
    }

    setErroGeral("");
    setEnviando(true);
    let dadosSalvos = false;
    try {
      if (dadosMudaram) {
        const atualizado = await atualizarPerfil(
          usuario.tipoConta,
          montarCorpo(dados, ehAbrigo),
          token,
        );
        setSalvo(atualizado);
        setDados(formularioDe(atualizado));
        atualizarNome(atualizado.nome);
        dadosSalvos = true;
      }
      if (vaiTrocarSenha) {
        await alterarSenha(usuario.tipoConta, senhas, token);
        setSenhas(senhasVazias);
      }
      setErros({});
      if (dadosSalvos && vaiTrocarSenha)
        setAviso("Perfil atualizado e senha trocada.");
      else if (vaiTrocarSenha)
        setAviso("Senha trocada. Use a nova senha na próxima vez que entrar.");
      else setAviso("Perfil atualizado.");
    } catch (erro) {
      if (erro.status === 401) {
        sair();
        return;
      }
      const doServidor = { ...erro.campos };
      // E-mail repetido (409) chega só com a mensagem, sem "campos"
      if (erro.status === 409 && Object.keys(doServidor).length === 0)
        doServidor.email = erro.message;
      const semCampo = Object.keys(doServidor).length === 0;
      // Os dados podem ter sido salvos e só a senha ter dado errado
      const parcial = dadosSalvos
        ? "Seus dados foram salvos, mas a senha não foi trocada. "
        : "";
      mostrarErros(
        doServidor,
        semCampo ? `${parcial}${erro.message}` : parcial.trim(),
      );
    }
    setEnviando(false);
  }

  const cartao =
    "rounded-[18px] border border-borda-sutil bg-fundo-superficie p-5 md:p-6";
  const titulo = "font-titulo text-overline uppercase text-texto-terciario";

  return (
    <main className="mx-auto w-full max-w-[1440px] px-5 pb-9 pt-6 md:px-8 md:pt-[30px] lg:px-10">
      <form ref={refFormulario} onSubmit={salvar} noValidate>
        <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
          <div>
            <h1 className="font-titulo text-secao font-semibold text-texto-principal">
              Meu perfil
            </h1>
            <p className="mt-2 text-corpo text-texto-secundario">
              {texto.descricao}
            </p>
          </div>
          {situacao === "pronto" && (
            <div className="flex flex-col gap-[9px] md:shrink-0 md:flex-row">
              <Botao
                variante="neutro"
                onClick={cancelar}
                disabled={!alterado || enviando}
              >
                Cancelar
              </Botao>
              <Botao type="submit" disabled={enviando}>
                {enviando ? "Salvando..." : "Salvar alterações"}
              </Botao>
            </div>
          )}
        </div>

        {aviso && (
          <p
            ref={refAviso}
            tabIndex={-1}
            role="status"
            className="mt-5 rounded-[10px] bg-status-disponivel-fundo px-4 py-3 text-compacto text-status-disponivel-texto focus:outline-none"
          >
            {aviso}
          </p>
        )}
        {erroGeral && (
          <p
            role="alert"
            className="mt-5 rounded-[10px] bg-status-erro-fundo px-4 py-3 text-compacto text-status-erro-texto"
          >
            {erroGeral}
          </p>
        )}

        <div className="mt-6 grid gap-5 lg:grid-cols-[minmax(0,1fr)_370px] lg:items-start">
          <div className="flex flex-col gap-5">
            {situacao === "carregando" && (
              <Carregando texto="Carregando seu perfil..." />
            )}

            {situacao === "erro" && (
              <div role="alert" className="text-corpo text-texto-secundario">
                <p>
                  Não foi possível carregar seu perfil. Confira sua conexão e
                  tente de novo.
                </p>
                <Botao
                  onClick={() => {
                    setSituacao("carregando");
                    setVersao((atual) => atual + 1);
                  }}
                  className="mt-3"
                >
                  Tentar de novo
                </Botao>
              </div>
            )}

            {situacao === "pronto" && (
              <>
                <fieldset className={`${cartao} min-w-0`}>
                  <legend className={`${titulo} float-left mb-[18px] w-full`}>
                    Dados da conta
                  </legend>
                  <div className="clear-left grid gap-x-3 gap-y-[18px] md:grid-cols-2">
                    <CampoTexto
                      rotulo={texto.documento}
                      name="documento"
                      value={dados.documento}
                      readOnly
                      dica="Não editável."
                    />
                    <CampoTexto
                      rotulo={texto.nome}
                      autoComplete={ehAbrigo ? "organization" : "name"}
                      {...campo("nome")}
                    />
                    {ehAbrigo && (
                      <CampoTexto
                        rotulo="Razão social"
                        className="md:col-span-2"
                        {...campo("razaoSocial")}
                      />
                    )}
                    <CampoTexto
                      rotulo="Telefone"
                      type="tel"
                      autoComplete="tel"
                      {...campo("telefone", mascaraTelefone)}
                    />
                    <CampoTexto
                      rotulo="E-mail"
                      type="email"
                      autoComplete="email"
                      dica="Precisa continuar único no sistema."
                      {...campo("email")}
                    />
                  </div>
                </fieldset>

                <div className={cartao}>
                  <CamposEndereco
                    titulo="Endereço"
                    endereco={dados.endereco}
                    erros={erros}
                    aoMudar={mudarEndereco}
                  />
                  <p className="mt-[18px] rounded-[10px] bg-status-atencao-fundo px-4 py-3 text-compacto text-status-atencao-texto">
                    <strong className="font-semibold">
                      {texto.estadoTitulo}
                    </strong>{" "}
                    {texto.estadoTexto}
                  </p>
                </div>

                <fieldset className={`${cartao} min-w-0`}>
                  <legend className={`${titulo} float-left w-full`}>
                    Alterar senha
                  </legend>
                  <p className="clear-left mb-[18px] pt-2 text-compacto text-texto-secundario">
                    Por segurança, pedimos a senha atual. Deixe em branco se não
                    quiser trocar.
                  </p>
                  <div className="grid gap-x-3 gap-y-[18px] md:grid-cols-3">
                    <CampoTexto
                      rotulo="Senha atual"
                      autoComplete="current-password"
                      {...campoDeSenha("senhaAtual")}
                    />
                    <CampoTexto
                      rotulo="Nova senha"
                      autoComplete="new-password"
                      dica="Mínimo de 8 caracteres."
                      {...campoDeSenha("novaSenha")}
                    />
                    <CampoTexto
                      rotulo="Confirmar nova senha"
                      autoComplete="new-password"
                      {...campoDeSenha("confirmacaoNovaSenha")}
                    />
                  </div>
                </fieldset>
              </>
            )}
          </div>

          <aside className="flex flex-col gap-5">
            <section aria-labelledby="perfil-tipo" className={cartao}>
              <h2 id="perfil-tipo" className={titulo}>
                Tipo de conta
              </h2>
              <p className="mt-3 flex items-center gap-[10px] text-compacto text-texto-secundario">
                <Tag variante="destaqueRoxo">{texto.tipo}</Tag>
                {texto.documento}
              </p>
              <p className="mt-3 text-compacto text-texto-secundario">
                {texto.sobreATipo}
              </p>
            </section>

            <section aria-labelledby="perfil-sessao" className={cartao}>
              <h2 id="perfil-sessao" className={titulo}>
                Sessão
              </h2>
              <p className="mt-3 text-compacto text-texto-secundario">
                Você entrou como {usuario.nome}. Seu acesso usa um token com
                prazo de expiração. Ao sair, ele é descartado.
              </p>
              <Botao variante="neutro" className="mt-4" onClick={sairDaConta}>
                Sair da conta
              </Botao>
            </section>
          </aside>
        </div>
      </form>
    </main>
  );
}
