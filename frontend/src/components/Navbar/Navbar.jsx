import { useEffect, useRef, useState } from "react";
import { Link, NavLink, useLocation, useNavigate } from "react-router-dom";
import Botao from "../Botao/Botao";
import BotaoTema from "../BotaoTema/BotaoTema";
import logo from "../../assets/logo-sobre-marca.svg";
import { useIaDisponivel } from "../../hooks/useIaDisponivel";
import { iniciais } from "../../utils/rotulos";

// Contorno branco de foco, pra quem navega pelo teclado enxergar em cima do roxo
const foco =
  "rounded-sm focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-texto-sobre-marca";

// As páginas abertas pra qualquer pessoa. No computador ficam no topo; no celular e no tablet, no botão "Menu".
// "nome" é o que cabe no topo; "completo" e "sobre" aparecem no menu do celular.
// O "Me ajuda a escolher" some quando a IA não está ligada no servidor
const secoesDoSite = [
  { para: "/animais", nome: "Animais", completo: "Animais para adoção", sobre: "Cães e gatos esperando um lar" },
  {
    para: "/me-ajuda-a-escolher",
    nome: "Me ajuda a escolher",
    completo: "Me ajuda a escolher",
    sobre: "A IA sugere animais pra sua rotina",
    comIa: true,
  },
  { para: "/feiras", nome: "Feiras", completo: "Feiras de adoção", sobre: "Conheça os animais pessoalmente" },
  { para: "/clinicas", nome: "Clínicas", completo: "Clínicas veterinárias", sobre: "Veterinários perto de você" },
  {
    para: "/observatorio",
    nome: "Observatório",
    completo: "Observatório da adoção",
    sobre: "Os números da adoção no Brasil",
  },
  { para: "/blog", nome: "Blog", completo: "Blog para tutores", sobre: "Dicas de quem cuida" },
];

// O que é de quem está logado, no botão "Minha área".
// Abrigo não demonstra interesse (RF14), então não tem candidaturas; e só abrigo divulga feira
const itensDaMinhaArea = [
  { para: "/perfil", nome: "Meu perfil" },
  { para: "/meus-animais", nome: "Meus animais" },
  { para: "/meus-interesses", nome: "Minhas candidaturas", so: "USUARIO" },
  { para: "/interesses-recebidos", nome: "Interesses recebidos" },
  { para: "/feiras/nova", nome: "Divulgar uma feira", so: "ABRIGO" },
];

// Fecha o menu aberto quando a pessoa clica fora dele (do botão e da lista) ou aperta Esc.
// No Esc o foco volta pro botão, pra quem usa teclado não se perder
function useFecharDeFora(aberto, fechar, botao, lista) {
  useEffect(() => {
    if (!aberto) return undefined;
    function aoClicar(evento) {
      const dentro = [botao, lista].some((parte) => parte.current?.contains(evento.target));
      if (!dentro) fechar();
    }
    function aoTeclar(evento) {
      if (evento.key !== "Escape") return;
      fechar();
      botao.current?.focus();
    }
    document.addEventListener("mousedown", aoClicar);
    document.addEventListener("keydown", aoTeclar);
    return () => {
      document.removeEventListener("mousedown", aoClicar);
      document.removeEventListener("keydown", aoTeclar);
    };
  }, [aberto, fechar, botao, lista]);
}

