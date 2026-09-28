import { Link, NavLink } from "react-router-dom";
import Botao from "../Botao/Botao";
import logo from "../../assets/logo-sobre-marca.svg";
import { iniciais } from "../../utils/rotulos";

// Contorno branco de foco, pra quem navega pelo teclado enxergar em cima do roxo
const foco =
  "rounded-sm focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-texto-sobre-marca";

// Itens do menu de quem está logado.
// "curto" é o texto que cabe no celular; "completo" aparece do tablet pra cima.
const itensMenu = [
  { para: "/animais", completo: "Explorar", curto: "Explorar" },
  { para: "/meus-animais", completo: "Meus animais", curto: "Meus animais" },
  // Abrigo não demonstra interesse (RF14), então não tem candidaturas
  {
    para: "/meus-interesses",
    completo: "Minhas candidaturas",
    curto: "Candidaturas",
    soUsuario: true,
  },
  {
    para: "/interesses-recebidos",
    completo: "Interesses recebidos",
    curto: "Interesses",
  },
];

// Topo de todas as telas (menos login e cadastro, que têm o painel roxo no lugar).
// Recebe o usuario logado no formato { nome, tipoConta }, ou null se for visitante.
export default function Navbar({ usuario }) {
  if (!usuario) {
    return <NavbarVisitante />;
  }
  return <NavbarLogado usuario={usuario} />;
}

function NavbarVisitante() {
  return (
    <header className="bg-fundo-marca">
      <div className="flex items-center justify-between px-5 py-3.5 md:px-8 lg:px-14">
        <Link to="/" aria-label="Adota Aqui, página inicial" className={foco}>
          <img src={logo} alt="" className="h-[35px] w-auto md:h-[46px]" />
        </Link>

        <div className="flex items-center gap-[18px]">
          <Link
            to="/cadastro"
            className={`font-titulo font-semibold text-botao text-texto-sobre-marca ${foco}`}
          >
            Cadastrar
          </Link>
          <Botao variante="contorno" para="/login">
            Entrar
          </Botao>
        </div>
      </div>
    </header>
  );
}

function NavbarLogado({ usuario }) {
  const itens = itensMenu.filter(
    (item) => !item.soUsuario || usuario.tipoConta === "USUARIO",
  );

  return (
    <header className="bg-fundo-marca">
      <div className="flex flex-wrap items-center gap-x-[22px] px-5 pt-3 md:flex-nowrap md:px-8 md:py-3.5 lg:px-10">
        <Link
          to="/"
          aria-label="Adota Aqui, página inicial"
          className={`order-1 ${foco}`}
        >
          <img src={logo} alt="" className="h-[35px] w-auto md:h-[38px]" />
        </Link>

        {/* No celular, o avatar fica na primeira linha e o menu desce pra segunda */}
        <Link
          to="/perfil"
          aria-label="Meu perfil"
          className={`order-2 ml-auto flex size-[34px] items-center justify-center rounded-full bg-texto-sobre-marca font-titulo font-semibold text-campo text-fundo-marca md:order-3 md:size-9 ${foco}`}
        >
          {iniciais(usuario.nome)}
        </Link>

        <nav
          aria-label="Menu principal"
          className="order-3 mt-3 w-full overflow-x-auto md:order-2 md:mt-0 md:w-auto md:flex-1"
        >
          <ul className="flex gap-3 md:gap-5">
            {itens.map((item) => (
              <li key={item.para}>
                <NavLink
                  to={item.para}
                  aria-label={item.completo}
                  className={({ isActive }) =>
                    `block whitespace-nowrap border-b-2 pb-[5px] pt-1 font-titulo font-semibold text-botao text-texto-sobre-marca ${
                      isActive ? "border-acao-terracota" : "border-transparent"
                    } ${foco}`
                  }
                >
                  <span className="md:hidden">{item.curto}</span>
                  <span className="hidden md:inline">{item.completo}</span>
                </NavLink>
              </li>
            ))}
          </ul>
        </nav>
      </div>
    </header>
  );
}
