import { useEffect, useRef, useState } from "react";
import Botao from "../../components/Botao/Botao";
import Candidatura from "../../components/Candidatura/Candidatura";
import Carregando from "../../components/Carregando/Carregando";
import Chip from "../../components/Chip/Chip";
import { useAuth } from "../../contexts/AuthContext";
import { listarMeusInteresses } from "../../services/interesses";
import { useTituloDaPagina } from "../../hooks/useTituloDaPagina";

const filtrosDeStatus = [
  { valor: "", nome: "Todas" },
  { valor: "PENDENTE", nome: "Pendente" },
  { valor: "EM_CONTATO", nome: "Em contato" },
  { valor: "APROVADO", nome: "Aprovado" },
  { valor: "DESCONTINUADO", nome: "Descontinuado" },
];

// As que ainda estão em andamento vêm primeiro. No mesmo status, a mais recente primeiro (a API já manda assim)
const ordemDoStatus = {
  EM_CONTATO: 0,
  PENDENTE: 1,
  APROVADO: 2,
  DESCONTINUADO: 3,
};

// Minhas candidaturas (UC07, RF09, Figma: Minhas candidaturas), em /meus-interesses. Só pessoa física chega aqui.
// Cada candidatura traz o contato do protetor: qualquer um dos dois pode iniciar a conversa
export default function MeusInteresses() {
  const { token, sair } = useAuth();
  const [candidaturas, setCandidaturas] = useState([]);
  // "carregando" | "pronto" | "erro"
  const [situacao, setSituacao] = useState("carregando");
  const [statusEscolhido, setStatusEscolhido] = useState("");
  const [aviso, setAviso] = useState("");
  // muda pra buscar a lista de novo depois de um erro
  const [versao, setVersao] = useState(0);
  const refAviso = useRef(null);
  useTituloDaPagina("Minhas candidaturas");

  useEffect(() => {
    let cancelado = false;
    listarMeusInteresses(token)
      .then((lista) => {
        if (cancelado) return;
        setCandidaturas(lista);
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
  }, [token, sair, versao]);

  // O cartão some depois da desistência. O foco vai pro aviso, pra não se perder na página
  useEffect(() => {
    if (aviso) refAviso.current?.focus();
  }, [aviso]);

  function aposDesistir(desistida) {
    setCandidaturas((atuais) =>
      atuais.filter((candidatura) => candidatura.id !== desistida.id),
    );
    setAviso(
      `Você desistiu da adoção de ${desistida.animal.nome}. O protetor não vê mais o seu interesse.`,
    );
  }

  function tentarDeNovo() {
    setSituacao("carregando");
    setVersao((atual) => atual + 1);
  }

  function contar(valor) {
    return valor
      ? candidaturas.filter(
          (candidatura) => candidatura.statusAndamento === valor,
        ).length
      : candidaturas.length;
  }

  const visiveis = candidaturas
    .filter(
      (candidatura) =>
        !statusEscolhido || candidatura.statusAndamento === statusEscolhido,
    )
    .sort(
      (a, b) =>
        ordemDoStatus[a.statusAndamento] - ordemDoStatus[b.statusAndamento],
    );

  return (
    <main className="mx-auto flex w-full max-w-[1440px] flex-col gap-5 px-5 pb-9 pt-6 md:px-8 md:pt-[30px] lg:px-10">
      <div>
        <h1 className="font-titulo text-secao font-semibold text-texto-principal">
          Minhas candidaturas
        </h1>
        <p className="mt-2 text-corpo text-texto-secundario">
          Os animais em que você demonstrou interesse. Tanto você quanto o
          protetor podem iniciar o contato.
        </p>
      </div>

      {aviso && (
        <p
          ref={refAviso}
          tabIndex={-1}
          role="status"
          className="rounded-[10px] bg-status-disponivel-fundo px-4 py-3 text-compacto text-status-disponivel-texto focus:outline-none"
        >
          {aviso}
        </p>
      )}

      {situacao === "carregando" && (
        <Carregando texto="Carregando candidaturas..." />
      )}

      {situacao === "erro" && (
        <div role="alert" className="text-corpo text-texto-secundario">
          <p>
            Não foi possível carregar suas candidaturas. Confira sua conexão e
            tente de novo.
          </p>
          <Botao onClick={tentarDeNovo} className="mt-3">
            Tentar de novo
          </Botao>
        </div>
      )}

      {situacao === "pronto" && candidaturas.length === 0 && (
        <div className="rounded-[18px] border border-borda-sutil bg-fundo-superficie p-8 text-center">
          <p className="text-corpo text-texto-secundario">
            Você ainda não demonstrou interesse em nenhum animal. Quando
            demonstrar, a candidatura aparece aqui, com o contato do protetor.
          </p>
          <Botao para="/animais" className="mt-4">
            Ver animais disponíveis
          </Botao>
        </div>
      )}

      {situacao === "pronto" && candidaturas.length > 0 && (
        <>
          <div className="flex flex-wrap gap-2">
            {filtrosDeStatus.map(({ valor, nome }) => (
              <Chip
                key={nome}
                ativo={statusEscolhido === valor}
                onClick={() => setStatusEscolhido(valor)}
              >
                {nome} {contar(valor)}
              </Chip>
            ))}
          </div>

          {visiveis.length === 0 ? (
            <div className="rounded-[18px] border border-borda-sutil bg-fundo-superficie p-8 text-center">
              <p className="text-corpo text-texto-secundario">
                Nenhuma candidatura com esse status.
              </p>
              <Botao
                variante="secundario"
                onClick={() => setStatusEscolhido("")}
                className="mt-4"
              >
                Ver todas as candidaturas
              </Botao>
            </div>
          ) : (
            <ul className="flex flex-col gap-[14px]">
              {visiveis.map((candidatura) => (
                <Candidatura
                  key={candidatura.id}
                  candidatura={candidatura}
                  aoDesistir={aposDesistir}
                />
              ))}
            </ul>
          )}
        </>
      )}
    </main>
  );
}
