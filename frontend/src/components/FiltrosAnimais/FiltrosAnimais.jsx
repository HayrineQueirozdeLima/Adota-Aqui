import { useEffect, useState } from "react";
import Chip from "../Chip/Chip";
import SetaSelecao from "../SetaSelecao/SetaSelecao";
import { portes } from "../../utils/rotulos";
import { filtrosVazios, listarRacas } from "../../services/animais";

// No plural, pq aqui o texto fala dos animais em geral ("Mais calmos")
const energias = { MAIS_ANIMADO: "Mais animados", MAIS_CALMO: "Mais calmos" };

// { PEQUENO: 'Pequeno' } vira [{ valor: 'PEQUENO', nome: 'Pequeno' }],
// o mesmo formato que o GET /api/racas devolve
// Assim o Seletor aceita as duas coisas
function paraOpcoes(dicionario) {
  return Object.entries(dicionario).map(([valor, nome]) => ({ valor, nome }));
}

// No cadastro a raça "Outra" é a que não está na lista. No filtro, do lado de "Sem raça definida",
// ela parecia vira-lata, então aqui ela aparece como "Outras raças" (retorno do QA)
function nomeNoFiltro(raca) {
  return raca.valor.startsWith("OUTRA") ? { ...raca, nome: "Outras raças" } : raca;
}

// Barra de filtros da vitrine
// Quem guarda os filtros é a VitrineAnimais:
// aqui a gente só mostra o que está escolhido e avisa quando alguém muda
export default function FiltrosAnimais({ filtros, aoMudar }) {
  const [racas, setRacas] = useState([]);

  // As raças dependem da espécie
  // busca de novo toda vez que a espécie muda
  useEffect(() => {
    if (!filtros.especie) return;

    let cancelado = false;
    listarRacas(filtros.especie)
      .then((lista) => {
        if (!cancelado) setRacas(lista.map(nomeNoFiltro));
      })
      // se a API falhar, o filtro de raça fica só com "Todas as raças" e a vitrine segue funcionando
      .catch(() => {
        if (!cancelado) setRacas([]);
      });

    return () => {
      cancelado = true;
    };
  }, [filtros.especie]);

  function mudar(campo, valor) {
    const novos = { ...filtros, [campo]: valor };
    // se trocar a espécie, a raça escolhida antes deixa de valer
    if (campo === "especie") novos.raca = "";
    aoMudar(novos);
  }

  // desliga filtro que já estava ligado e foi clicado dde novo
  function alternar(campo, valor) {
    mudar(campo, filtros[campo] === valor ? "" : valor);
  }

  const temFiltro = Object.values(filtros).some(Boolean);

  return (
    <div className="flex flex-wrap items-center gap-2.5">
      {/* A API procura no nome do animal e no nome de quem cadastrou */}
      <input
        type="search"
        aria-label="Buscar por nome"
        placeholder="Nome do animal ou do protetor"
        maxLength={80}
        value={filtros.busca}
        onChange={(evento) => mudar("busca", evento.target.value)}
        className="w-full rounded-full border border-borda-sutil bg-fundo-superficie px-[18px] py-2.5 text-campo text-texto-principal md:w-[260px]"
      />
      <input
        type="search"
        aria-label="Cidade"
        placeholder="Cidade"
        value={filtros.cidade}
        onChange={(evento) => mudar("cidade", evento.target.value)}
        className="w-full rounded-full border border-borda-sutil bg-fundo-superficie px-[18px] py-2.5 text-campo text-texto-principal md:w-[260px]"
      />

      <Chip ativo={!filtros.especie} onClick={() => mudar("especie", "")}>
        Todos
      </Chip>
      <Chip
        ativo={filtros.especie === "CAO"}
        onClick={() => alternar("especie", "CAO")}
      >
        Cães
      </Chip>
      <Chip
        ativo={filtros.especie === "GATO"}
        onClick={() => alternar("especie", "GATO")}
      >
        Gatos
      </Chip>

      <Chip
        ativo={filtros.sexo === "FEMEA"}
        onClick={() => alternar("sexo", "FEMEA")}
      >
        Fêmea
      </Chip>
      <Chip
        ativo={filtros.sexo === "MACHO"}
        onClick={() => alternar("sexo", "MACHO")}
      >
        Macho
      </Chip>

      <Seletor
        rotulo="Porte"
        textoTodos="Todos os portes"
        valor={filtros.porte}
        opcoes={paraOpcoes(portes)}
        aoMudar={(valor) => mudar("porte", valor)}
      />
      <Seletor
        rotulo="Raça"
        textoTodos="Todas as raças"
        valor={filtros.raca}
        opcoes={filtros.especie ? racas : []}
        desabilitado={!filtros.especie}
        dica="Escolha Cães ou Gatos pra ver as raças"
        aoMudar={(valor) => mudar("raca", valor)}
      />
      <Seletor
        rotulo="Energia"
        textoTodos="Qualquer energia"
        valor={filtros.energia}
        opcoes={paraOpcoes(energias)}
        aoMudar={(valor) => mudar("energia", valor)}
      />

      <Chip
        ativo={Boolean(filtros.convivenciaCrianca)}
        onClick={() => alternar("convivenciaCrianca", "CONVIVE_BEM")}
      >
        Bom com crianças
      </Chip>
      <Chip
        ativo={Boolean(filtros.convivenciaCao)}
        onClick={() => alternar("convivenciaCao", "CONVIVE_BEM")}
      >
        Bom com cães
      </Chip>
      <Chip
        ativo={Boolean(filtros.convivenciaGato)}
        onClick={() => alternar("convivenciaGato", "CONVIVE_BEM")}
      >
        Bom com gatos
      </Chip>

      {temFiltro && (
        <button
          type="button"
          onClick={() => aoMudar(filtrosVazios)}
          className="px-2 font-titulo text-campo font-semibold text-marca-roxo underline"
        >
          Limpar filtros
        </button>
      )}
    </div>
  );
}

// Filtro de lista (porte, raça, energia)
// A primeira opção, sem valor, é o "todos" e já vem marcada.
// Antes ela tinha o nome do filtro ("Raça"), e no celular, que mostra a lista na tela do sistema,
// parecia uma raça (retorno do QA). Desabilitado não tem lista, então aí fica o nome do filtro
function Seletor({
  rotulo,
  textoTodos,
  valor,
  opcoes,
  aoMudar,
  desabilitado = false,
  dica,
}) {
  const cores = valor
    ? "border-texto-principal bg-texto-principal text-fundo-superficie"
    : "border-borda-sutil bg-fundo-superficie text-texto-principal";

  // A seta fica fora do select, então repete a cor do texto e o apagado do desabilitado
  return (
    <div className="relative inline-flex">
      <select
        aria-label={rotulo}
        title={dica}
        value={valor}
        disabled={desabilitado}
        onChange={(evento) => aoMudar(evento.target.value)}
        className={`appearance-none rounded-full border py-2 pl-4 pr-10 font-titulo text-campo font-semibold focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-marca-roxo disabled:cursor-not-allowed disabled:opacity-50 ${cores}`}
      >
        <option value="">{desabilitado ? rotulo : textoTodos}</option>
        {opcoes.map((opcao) => (
          <option key={opcao.valor} value={opcao.valor}>
            {opcao.nome}
          </option>
        ))}
      </select>
      <SetaSelecao
        className={`right-4 ${valor ? "text-fundo-superficie" : "text-texto-principal"} ${desabilitado ? "opacity-50" : ""}`}
      />
    </div>
  );
}
