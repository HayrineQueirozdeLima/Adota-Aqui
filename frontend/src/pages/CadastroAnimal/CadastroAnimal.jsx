import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import FormularioAnimal from "../../components/FormularioAnimal/FormularioAnimal";
import { useAuth } from "../../contexts/AuthContext";
import { cadastrarAnimal } from "../../services/animais";
import { buscarPerfil } from "../../services/perfil";
import { useTituloDaPagina } from "../../hooks/useTituloDaPagina";

// Cadastrar animal (UC04, RF04/RF05), em /meus-animais/novo.
// Usuario e Abrigo cadastram do mesmo jeito: o protetor é a conta do token.
export default function CadastroAnimal() {
  const { usuario, token, sair } = useAuth();
  const navegar = useNavigate();
  const [localDaConta, setLocalDaConta] = useState(null);
  useTituloDaPagina("Cadastrar animal");

  // Busca o endereço da conta pra já deixar preenchido onde o animal está.
  // A tela não espera: se o perfil não vier, a pessoa escreve a cidade e escolhe o estado.
  // Sessão vencida (401) volta pro login, como no resto do site
  useEffect(() => {
    let cancelado = false;
    buscarPerfil(usuario.tipoConta, token)
      .then((perfil) => {
        if (cancelado || !perfil?.endereco) return;
        setLocalDaConta({ cidade: perfil.endereco.cidade, estado: perfil.endereco.estado });
      })
      .catch((erro) => {
        if (!cancelado && erro.status === 401) sair();
      });
    return () => {
      cancelado = true;
    };
  }, [usuario.tipoConta, token, sair]);

  async function publicar(dados) {
    const criado = await cadastrarAnimal(dados, token);
    navegar("/meus-animais", {
      state: { aviso: `${criado.nome} foi publicado e já aparece na vitrine.` },
    });
  }

  return (
    <main className="mx-auto w-full max-w-[1440px] px-5 py-6 md:px-14 md:py-8">
      <FormularioAnimal
        titulo="Cadastrar animal"
        subtitulo="Quanto mais completo o perfil, menos perguntas o adotante precisa fazer depois."
        textoEnviar="Publicar animal"
        localSugerido={localDaConta}
        aoEnviar={publicar}
        cancelarPara="/meus-animais"
      />
    </main>
  );
}
