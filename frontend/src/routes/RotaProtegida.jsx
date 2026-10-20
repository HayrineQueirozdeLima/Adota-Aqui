import { Navigate, Outlet, useLocation } from "react-router-dom";
import { useAuth } from "../contexts/AuthContext";

// Envolve as rotas que precisam de login. Sem login, manda pro /login e guarda de onde
// a pessoa veio, pra voltar pra lá depois de entrar.
// apenasUsuario barra o Abrigo nas telas que são só de pessoa física (RF14: só o Usuario adota).
export default function RotaProtegida({ apenasUsuario = false }) {
  const { usuario } = useAuth();
  const local = useLocation();

  if (!usuario) {
    return <Navigate to="/login" replace state={{ de: local.pathname }} />;
  }
  if (apenasUsuario && usuario.tipoConta !== "USUARIO") {
    return <Navigate to="/" replace />;
  }
  return <Outlet />;
}