// Topo de todas as telas (menos login e cadastro, que têm o painel roxo no lugar).
// Fica preso no alto da tela enquanto a página rola.
// Recebe o usuario logado no formato { nome, tipoConta }, ou null se for visitante, e o aoSair do AuthContext
export default function Navbar({ usuario, aoSair }) {
  const ia = useIaDisponivel();
  const { pathname } = useLocation();
  const [menuAberto, setMenuAberto] = useState(false);
  const botaoMenu = useRef(null);
  const painel = useRef(null);
  const fecharMenu = useRef(() => setMenuAberto(false)).current;

  // Trocou de página, o menu fecha
  useEffect(() => {
    setMenuAberto(false);
  }, [pathname]);
  useFecharDeFora(menuAberto, fecharMenu, botaoMenu, painel);

  // Enquanto a resposta da IA não chega (null), o link já aparece, pra o menu não pular depois
  const secoes = secoesDoSite.filter((secao) => !secao.comIa || ia !== false);

  return (
    <header className="sticky top-0 z-40 bg-fundo-marca shadow-[0_10px_24px_-18px_rgb(0_0_0/0.6)]">
      <a
        href="#conteudo"
        onClick={(evento) => {
          evento.preventDefault();
          document.getElementById("conteudo")?.focus();
        }}
        className="sr-only rounded-[10px] bg-fundo-superficie px-4 py-2 font-titulo text-botao font-semibold text-marca-roxo focus:not-sr-only focus:absolute focus:left-4 focus:top-3 focus:z-50"
      >
        Pular para o conteúdo
      </a>

      <div className="relative mx-auto flex max-w-[1440px] items-center gap-6 px-5 py-3 md:px-14 xl:py-3.5">
        <Link to="/" aria-label="Adota Aqui, página inicial" className={`min-w-0 shrink ${foco}`}>
          {/* object-contain: se faltar espaço no celular de 320 px, o logo diminui sem achatar */}
          <img src={logo} alt="" className="h-[35px] w-auto object-contain object-left md:h-[42px]" />
        </Link>

        <nav aria-label="Menu principal" className="hidden xl:block">
          <ul className="flex items-center gap-6">
            {secoes.map((secao) => (
              <li key={secao.para}>
                <NavLink
                  to={secao.para}
                  className={({ isActive }) =>
                    `block whitespace-nowrap border-b-2 pb-[5px] pt-1 font-titulo text-botao font-semibold text-texto-sobre-marca ${
                      isActive ? "border-acao-terracota" : "border-transparent hover:border-white/40"
                    } ${foco}`
                  }
                >
                  {secao.nome}
                </NavLink>
              </li>
            ))}
          </ul>
        </nav>

        <div className="ml-auto flex shrink-0 items-center gap-1 sm:gap-3">
          <BotaoTema />
          {usuario ? (
            <MinhaArea usuario={usuario} aoSair={aoSair} />
          ) : (
            <>
              {/* No celular pequeno o Cadastrar vai pra dentro do Menu, pra caber o botão dele */}
              <Link
                to="/cadastro"
                className={`hidden min-h-11 items-center font-titulo text-botao font-semibold text-texto-sobre-marca sm:inline-flex ${foco}`}
              >
                Cadastrar
              </Link>
              <Botao variante="contorno" para="/login">
                Entrar
              </Botao>
            </>
          )}
          <button
            ref={botaoMenu}
            type="button"
            aria-expanded={menuAberto}
            aria-controls="menu-do-site"
            onClick={() => setMenuAberto((aberto) => !aberto)}
            className={`inline-flex min-h-11 min-w-11 items-center justify-center gap-2 rounded-full px-2 font-titulo text-botao font-semibold text-texto-sobre-marca hover:bg-white/10 sm:px-3 xl:hidden ${foco}`}
          >
            <IconeMenu aberto={menuAberto} />
            <span className="sr-only sm:not-sr-only">Menu</span>
          </button>
        </div>
      </div>

      {menuAberto && (
        <nav
          ref={painel}
          id="menu-do-site"
          aria-label="Páginas do site"
          className="max-h-[calc(100dvh-68px)] overflow-y-auto border-t border-white/15 xl:hidden"
        >
          <div className="mx-auto max-w-[1440px] px-1 pb-5 pt-2 md:px-10">
            <ul className="grid gap-1 sm:grid-cols-2">
              {secoes.map((secao) => (
                <li key={secao.para}>
                  <NavLink
                    to={secao.para}
                    onClick={fecharMenu}
                    className={({ isActive }) =>
                      `flex flex-col rounded-[12px] border-l-4 px-3 py-2.5 text-texto-sobre-marca hover:bg-white/10 ${
                        isActive ? "border-acao-terracota bg-white/10" : "border-transparent"
                      } ${foco}`
                    }
                  >
                    <span className="font-titulo text-item font-semibold">{secao.completo}</span>
                    <span className="text-legenda opacity-80">{secao.sobre}</span>
                  </NavLink>
                </li>
              ))}
            </ul>
            {!usuario && (
              <div className="mt-3 px-2 sm:hidden">
                <Botao para="/cadastro" onClick={fecharMenu} className="w-full">
                  Criar conta
                </Botao>
              </div>
            )}
          </div>
        </nav>
      )}
    </header>
  );
}

