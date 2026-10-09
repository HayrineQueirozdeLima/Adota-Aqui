import { useEffect, useState } from "react";
import { useSearchParams } from "react-router-dom";
import Botao from "../../components/Botao/Botao";
import CampoSelecao from "../../components/CampoSelecao/CampoSelecao";
import Carregando from "../../components/Carregando/Carregando";
import Chip from "../../components/Chip/Chip";
import InteressesDoAnimal from "../../components/InteressesDoAnimal/InteressesDoAnimal";
import { useAuth } from "../../contexts/AuthContext";
import { listarMeusAnimais } from "../../services/animais";
import { listarInteressesRecebidos } from "../../services/interesses";

const filtrosDeStatus = [
  { valor: "", nome: "Todos" },
  { valor: "PENDENTE", nome: "Pendente" },
  { valor: "EM_CONTATO", nome: "Em contato" },
  { valor: "APROVADO", nome: "Aprovado" },
  { valor: "DESCONTINUADO", nome: "Descontinuado" },
];

// Painel do protetor (UC08, Figma: Interesses recebidos), em /interesses-recebidos. Vale pra Usuario e pra Abrigo.
// O filtro de animal fica no endereço (?animal=id): assim o "Ver interesses" de Meus animais
// e do perfil já abre filtrado.
export default function InteressesRecebidos() {
  const { token, sair } = useAuth();
  const [parametros, setParametros] = useSearchParams();
  const [interesses, setInteresses] = useState([]);
  // Os animais da conta, com espécie, porte, cidade e status. O interesse só traz nome e foto
  const [meusAnimais, setMeusAnimais] = useState([]);
  // "carregando" | "pronto" | "erro"
  const [situacao, setSituacao] = useState("carregando");
  const [statusEscolhido, setStatusEscolhido] = useState("");
  const [aviso, setAviso] = useState("");
  // muda a cada alteração de status, pra buscar tudo de novo
  const [versao, setVersao] = useState(0);

  useEffect(() => {
    let cancelado = false;
    // As duas buscas saem juntas, e a tela espera as duas
    Promise.all([listarInteressesRecebidos(token), listarMeusAnimais(token)])
      .then(([listaDeInteresses, listaDeAnimais]) => {
        if (cancelado) return;
        setInteresses(listaDeInteresses);
        setMeusAnimais(listaDeAnimais);
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

  // Um cartão por animal que tem algum interesse visível, juntando os dados de Meus animais.
  // Os animais com adoção encerrada vão pro fim
  const grupos = animais
    .filter((animal) => visiveis.some((interesse) => interesse.animal.id === animal.id))
    .map((animal) => {
      const dados = { ...animal, ...meusAnimais.find((item) => item.id === animal.id) };
      const doGrupo = interesses.filter((interesse) => interesse.animal.id === animal.id);
      const encerrado =
        dados.statusAdocao === "ADOTADO" || doGrupo.some((interesse) => interesse.statusAndamento === "APROVADO");
      return { animal: dados, interesses: doGrupo, encerrado };
    })
    .sort((a, b) => Number(a.encerrado) - Number(b.encerrado));

  return (
    <main className="mx-auto flex w-full max-w-[1440px] flex-col gap-5 px-5 pb-9 pt-6 md:px-8 md:pt-[30px] lg:px-10">
      <div>
        <h1 className="font-titulo text-secao font-semibold text-texto-principal">Interesses recebidos</h1>
        <p className="mt-2 text-corpo text-texto-secundario">
          Os candidatos aparecem agrupados pelo animal. A entrevista, a visita e a decisão final são suas, fora do
          sistema.
        </p>
      </div>

      {aviso && (
        <p
          role="status"
          className="rounded-[10px] bg-status-disponivel-fundo px-4 py-3 text-compacto text-status-disponivel-texto"
        >
          {aviso}
        </p>
      )}

      {situacao === "carregando" && <Carregando texto="Carregando interesses..." />}

      {situacao === "erro" && (
        <div role="alert" className="text-corpo text-texto-secundario">
          <p>Não foi possível carregar os interesses. Confira sua conexão e tente de novo.</p>
          <Botao onClick={tentarDeNovo} className="mt-3">
            Tentar de novo
          </Botao>
        </div>
      )}

      {situacao === "pronto" && interesses.length === 0 && (
        <div className="rounded-[18px] border border-borda-sutil bg-fundo-superficie p-8 text-center">
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
          <div className="flex flex-wrap items-end gap-4">
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
            <div className="rounded-[18px] border border-borda-sutil bg-fundo-superficie p-8 text-center">
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
            grupos.map((grupo) => (
              <InteressesDoAnimal
                key={grupo.animal.id}
                animal={grupo.animal}
                interesses={grupo.interesses}
                status={statusEscolhido}
                aoMudar={aposMudanca}
              />
            ))
          )}
        </>
      )}
    </main>
  );
}
