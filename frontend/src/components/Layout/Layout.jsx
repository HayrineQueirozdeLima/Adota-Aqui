import { Outlet } from "react-router-dom";
import Navbar from "../Navbar/Navbar";
import { useAuth } from "../../contexts/AuthContext";

export default function Layout() {
  // null quando é visitante; { id, nome, tipoConta } quando tem alguém logado
  const { usuario } = useAuth();

  return (
    <>
      <Navbar usuario={usuario} />
      <Outlet />
    </>
  );
}
