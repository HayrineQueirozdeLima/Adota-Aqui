import FormularioCadastro from "../../components/FormularioCadastro/FormularioCadastro";
import LayoutAutenticacao from "../../components/LayoutAutenticacao/LayoutAutenticacao";
import { useTituloDaPagina } from "../../hooks/useTituloDaPagina";

// UC01: conta de pessoa física (CPF)
export default function CadastroUsuario() {
  useTituloDaPagina("Criar conta pessoal");
  return (
    <LayoutAutenticacao
      frase="Resgatou um animal? Te ajudamos a encontrar um lar."
      itens={[
        "Cadastre os animais resgatados",
        "Receba os interesses e escolha o tutor",
        "Você avalia, você decide",
      ]}
      rodape="A validação final (entrevista, visita, decisão) é sempre do Protetor. O Adota Aqui é a ponte de contato."
    >
      <FormularioCadastro tipo="USUARIO" />
    </LayoutAutenticacao>
  );
}
