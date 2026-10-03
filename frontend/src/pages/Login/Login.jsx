import { useRef, useState } from "react";
import { Navigate, useLocation, useNavigate } from "react-router-dom";
import Botao from "../../components/Botao/Botao";
import CampoTexto from "../../components/CampoTexto/CampoTexto";
import LayoutAutenticacao from "../../components/LayoutAutenticacao/LayoutAutenticacao";
import { useAuth } from "../../contexts/AuthContext";
import { useFocoNoPrimeiroErro } from "../../hooks/useFocoNoPrimeiroErro";
import { autenticar } from "../../services/autenticacao";
import { mascaraDocumento, somenteNumeros } from "../../utils/mascaras";
import { validarLogin } from "../../utils/validacoes";

// UC03: entra com CPF (Usuario) ou CNPJ (Abrigo) e senha
export default function Login() {
  const { usuario, entrar } = useAuth();
  const navegar = useNavigate();
  const local = useLocation();
  const refFormulario = useRef(null);
  const [documento, setDocumento] = useState("");
  const [senha, setSenha] = useState("");
  const [manterConectada, setManterConectada] = useState(false);
  const [erros, setErros] = useState({});
  const [erroGeral, setErroGeral] = useState("");
  const [enviando, setEnviando] = useState(false);
  const [tentativas, setTentativas] = useState(0);
  useFocoNoPrimeiroErro(refFormulario, tentativas);

  // Se veio de uma tela que pedia login (RotaProtegida), volta pra ela depois de entrar
  const destino = local.state?.de ?? "/animais";

  if (usuario) return <Navigate to={destino} replace />;

  async function enviar(evento) {
    evento.preventDefault();
    setErroGeral("");

    const encontrados = validarLogin({ documento, senha });
    setErros(encontrados);
    if (Object.keys(encontrados).length > 0) {
      setTentativas((total) => total + 1);
      return;
    }

    setEnviando(true);
    try {
      const sessao = await autenticar(somenteNumeros(documento), senha);
      entrar(sessao, manterConectada);
      navegar(destino, { replace: true });
    } catch (erro) {
      setErroGeral(erro.message);
      setEnviando(false);
    }
  }

  return (
    <LayoutAutenticacao
      frase="Todo animal merece um lar de verdade."
      itens={[
        "Veja animais disponíveis no seu estado",
        "Demonstre interesse e receba o contato do Protetor",
        "Cadastre um animal que você resgatou",
      ]}
      rodape="Maus-tratos e abandono são crimes no Brasil (Leis nº 9.605/1998 e nº 14.064/2020). A plataforma é uma ponte de contato: a validação final é sempre do Protetor."
    >
      <h1 className="font-titulo text-secao font-semibold text-texto-principal">
        Entrar na sua conta
      </h1>

      <form
        ref={refFormulario}
        onSubmit={enviar}
        noValidate
        className="mt-5 flex flex-col gap-[18px]"
      >
        <CampoTexto
          rotulo="CPF ou CNPJ"
          name="documento"
          inputMode="numeric"
          autoComplete="username"
          placeholder="000.000.000-00 ou 00.000.000/0000-00"
          value={documento}
          erro={erros.documento}
          onChange={(evento) => {
            setDocumento(mascaraDocumento(evento.target.value));
            setErros((atuais) => ({ ...atuais, documento: undefined }));
          }}
        />
        <CampoTexto
          rotulo="Senha"
          name="senha"
          type="password"
          autoComplete="current-password"
          value={senha}
          erro={erros.senha}
          onChange={(evento) => {
            setSenha(evento.target.value);
            setErros((atuais) => ({ ...atuais, senha: undefined }));
          }}
        />

        <label className="flex w-fit items-center gap-[9px] text-compacto text-texto-secundario">
          <input
            type="checkbox"
            checked={manterConectada}
            onChange={(evento) => setManterConectada(evento.target.checked)}
            className="size-[18px] accent-marca-roxo"
          />
          Manter conta conectada
        </label>

        {erroGeral && (
          <p
            role="alert"
            className="rounded-[10px] bg-status-erro-fundo px-4 py-3 text-compacto text-status-erro-texto"
          >
            {erroGeral}
          </p>
        )}

        <Botao type="submit" className="w-full" disabled={enviando}>
          {enviando ? "Entrando..." : "Entrar"}
        </Botao>
        {enviando && (
          <p role="status" className="text-legenda text-texto-terciario">
            Se o servidor estava parado, a primeira resposta pode levar até 1
            minuto.
          </p>
        )}
      </form>

      <p className="mt-6 text-compacto text-texto-secundario">
        Ainda não tem conta?
      </p>
      <div className="mt-3 flex flex-col gap-3 sm:flex-row">
        <Botao variante="secundario" para="/cadastro/usuario">
          Cadastrar CPF
        </Botao>
        <Botao variante="secundario" para="/cadastro/abrigo">
          Cadastrar Abrigo (CNPJ)
        </Botao>
      </div>
    </LayoutAutenticacao>
  );
}
