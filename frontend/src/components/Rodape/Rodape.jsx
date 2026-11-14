import { Link } from "react-router-dom";
import logoClaro from "../../assets/logo-marca.svg";
import logoEscuro from "../../assets/logo-sobre-marca.svg";
import { URL_API } from "../../config/ambiente";
import { useIaDisponivel } from "../../hooks/useIaDisponivel";

// Os links do rodapé, em grupos pelo que a pessoa quer fazer.
// "fora" marca os links que saem do site (abrem em outra aba). "comIa" some quando a IA não está ligada no servidor.
// Redes sociais e "Fale conosco" entram quando existirem
const grupos = [
  {
    titulo: "Adotar",
    links: [
      { texto: "Explorar animais", para: "/animais" },
      { texto: "Me ajuda a escolher", para: "/me-ajuda-a-escolher", comIa: true },
      { texto: "Como adotar", para: { pathname: "/", hash: "#como-funciona" } },
      { texto: "Feiras de adoção", para: "/feiras" },
      { texto: "Histórias de adoção", para: "/historias" },
    ],
  },
  {
    titulo: "Cuidar",
    links: [
      { texto: "Clínicas veterinárias", para: "/clinicas" },
      { texto: "Blog para tutores", para: "/blog" },
    ],
  },
  {
    titulo: "Para protetores",
    links: [
      { texto: "Abrigos e protetores independentes", para: "/protetores" },
      { texto: "Cadastrar um animal", para: "/meus-animais/novo" },
      { texto: "Divulgar uma feira", para: "/feiras/nova" },
    ],
  },
  {
    titulo: "O projeto",
    links: [
      { texto: "Quem somos", para: "/quem-somos" },
      { texto: "Observatório da adoção", para: "/observatorio" },
      { texto: "Documentação da API", para: `${URL_API}/swagger-ui.html`, fora: true },
      { texto: "Código no GitHub", para: "https://github.com/HayrineQueirozdeLima/Adota-Aqui", fora: true },
    ],
  },
];

const estiloDoLink =
  "inline-block rounded-sm py-1 text-compacto text-texto-secundario hover:text-marca-roxo hover:underline focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-marca-roxo";

// Rodapé de todas as telas que têm o menu do topo (Figma: Home, rodapé).
// No computador: a marca e os quatro grupos lado a lado. No tablet, a marca em cima e os grupos numa linha.
// No celular, os grupos em duas colunas, pra não virar uma lista comprida
export default function Rodape() {
  const ia = useIaDisponivel();

  return (
    <footer className="border-t border-borda-sutil bg-fundo-superficie">
      <div className="mx-auto grid max-w-[1440px] gap-10 px-5 py-12 md:px-14 lg:grid-cols-[minmax(0,1.3fr)_minmax(0,3fr)]">
        <div>
          <Link
            to="/"
            aria-label="Adota Aqui, página inicial"
            className="inline-block rounded-sm focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-marca-roxo"
          >
            {/* No tema escuro, o logo roxo some no fundo: entra o de letra branca */}
            <img
              src={logoClaro}
              alt=""
              className="h-[52px] w-auto dark:hidden"
            />
            <img
              src={logoEscuro}
              alt=""
              className="hidden h-[52px] w-auto dark:block"
            />
          </Link>
          <p className="mt-4 max-w-[340px] text-compacto text-texto-secundario">
            Somos a ponte entre protetores de animais e aqueles que desejam ser
            a diferença, fazendo bem ao mundo e aos animais :)
          </p>
        </div>

        <nav
          aria-label="Rodapé"
          className="grid grid-cols-2 gap-x-6 gap-y-8 md:grid-cols-4"
        >
          {grupos.map((grupo) => {
            const id = `rodape-${grupo.titulo.toLowerCase().replaceAll(" ", "-")}`;
            const links = grupo.links.filter((link) => !link.comIa || ia !== false);
            return (
              <div key={grupo.titulo}>
                <h2
                  id={id}
                  className="font-titulo text-overline font-semibold uppercase text-texto-terciario"
                >
                  {grupo.titulo}
                </h2>
                <ul aria-labelledby={id} className="mt-3 flex flex-col gap-1">
                  {links.map((link) => (
                    <li key={link.texto}>
                      {link.fora ? (
                        <a href={link.para} target="_blank" rel="noreferrer" className={estiloDoLink}>
                          <TextoComSeta texto={link.texto} />
                        </a>
                      ) : (
                        <Link to={link.para} className={estiloDoLink}>
                          {link.texto}
                        </Link>
                      )}
                    </li>
                  ))}
                </ul>
              </div>
            );
          })}
        </nav>
      </div>

      <p className="border-t border-borda-sutil px-5 py-5 text-center text-legenda text-texto-terciario md:px-14">
        © {new Date().getFullYear()} Adota Aqui. Projeto da Trilha Full Stack da
        +praTi e Codifica.
      </p>
    </footer>
  );
}

// A última palavra fica grudada na setinha, pra a seta nunca descer sozinha pra outra linha no celular
function TextoComSeta({ texto }) {
  const corte = texto.lastIndexOf(" ");
  return (
    <>
      {texto.slice(0, corte + 1)}
      <span className="whitespace-nowrap">
        {texto.slice(corte + 1)}
        <span className="sr-only"> (abre em outra aba)</span>
        <IconeFora />
      </span>
    </>
  );
}

// Setinha pequena que mostra que o link sai do site
function IconeFora() {
  return (
    <svg
      aria-hidden="true"
      viewBox="0 0 24 24"
      className="ml-1 inline size-3.5 align-[-2px]"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M14 4h6v6M20 4l-9 9M18 14v5a1 1 0 0 1-1 1H5a1 1 0 0 1-1-1V7a1 1 0 0 1 1-1h5" />
    </svg>
  );
}
