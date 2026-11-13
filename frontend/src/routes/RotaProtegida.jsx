import { Navigate, Outlet, useLocation } from "react-router-dom";
import { useAuth } from "../contexts/AuthContext";

// Envolve as rotas que precisam de login. Sem login, manda pro /login e guarda de onde
// a pessoa veio, pra voltar pra lá depois de entrar.
// apenasUsuario barra o Abrigo nas telas que são só de pessoa física (RF14: só o Usuario adota).
// apenasAbrigo faz o contrário, nas telas que são só de abrigo (divulgar feira de adoção), e volta pras feiras.
export default function RotaProtegida({ apenasUsuario = false, apenasAbrigo = false }) {
  const { usuario } = useAuth();
  const local = useLocation();

  if (!usuario) {
    return <Navigate to="/login" replace state={{ de: local.pathname }} />;
  }
  if (apenasUsuario && usuario.tipoConta !== "USUARIO") {
    return <Navigate to="/" replace />;
  }
  if (apenasAbrigo && usuario.tipoConta !== "ABRIGO") {
    return <Navigate to="/feiras" replace />;
  }
  return <Outlet />;
}
