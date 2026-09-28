import { useParams } from "react-router-dom";

export default function PerfilAnimal() {
  // Pega o pedaço variável da URL: em /animais/123, o id é "123"
  const { id } = useParams();

  return <h1>Perfil do animal {id}</h1>;
}
