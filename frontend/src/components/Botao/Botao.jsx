import { Link } from "react-router-dom";

//aparências possíveis do botão
const variantes = {
  // Terracota cheio: a ação principal da tela
  primario:
    "bg-acao-terracota text-acao-terracota-texto focus-visible:outline-marca-roxo",
  // Só o contorno branco: usado em cima do roxo, no topo (ex.: "Entrar").
  // Por isso o foco dele é branco, e não roxo.
  contorno:
    "border-[1.5px] border-texto-sobre-marca text-texto-sobre-marca focus-visible:outline-texto-sobre-marca",
  // Contorno roxo: ação secundária em fundo claro (ex.: "Cadastrar CPF", no login)
  secundario:
    "border-[1.5px] border-marca-roxo text-marca-roxo focus-visible:outline-marca-roxo",
  // Contorno vermelho: ação que encerra algo (ex.: "Descontinuar", no painel de interesses)
  perigo:
    "border-[1.5px] border-status-erro-texto text-status-erro-texto focus-visible:outline-status-erro-texto",
  // Contorno cinza: ação discreta, que só mostra informação (ex.: "Ver detalhes")
  neutro:
    "border-[1.5px] border-borda-forte text-texto-secundario focus-visible:outline-marca-roxo",
};

// O que todo botão tem igual
const base =
  "inline-flex items-center justify-center rounded-[11px] px-[18px] py-[13px] " +
  "font-titulo font-semibold text-botao whitespace-nowrap " +
  "focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 " +
  "disabled:cursor-not-allowed disabled:opacity-60";

// Se receber "para", vira um link de navegação. Se não, é um botão de ação.
export default function Botao({
  variante = "primario",
  para,
  className = "",
  children,
  ...resto
}) {
  const classes = `${base} ${variantes[variante]} ${className}`;

  if (para) {
    return (
      <Link to={para} className={classes} {...resto}>
        {children}
      </Link>
    );
  }

  return (
    <button type="button" className={classes} {...resto}>
      {children}
    </button>
  );
}
