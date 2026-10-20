import { Link } from "react-router-dom";
import LayoutAutenticacao from "../../components/LayoutAutenticacao/LayoutAutenticacao";

// Não tem tela no Figma: é o caminho do "Cadastrar" do topo até um dos dois formulários
const opcoes = [
  {
    para: "/cadastro/usuario",
    titulo: "Pessoa física (CPF)",
    descricao: "Para adotar um animal ou divulgar um que você resgatou.",
  },
  {
    para: "/cadastro/abrigo",
    titulo: "ONG ou abrigo (CNPJ)",
    descricao: "Conta da instituição, com um login só para toda a equipe.",
  },
];

export default function EscolhaCadastro() {
  return (
    <LayoutAutenticacao frase="Todo animal merece um lar de verdade.">
      <h1 className="font-titulo text-secao font-semibold text-texto-principal">
        Criar conta
      </h1>
      <p className="mt-2 text-compacto text-texto-secundario">
        Quem vai usar a conta?
      </p>

      <ul className="mt-6 flex flex-col gap-3">
        {opcoes.map((opcao) => (
          <li key={opcao.para}>
            <Link
              to={opcao.para}
              className="block rounded-[12px] border-[1.5px] border-borda-forte bg-fundo-superficie px-5 py-4 hover:border-marca-roxo focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-marca-roxo"
            >
              <span className="block font-titulo text-item font-semibold text-marca-roxo">
                {opcao.titulo}
              </span>
              <span className="mt-1 block text-compacto text-texto-secundario">
                {opcao.descricao}
              </span>
            </Link>
          </li>
        ))}
      </ul>

      <p className="mt-6 text-compacto text-texto-secundario">
        Já tem conta?{" "}
        <Link
          to="/login"
          className="font-titulo font-semibold text-marca-roxo hover:underline"
        >
          Entrar
        </Link>
      </p>
    </LayoutAutenticacao>
  );
}
