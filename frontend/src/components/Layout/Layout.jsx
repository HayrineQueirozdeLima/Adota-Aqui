import { Outlet } from "react-router-dom";
import Navbar from "../Navbar/Navbar";
import Rodape from "../Rodape/Rodape";
import { useAuth } from "../../contexts/AuthContext";

export default function Layout() {
  // null quando é visitante; { id, nome, tipoConta } quando tem alguém logado
  const { usuario } = useAuth();

  // O flex-1 empurra o rodapé pro fim da tela quando a página tem pouco conteúdo
  return (
    <div className="flex min-h-screen flex-col">
      <Navbar usuario={usuario} />
      <div className="flex-1">
        <Outlet />
      </div>
      <Rodape />
    </div>
  );
}
