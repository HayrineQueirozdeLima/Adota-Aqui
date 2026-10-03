import { useNavigate } from "react-router-dom";
import Botao from "../../components/Botao/Botao";
import { useAuth } from "../../contexts/AuthContext";

// A tela completa do perfil (UC10) vem na issue dela. Por enquanto, daqui dá pra sair da conta.
export default function Perfil() {
  const { usuario, sair } = useAuth();
  const navegar = useNavigate();

  function sairDaConta() {
    sair();
    navegar("/", { replace: true });
  }

  return (
    <main className="px-5 py-8 md:px-14">
      <h1 className="font-titulo text-secao font-semibold text-texto-principal">
        Meu perfil
      </h1>
      <p className="mt-2 text-corpo text-texto-secundario">
        Você entrou como {usuario.nome}.
      </p>
      <Botao variante="secundario" className="mt-6" onClick={sairDaConta}>
        Sair da conta
      </Botao>
    </main>
  );
}
