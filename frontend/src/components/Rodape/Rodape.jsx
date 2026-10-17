import { Link } from "react-router-dom";
import logoClaro from "../../assets/logo-marca.svg";
import logoEscuro from "../../assets/logo-sobre-marca.svg";

// Blog, redes sociais e "Fale conosco"
// entram quando existirem
const plataforma = [
  { texto: "Explorar animais", para: "/animais" },
  { texto: "Como adotar", para: { pathname: "/", hash: "#como-funciona" } },
  { texto: "Abrigos e protetores independentes", para: "/cadastro" },
  { texto: "Cadastrar um animal", para: "/meus-animais/novo" },
];

const estiloDoLink =
  "inline-block rounded-sm py-1 text-compacto text-texto-secundario hover:text-marca-roxo hover:underline focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-marca-roxo";

// Rodapé de todas as telas que têm o menu do topo (Figma: Home, rodapé)
export default function Rodape() {
  return (
    <footer className="border-t border-borda-sutil bg-fundo-superficie">
      <div className="mx-auto grid max-w-[1440px] gap-10 px-5 py-12 md:grid-cols-[2fr_1fr] md:px-14">
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

        <nav aria-labelledby="rodape-plataforma">
          <h2
            id="rodape-plataforma"
            className="font-titulo text-overline font-semibold uppercase text-texto-terciario"
          >
            Plataforma
          </h2>
          <ul className="mt-3 flex flex-col gap-1">
            {plataforma.map((item) => (
              <li key={item.texto}>
                <Link to={item.para} className={estiloDoLink}>
                  {item.texto}
                </Link>
              </li>
            ))}
          </ul>
        </nav>
      </div>

      <p className="border-t border-borda-sutil px-5 py-5 text-center text-legenda text-texto-terciario md:px-14">
        © {new Date().getFullYear()} Adota Aqui. Projeto da Trilha Full Stack da
        +praTi e Codifica.
      </p>
    </footer>
  );
}
