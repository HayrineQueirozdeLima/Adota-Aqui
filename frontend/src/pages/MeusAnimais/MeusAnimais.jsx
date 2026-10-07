import { useEffect, useState } from "react";
import { Link, useLocation } from "react-router-dom";
import Botao from "../../components/Botao/Botao";
import Carregando from "../../components/Carregando/Carregando";
import Chip from "../../components/Chip/Chip";
import Tag from "../../components/Tag/Tag";
import { useAuth } from "../../contexts/AuthContext";
import { listarMeusAnimais } from "../../services/animais";
import { especies, portes } from "../../utils/rotulos";

// Meus animais (Figma: "Meus animais"), em /meus-animais: os animais da conta, de qualquer status
export default function MeusAnimais() {
  const { token, sair } = useAuth();
  const { state } = useLocation();
  const [animais, setAnimais] = useState([]);
  // "carregando" | "pronto" | "erro"
  const [situacao, setSituacao] = useState("carregando");
  const [filtro, setFiltro] = useState("TODOS");

  useEffect(() => {
    let cancelado = false;
    listarMeusAnimais(token)
      .then((lista) => {
        if (cancelado) return;
        setAnimais(lista);
        setSituacao("pronto");
      })
      .catch((erro) => {
        if (cancelado) return;
        if (erro.status === 401) {
          sair();
          return;
        }
        setSituacao("erro");
      });
    return () => {
      cancelado = true;
    };
  }, [token, sair]);

  const contagem = {
    TODOS: animais.length,
    DISPONIVEL: animais.filter((animal) => animal.statusAdocao === "DISPONIVEL")
      .length,
    ADOTADO: animais.filter((animal) => animal.statusAdocao === "ADOTADO")
      .length,
  };
  const visiveis =
    filtro === "TODOS"
      ? animais
      : animais.filter((animal) => animal.statusAdocao === filtro);

  return (
    <main className="mx-auto w-full max-w-[1440px] px-5 py-6 md:px-14 md:py-8">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <h1 className="font-titulo text-secao font-semibold text-texto-principal">
          Meus animais
        </h1>
        <Botao para="/meus-animais/novo">Cadastrar animal</Botao>
      </div>

      {/* aviso que as outras telas mandam ao voltar pra cá (publicado, salvo, removido) */}
      {state?.aviso && (
        <p
          role="status"
          className="mt-5 rounded-[10px] bg-status-disponivel-fundo px-4 py-3 text-compacto text-status-disponivel-texto"
        >
          {state.aviso}
        </p>
      )}

      {situacao === "carregando" && (
        <Carregando texto="Carregando seus animais..." />
      )}

      {situacao === "erro" && (
        <p role="alert" className="mt-6 text-corpo text-texto-secundario">
          Não foi possível carregar seus animais. Confira sua conexão e
          recarregue a página.
        </p>
      )}

      {situacao === "pronto" && animais.length === 0 && (
        <div className="mt-6 rounded-[16px] border border-borda-sutil bg-fundo-superficie p-8 text-center">
          <p className="text-corpo text-texto-secundario">
            Você ainda não cadastrou nenhum animal.
          </p>
          <Botao para="/meus-animais/novo" className="mt-4">
            Cadastrar o primeiro
          </Botao>
        </div>
      )}

      {situacao === "pronto" && animais.length > 0 && (
        <>
          <div className="mt-5 flex flex-wrap gap-2">
            <Chip ativo={filtro === "TODOS"} onClick={() => setFiltro("TODOS")}>
              Todos {contagem.TODOS}
            </Chip>
            <Chip
              ativo={filtro === "DISPONIVEL"}
              onClick={() => setFiltro("DISPONIVEL")}
            >
              Disponível {contagem.DISPONIVEL}
            </Chip>
            <Chip
              ativo={filtro === "ADOTADO"}
              onClick={() => setFiltro("ADOTADO")}
            >
              Adotado {contagem.ADOTADO}
            </Chip>
          </div>
          <ul className="mt-5 flex flex-col gap-3">
            {visiveis.map((animal) => (
              <ItemAnimal key={animal.id} animal={animal} />
            ))}
          </ul>
        </>
      )}
    </main>
  );
}

function ItemAnimal({ animal }) {
  const {
    id,
    nome,
    especie,
    racaNome,
    porte,
    peso,
    fotoCapa,
    statusAdocao,
    protetor,
  } = animal;
  const adotado = statusAdocao === "ADOTADO";
  const descricao = [
    especies[especie],
    racaNome,
    portes[porte],
    peso && `${peso.toLocaleString("pt-BR")} kg`,
    `${protetor.cidade}/${protetor.estado}`,
  ]
    .filter(Boolean)
    .join(" · ");

  return (
    <li className="flex flex-wrap items-center gap-4 rounded-[16px] border border-borda-sutil bg-fundo-superficie p-4">
      {fotoCapa ? (
        <img
          src={fotoCapa}
          alt=""
          className="size-20 shrink-0 rounded-[12px] object-cover"
        />
      ) : (
        <span
          aria-hidden="true"
          className="size-20 shrink-0 rounded-[12px] bg-marca-roxo-suave"
        />
      )}
      <div className="min-w-0 flex-1">
        <div className="flex flex-wrap items-center gap-2">
          <h2 className="font-titulo text-subtitulo font-semibold text-texto-principal">
            <Link to={`/animais/${id}`} className="hover:underline">
              {nome}
            </Link>
          </h2>
          {adotado ? (
            <Tag>Adotado</Tag>
          ) : (
            <Tag variante="disponivel">Disponível</Tag>
          )}
        </div>
        <p className="mt-1 text-legenda text-texto-terciario">{descricao}</p>
      </div>
      <div className="flex flex-wrap gap-2">
        {adotado ? (
          <Botao
            variante="secundario"
            para={`/meus-animais/${id}/editar`}
            aria-label={`Editar status de ${nome}`}
          >
            Editar status
          </Botao>
        ) : (
          <>
            <Botao para="/interesses-recebidos">Ver interesses</Botao>
            <Botao
              variante="secundario"
              para={`/meus-animais/${id}/editar`}
              aria-label={`Editar ${nome}`}
            >
              Editar
            </Botao>
          </>
        )}
      </div>
    </li>
  );
}
