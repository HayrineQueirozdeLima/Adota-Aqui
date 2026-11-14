import { Link } from "react-router-dom";
import { useIaDisponivel } from "../../hooks/useIaDisponivel";

// O que o site tem além da vitrine, na Home, logo depois dos números.
// O cartão inteiro é clicável, mas o link é só o título (o ::after estica ele por cima do cartão):
// assim o leitor de tela lê só o nome da página, e não o cartão todo.
// O "Me ajuda a escolher" some quando a IA não está ligada no servidor
const recursos = [
  {
    para: "/me-ajuda-a-escolher",
    titulo: "Me ajuda a escolher",
    texto: "Conte como é a sua rotina e a IA sugere até 3 animais que combinam com você.",
    Icone: IconeIa,
    comIa: true,
  },
  {
    para: "/feiras",
    titulo: "Feiras de adoção",
    texto: "As feiras que os abrigos divulgam, pra conhecer os animais pessoalmente.",
    Icone: IconeFeira,
  },
  {
    para: "/clinicas",
    titulo: "Clínicas veterinárias",
    texto: "Veterinários perto de você ou do animal, inclusive com atendimento 24 horas.",
    Icone: IconeClinica,
  },
  {
    para: "/observatorio",
    titulo: "Observatório da adoção",
    texto: "Os números da adoção em cada estado, lado a lado com dados públicos.",
    Icone: IconeObservatorio,
  },
];

export default function RecursosDoSite() {
  const ia = useIaDisponivel();
  // Enquanto a resposta da IA não chega (null), o cartão já aparece, pra grade não pular depois
  const lista = recursos.filter((recurso) => !recurso.comIa || ia !== false);

  return (
    <section aria-labelledby="recursos-titulo" className="mx-auto w-full max-w-[1440px] px-5 pt-8 md:px-14">
      <h2
        id="recursos-titulo"
        className="font-titulo text-overline font-semibold uppercase text-texto-secundario"
      >
        Tudo pra uma adoção responsável
      </h2>
      <ul className={`mt-3 grid gap-3 sm:grid-cols-2 ${lista.length === 4 ? "lg:grid-cols-4" : "lg:grid-cols-3"}`}>
        {lista.map(({ para, titulo, texto, Icone }, posicao) => (
          <li
            key={para}
            style={{ "--ordem": posicao }}
            className="revelar-ao-rolar group relative flex gap-4 rounded-[16px] border border-borda-sutil bg-fundo-superficie p-4 transition-colors hover:border-marca-roxo motion-reduce:transition-none sm:flex-col sm:gap-3 sm:p-5"
          >
            <span
              aria-hidden="true"
              className="flex size-11 shrink-0 items-center justify-center rounded-full bg-marca-roxo-suave text-marca-roxo"
            >
              <Icone />
            </span>
            <div className="flex flex-col gap-1">
              <h3 className="font-titulo text-item font-semibold text-texto-principal">
                <Link
                  to={para}
                  className="after:absolute after:inset-0 after:rounded-[16px] focus-visible:outline-none focus-visible:after:outline focus-visible:after:outline-2 focus-visible:after:outline-offset-2 focus-visible:after:outline-marca-roxo group-hover:text-marca-roxo"
                >
                  {titulo}
                </Link>
              </h3>
              <p className="text-compacto text-texto-secundario">{texto}</p>
            </div>
            <IconeSeta />
          </li>
        ))}
      </ul>
    </section>
  );
}

const traco = {
  fill: "none",
  stroke: "currentColor",
  strokeWidth: 2,
  strokeLinecap: "round",
  strokeLinejoin: "round",
};

function IconeIa() {
  return (
    <svg viewBox="0 0 24 24" className="size-[22px]" {...traco}>
      <path d="M11 3.5l1.6 4.4L17 9.5l-4.4 1.6L11 15.5l-1.6-4.4L5 9.5l4.4-1.6z" />
      <path d="M18 14.5l.8 2 2 .8-2 .8-.8 2-.8-2-2-.8 2-.8z" />
    </svg>
  );
}

function IconeFeira() {
  return (
    <svg viewBox="0 0 24 24" className="size-[22px]" {...traco}>
      <rect x="3.5" y="5" width="17" height="15.5" rx="2.5" />
      <path d="M3.5 10h17M8 3v4M16 3v4" />
      <path d="M12 17.5s-3-1.7-3-3.6a1.5 1.5 0 0 1 3-.6 1.5 1.5 0 0 1 3 .6c0 1.9-3 3.6-3 3.6z" />
    </svg>
  );
}

function IconeClinica() {
  return (
    <svg viewBox="0 0 24 24" className="size-[22px]" {...traco}>
      <path d="M12 21s-7-6.1-7-11.5a7 7 0 0 1 14 0C19 14.9 12 21 12 21z" />
      <path d="M12 6.5v6M9 9.5h6" />
    </svg>
  );
}

function IconeObservatorio() {
  return (
    <svg viewBox="0 0 24 24" className="size-[22px]" {...traco}>
      <path d="M4 20h16" />
      <path d="M7 16v-4M12 16V7M17 16v-6.5" />
    </svg>
  );
}

// Seta discreta no canto, que anda um pouco quando a pessoa passa o mouse no cartão
function IconeSeta() {
  return (
    <svg
      aria-hidden="true"
      viewBox="0 0 24 24"
      className="ml-auto mt-1 size-5 shrink-0 self-start text-texto-terciario transition-transform group-hover:translate-x-1 group-hover:text-marca-roxo motion-reduce:transition-none sm:absolute sm:right-5 sm:top-6 sm:mt-0"
      {...traco}
    >
      <path d="M5 12h14M13 6l6 6-6 6" />
    </svg>
  );
}
