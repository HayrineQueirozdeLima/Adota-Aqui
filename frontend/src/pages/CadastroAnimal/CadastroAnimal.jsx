import { useNavigate } from "react-router-dom";
import FormularioAnimal from "../../components/FormularioAnimal/FormularioAnimal";
import { useAuth } from "../../contexts/AuthContext";
import { cadastrarAnimal } from "../../services/animais";

// Cadastrar animal (UC04, RF04/RF05), em /meus-animais/novo.
// Usuario e Abrigo cadastram do mesmo jeito: o protetor é a conta do token.
export default function CadastroAnimal() {
  const { token } = useAuth();
  const navegar = useNavigate();

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
        aoEnviar={publicar}
        cancelarPara="/meus-animais"
      />
    </main>
  );
}
