import { useEffect, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import Botao from "../../components/Botao/Botao";
import CampoSelecao from "../../components/CampoSelecao/CampoSelecao";
import Carregando from "../../components/Carregando/Carregando";
import Chip from "../../components/Chip/Chip";
import InteresseRecebido from "../../components/InteresseRecebido/InteresseRecebido";
import { useAuth } from "../../contexts/AuthContext";
import { listarInteressesRecebidos } from "../../services/interesses";

const filtrosDeStatus = [
  { valor: "", nome: "Todos" },
  { valor: "PENDENTE", nome: "Pendentes" },
  { valor: "EM_CONTATO", nome: "Em contato" },
  { valor: "APROVADO", nome: "Aprovados" },
  { valor: "DESCONTINUADO", nome: "Descontinuados" },
];

// Painel do protetor (UC08), em /interesses-recebidos. Vale pra Usuario e pra Abrigo.
// O filtro de animal fica no endereço (?animal=id): assim o "Ver interesses" de Meus animais
// e do perfil já abre filtrado.
export default function InteressesRecebidos() {
  const { token, sair } = useAuth();
  const [parametros, setParametros] = useSearchParams();
  const [interesses, setInteresses] = useState([]);
  // "carregando" | "pronto" | "erro"
  const [situacao, setSituacao] = useState("carregando");
  const [statusEscolhido, setStatusEscolhido] = useState("");
  const [aviso, setAviso] = useState("");
  // muda a cada alteração de status, pra buscar a lista de novo
  const [versao, setVersao] = useState(0);

  useEffect(() => {
    let cancelado = false;
    listarInteressesRecebidos(token)
      .then((lista) => {
        if (cancelado) return;
        setInteresses(lista);
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

  // Chamado pelo cartão depois de mudar um status. A lista continua na tela enquanto a nova chega
  function aposMudanca(mensagem) {
    setAviso(mensagem);
    setVersao((atual) => atual + 1);
  }

  function tentarDeNovo() {
    setSituacao("carregando");
    setVersao((atual) => atual + 1);
  }

  // Os animais que aparecem na lista, sem repetir, na ordem do interesse mais recente
  const animais = [];
  interesses.forEach(({ animal }) => {
    if (!animais.some((item) => item.id === animal.id)) animais.push(animal);
  });

  const animalNoEndereco = parametros.get("animal") ?? "";
  const animalEscolhido = animais.some((animal) => animal.id === animalNoEndereco) ? animalNoEndereco : "";
  const animalSemInteresses = animalNoEndereco !== "" && animalEscolhido === "";

  let doAnimal = interesses;
  if (animalSemInteresses) doAnimal = [];
  else if (animalEscolhido) doAnimal = interesses.filter((interesse) => interesse.animal.id === animalEscolhido);
  const visiveis = statusEscolhido
    ? doAnimal.filter((interesse) => interesse.statusAndamento === statusEscolhido)
    : doAnimal;

  function contar(valor) {
    return valor ? doAnimal.filter((interesse) => interesse.statusAndamento === valor).length : doAnimal.length;
  }

  function escolherAnimal(id) {
    setParametros(id ? { animal: id } : {}, { replace: true });
  }

  function verTodos() {
    setStatusEscolhido("");
    escolherAnimal("");
  }

  // Agrupa por animal, mantendo a ordem da lista (mais recente primeiro)
  const grupos = [];
  visiveis.forEach((interesse) => {
    const grupo = grupos.find((item) => item.animal.id === interesse.animal.id);
    if (grupo) grupo.interesses.push(interesse);
    else grupos.push({ animal: interesse.animal, interesses: [interesse] });
  });

  return (
    <main className="mx-auto w-full max-w-[1440px] px-5 py-6 md:px-14 md:py-8">
      <h1 className="font-titulo text-secao font-semibold text-texto-principal">Interesses recebidos</h1>
      <p className="mt-2 max-w-[760px] text-corpo text-texto-secundario">
        Quem demonstrou interesse nos seus animais. Os contatos ficam visíveis para os dois lados, e a conversa, a
        visita e a decisão acontecem fora do sistema. Quando decidir, aprove ou descontinue aqui.
      </p>

      {aviso && (
        <p
          role="status"
          className="mt-5 rounded-[10px] bg-status-disponivel-fundo px-4 py-3 text-compacto text-status-disponivel-texto"
        >
          {aviso}
        </p>
      )}

      {situacao === "carregando" && <Carregando texto="Carregando interesses..." />}

      {situacao === "erro" && (
        <div role="alert" className="mt-6 text-corpo text-texto-secundario">
          <p>Não foi possível carregar os interesses. Confira sua conexão e tente de novo.</p>
          <Botao onClick={tentarDeNovo} className="mt-3">
            Tentar de novo
          </Botao>
        </div>
      )}

      {situacao === "pronto" && interesses.length === 0 && (
        <div className="mt-6 rounded-[16px] border border-borda-sutil bg-fundo-superficie p-8 text-center">
          <p className="text-corpo text-texto-secundario">
            Você ainda não recebeu nenhum interesse. Quando alguém demonstrar interesse em um dos seus animais, ele
            aparece aqui.
          </p>
          <Botao para="/meus-animais" className="mt-4">
            Ver meus animais
          </Botao>
        </div>
      )}

      {situacao === "pronto" && interesses.length > 0 && (
        <>
          <div className="mt-5 flex flex-wrap items-end gap-4">
            <div className="flex flex-wrap gap-2">
              {filtrosDeStatus.map(({ valor, nome }) => (
                <Chip key={nome} ativo={statusEscolhido === valor} onClick={() => setStatusEscolhido(valor)}>
                  {nome} {contar(valor)}
                </Chip>
              ))}
            </div>
            {animais.length > 1 && (
              <CampoSelecao
                rotulo="Animal"
                vazio="Todos os animais"
                opcoes={animais.map((animal) => ({ valor: animal.id, nome: animal.nome }))}
                value={animalEscolhido}
                onChange={(evento) => escolherAnimal(evento.target.value)}
                className="w-full sm:w-[260px]"
              />
            )}
          </div>

          {grupos.length === 0 ? (
            <div className="mt-6 rounded-[16px] border border-borda-sutil bg-fundo-superficie p-8 text-center">
              <p className="text-corpo text-texto-secundario">
                {animalSemInteresses
                  ? "Esse animal ainda não recebeu interesses."
                  : "Nenhum interesse encontrado com esse filtro."}
              </p>
              <Botao variante="secundario" onClick={verTodos} className="mt-4">
                Ver todos os interesses
              </Botao>
            </div>
          ) : (
            <div className="mt-6 flex flex-col gap-8">
              {grupos.map(({ animal, interesses: doGrupo }) => (
                <section key={animal.id} aria-labelledby={`animal-${animal.id}`}>
                  <div className="mb-3 flex items-center gap-3">
                    {animal.fotoCapa ? (
                      <img src={animal.fotoCapa} alt="" className="size-12 shrink-0 rounded-[10px] object-cover" />
                    ) : (
                      <span aria-hidden="true" className="size-12 shrink-0 rounded-[10px] bg-marca-roxo-suave" />
                    )}
                    <div>
                      <h2
                        id={`animal-${animal.id}`}
                        className="font-titulo text-subtitulo font-semibold text-texto-principal"
                      >
                        <Link to={`/animais/${animal.id}`} className="hover:underline">
                          {animal.nome}
                        </Link>
                      </h2>
                      <p className="text-legenda text-texto-terciario">
                        {doGrupo.length === 1 ? "1 interesse" : `${doGrupo.length} interesses`}
                      </p>
                    </div>
                  </div>
                  <ul className="flex flex-col gap-3">
                    {doGrupo.map((interesse) => (
                      <InteresseRecebido key={interesse.id} interesse={interesse} aoMudar={aposMudanca} />
                    ))}
                  </ul>
                </section>
              ))}
            </div>
          )}
        </>
      )}
    </main>
  );
}
