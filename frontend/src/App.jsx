import RastroDePatas from "./components/RastroDePatas/RastroDePatas";
import { AuthProvider } from "./contexts/AuthContext";
import AppRoutes from "./routes/AppRoutes";

// O AuthProvider fica por fora das rotas, assim toda tela sabe quem está logado.
// O rastro de patas do mouse vale pro site inteiro
function App() {
  return (
    <AuthProvider>
      <AppRoutes />
      <RastroDePatas />
    </AuthProvider>
  );
}

export default App;
