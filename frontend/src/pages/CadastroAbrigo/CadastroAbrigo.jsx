import FormularioCadastro from "../../components/FormularioCadastro/FormularioCadastro";
import LayoutAutenticacao from "../../components/LayoutAutenticacao/LayoutAutenticacao";

// UC02: conta institucional (CNPJ), com login único compartilhado pela equipe
export default function CadastroAbrigo() {
  return (
    <LayoutAutenticacao
      frase="Seu abrigo, visível para quem quer adotar."
      itens={[
        "Cadastre os animais resgatados",
        "Painel com todos os interesses recebidos",
        "Login único",
      ]}
      rodape="A validação final (entrevista, visita, decisão) é sempre do Protetor. O Adota Aqui é a ponte de contato."
    >
      <FormularioCadastro tipo="ABRIGO" />
    </LayoutAutenticacao>
  );
}
