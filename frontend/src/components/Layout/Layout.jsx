import { Outlet } from "react-router-dom";
import Navbar from "../Navbar/Navbar";

// Por enquanto ninguém está logado
// quando a issue do login criar o AuthContext, o usuario passa a vir de lá
// Pra ver o topo logado, troque temporariamente por:
// const usuario = { nome: "Marina Prado", tipoConta: "USUARIO" };
const usuario = null;

export default function Layout() {
  return (
    <>
      <Navbar usuario={usuario} />
      <Outlet />
    </>
  );
}
