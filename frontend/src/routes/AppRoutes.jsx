import { Routes, Route } from "react-router-dom";

import Layout from "../components/Layout/Layout";
import Home from "../pages/Home/Home";
import ListaAnimais from "../pages/ListaAnimais/ListaAnimais";
import PerfilAnimal from "../pages/PerfilAnimal/PerfilAnimal";
import Login from "../pages/Login/Login";
import EscolhaCadastro from "../pages/EscolhaCadastro/EscolhaCadastro";
import CadastroUsuario from "../pages/CadastroUsuario/CadastroUsuario";
import CadastroAbrigo from "../pages/CadastroAbrigo/CadastroAbrigo";
import DemonstrarInteresse from "../pages/DemonstrarInteresse/DemonstrarInteresse";
import MeusAnimais from "../pages/MeusAnimais/MeusAnimais";
import CadastroAnimal from "../pages/CadastroAnimal/CadastroAnimal";
import EditarAnimal from "../pages/EditarAnimal/EditarAnimal";
import InteressesRecebidos from "../pages/InteressesRecebidos/InteressesRecebidos";
import MeusInteresses from "../pages/MeusInteresses/MeusInteresses";
import Perfil from "../pages/Perfil/Perfil";
import NaoEncontrada from "../pages/NaoEncontrada/NaoEncontrada";

// Todas as rotas do sistema ficam aqui. Ao criar uma nova tela, lembrar de criar a rota correspondente
export default function AppRoutes() {
  return (
    <Routes>
      {/* Sem Navbar, tem o painel roxo no lugar */}
      {/* Públicas: qualquer pessoa acessa, com ou sem login */}
      <Route path="/login" element={<Login />} />
      <Route path="/cadastro" element={<EscolhaCadastro />} />
      <Route path="/cadastro/usuario" element={<CadastroUsuario />} />
      <Route path="/cadastro/abrigo" element={<CadastroAbrigo />} />

      {/* Com Navbar, todas as rotas aqui dentro aparecem dentro do Layout */}
      <Route element={<Layout />}>
        {/* Públicas */}
        <Route path="/" element={<Home />} />
        <Route path="/animais" element={<ListaAnimais />} />
        <Route path="/animais/:id" element={<PerfilAnimal />} />

        {/* Precisam de login. A proteção entra junto com a issue do login */}
        <Route
          path="/animais/:id/interesse"
          element={<DemonstrarInteresse />}
        />
        <Route path="/meus-animais" element={<MeusAnimais />} />
        <Route path="/meus-animais/novo" element={<CadastroAnimal />} />
        <Route path="/meus-animais/:id/editar" element={<EditarAnimal />} />
        <Route path="/interesses-recebidos" element={<InteressesRecebidos />} />
        <Route path="/meus-interesses" element={<MeusInteresses />} />
        <Route path="/perfil" element={<Perfil />} />

        {/* Qualquer endereço que não existe cai aqui.*/}
        <Route path="*" element={<NaoEncontrada />} />
      </Route>
    </Routes>
  );
}