// "Minha área": as iniciais da pessoa e, no computador, o nome do botão.
// Abre a lista com o que é dela. A lista fica no canto direito do topo, em qualquer tamanho de tela
function MinhaArea({ usuario, aoSair }) {
  const { pathname } = useLocation();
  const navegar = useNavigate();
  const [aberta, setAberta] = useState(false);
  const botao = useRef(null);
  const lista = useRef(null);
  const fechar = useRef(() => setAberta(false)).current;

  useEffect(() => {
    setAberta(false);
  }, [pathname]);
  useFecharDeFora(aberta, fechar, botao, lista);

  const itens = itensDaMinhaArea.filter((item) => !item.so || item.so === usuario.tipoConta);

  function sair() {
    fechar();
    aoSair?.();
    navegar("/", { replace: true });
  }

  return (
    <>
      <button
        ref={botao}
        type="button"
        aria-expanded={aberta}
        aria-controls="minha-area"
        onClick={() => setAberta((estava) => !estava)}
        className={`flex min-h-11 items-center gap-2 rounded-full pl-1 pr-1 text-texto-sobre-marca hover:bg-white/10 xl:pr-3 ${foco}`}
      >
        <span
          aria-hidden="true"
          className="flex size-[34px] items-center justify-center rounded-full bg-texto-sobre-marca font-titulo text-campo font-semibold text-fundo-marca md:size-9"
        >
          {iniciais(usuario.nome)}
        </span>
        <span className="sr-only font-titulo text-botao font-semibold xl:not-sr-only">Minha área</span>
        <IconeSeta aberta={aberta} />
      </button>

      {aberta && (
        <div
          ref={lista}
          id="minha-area"
          className="absolute right-3 top-full z-50 mt-1 w-[min(17rem,calc(100vw-1.5rem))] rounded-[14px] border border-borda-sutil bg-fundo-superficie p-2 shadow-[0_18px_40px_-16px_rgb(0_0_0/0.45)] md:right-12"
        >
          <p className="truncate px-3 pb-2 pt-1 text-legenda text-texto-terciario">Entrou como {usuario.nome}</p>
          <ul>
            {itens.map((item) => (
              <li key={item.para}>
                <NavLink
                  to={item.para}
                  end
                  onClick={fechar}
                  className={({ isActive }) =>
                    `block rounded-[10px] px-3 py-2.5 font-titulo text-botao font-semibold focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-[-2px] focus-visible:outline-marca-roxo ${
                      isActive
                        ? "bg-marca-roxo-suave text-marca-roxo"
                        : "text-texto-principal hover:bg-marca-roxo-suave"
                    }`
                  }
                >
                  {item.nome}
                </NavLink>
              </li>
            ))}
          </ul>
          <div className="mt-1 border-t border-borda-sutil pt-1">
            <button
              type="button"
              onClick={sair}
              className="block w-full rounded-[10px] px-3 py-2.5 text-left font-titulo text-botao font-semibold text-texto-secundario hover:bg-marca-roxo-suave focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-[-2px] focus-visible:outline-marca-roxo"
            >
              Sair
            </button>
          </div>
        </div>
      )}
    </>
  );
}

function IconeMenu({ aberto }) {
  return (
    <svg
      aria-hidden="true"
      viewBox="0 0 24 24"
      className="size-6"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
    >
      {aberto ? <path d="M6 6l12 12M18 6L6 18" /> : <path d="M4 7h16M4 12h16M4 17h16" />}
    </svg>
  );
}

function IconeSeta({ aberta }) {
  return (
    <svg
      aria-hidden="true"
      viewBox="0 0 24 24"
      className={`hidden size-4 transition-transform motion-reduce:transition-none xl:block ${aberta ? "rotate-180" : ""}`}
      fill="none"
      stroke="currentColor"
      strokeWidth="2.4"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M6 9l6 6 6-6" />
    </svg>
  );
}
