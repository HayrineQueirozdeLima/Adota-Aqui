import { Outlet } from "react-router-dom";
import Navbar from "../Navbar/Navbar";
import Rodape from "../Rodape/Rodape";
import { useAuth } from "../../contexts/AuthContext";

export default function Layout() {
  // null quando é visitante; { id, nome, tipoConta } quando tem alguém logado
  const { usuario, sair } = useAuth();

  // O flex-1 empurra o rodapé pro fim da tela quando a página tem pouco conteúdo.
  // O id="conteudo" é o destino do "Pular para o conteúdo" do topo
  return (
    <div className="flex min-h-screen flex-col">
      <Navbar usuario={usuario} aoSair={sair} />
      <div id="conteudo" tabIndex={-1} className="flex-1 focus:outline-none">
        <Outlet />
      </div>
      <Rodape />
    </div>
  );
}
