import { useRef, useState } from "react";
import Botao from "../../components/Botao/Botao";
import CardAnimal from "../../components/CardAnimal/CardAnimal";
import Carregando from "../../components/Carregando/Carregando";
import Chip from "../../components/Chip/Chip";
import SetaSelecao from "../../components/SetaSelecao/SetaSelecao";
import { useAuth } from "../../contexts/AuthContext";
import { useIaDisponivel } from "../../hooks/useIaDisponivel";
import { useTituloDaPagina } from "../../hooks/useTituloDaPagina";
import { sugerirAnimais } from "../../services/ia";
import { estados } from "../../utils/rotulos";

const MAXIMO = 600;

// Frases prontas: tocar numa delas acrescenta a frase no texto, pra quem não sabe por onde começar
const frasesProntas = [
  "Moro em apartamento.",
  "Moro em casa com quintal.",
  "Tenho crianças em casa.",
  "Já tenho um cachorro.",
  "Já tenho um gato.",
  "Trabalho fora o dia todo.",
  "Fico bastante tempo em casa.",
  "Gosto de caminhar e correr.",
];

// "Me ajuda a escolher", em /me-ajuda-a-escolher. Aberta pra qualquer pessoa.
// A pessoa conta a rotina e a IA sugere até 3 animais do site, cada um com o motivo.
// Quem garante que o animal existe é a API: ela manda a lista pra IA e só aceita o que está nela.
// Quem está logado recebe sugestões do estado do perfil, como na vitrine
export default function MeAjudaAEscolher() {
  const disponivel = useIaDisponivel();
  const { usuario, token, sair } = useAuth();
  const [rotina, setRotina] = useState("");
  const [estado, setEstado] = useState("");
  const [erroDaRotina, setErroDaRotina] = useState("");
  // "parado" | "pensando" | "pronto" | "erro"
  const [situacao, setSituacao] = useState("parado");
  const [resultado, setResultado] = useState(null);
  const [erro, setErro] = useState("");
  const campo = useRef(null);
  const resultadoRef = useRef(null);
  useTituloDaPagina("Me ajuda a escolher");

  const ehPessoaFisica = usuario?.tipoConta === "USUARIO";

  function acrescentar(frase) {
    const atual = rotina.trim();
    setRotina(`${atual}${atual ? " " : ""}${frase}`.slice(0, MAXIMO));
    setErroDaRotina("");
  }

  async function pedir(evento) {
    evento.preventDefault();
    if (rotina.trim().length < 15) {
      setErroDaRotina("Conte um pouco mais da sua rotina (pelo menos 15 letras).");
      campo.current?.focus();
      return;
    }
    setSituacao("pensando");
    setErro("");
    try {
      const pedido = { rotina: rotina.trim(), estado: ehPessoaFisica ? null : estado || null };
      const resposta = await sugerirAnimais(pedido, token);
      setResultado(resposta);
      setSituacao("pronto");
      // Leva o foco pro resultado, que no celular fica embaixo do formulário
      setTimeout(() => resultadoRef.current?.focus(), 0);
    } catch (erroDaApi) {
      if (erroDaApi.status === 401) {
        sair();
        setSituacao("parado");
        return;
      }
      if (erroDaApi.campos?.rotina) {
        setErroDaRotina(erroDaApi.campos.rotina);
        setSituacao("parado");
        return;
      }
      setErro(erroDaApi.message);
      setSituacao("erro");
    }
  }

  if (disponivel === null) {
    return (
      <main className="px-5 py-12">
        <Carregando texto="Carregando..." />
      </main>
    );
  }

  return (
    <main className="mx-auto flex w-full max-w-[1100px] flex-col gap-8 px-5 pb-14 pt-6 md:px-14 md:pt-8">
      <div className="max-w-[720px]">
        <h1 className="font-titulo text-secao font-semibold text-texto-principal md:text-display">
          Me ajuda a escolher
        </h1>
        <p className="mt-2 text-corpo text-texto-secundario">
          Conte como é a sua rotina e a IA sugere até 3 animais do Adota Aqui que combinam com ela. Quem
          decide é você, conhecendo o animal e conversando com quem cuida dele.
        </p>
      </div>

      {!disponivel ? (
        <div className="rounded-[16px] border border-borda-sutil bg-fundo-superficie p-8 text-center">
          <p className="font-titulo text-item font-semibold text-texto-principal">
            A ajuda com IA não está disponível agora.
          </p>
          <p className="mt-1 text-compacto text-texto-secundario">
            Enquanto isso, a vitrine tem filtros de porte, energia e convivência que ajudam a achar o animal
            certo.
          </p>
          <Botao para="/animais" className="mt-4">
            Ver animais para adoção
          </Botao>
        </div>
      ) : (
        <form
          onSubmit={pedir}
          noValidate
          className="flex flex-col gap-4 rounded-[18px] border border-borda-sutil bg-fundo-superficie p-5 md:p-7"
        >
          <div>
            <label htmlFor="rotina" className="font-titulo text-item font-semibold text-texto-principal">
              Como é a sua rotina?
            </label>
            <p id="rotina-dica" className="mt-1 text-compacto text-texto-secundario">
              Onde você mora, quem mora com você, quanto tempo fica em casa, se já tem outros animais. Não
              escreva nome, telefone nem endereço: o texto vai pra IA do Google (Gemini) só pra fazer as
              sugestões.
            </p>
          </div>

          <div role="group" aria-label="Frases prontas" className="flex flex-wrap gap-2">
            {frasesProntas.map((frase) => (
              <Chip key={frase} ativo={rotina.includes(frase)} onClick={() => acrescentar(frase)}>
                {frase.replace(".", "")}
              </Chip>
            ))}
          </div>

          <div>
            <textarea
              id="rotina"
              ref={campo}
              rows={5}
              maxLength={MAXIMO}
              value={rotina}
              onChange={(evento) => {
                setRotina(evento.target.value);
                setErroDaRotina("");
              }}
              placeholder="Ex.: Moro em apartamento com meu filho de 6 anos. Trabalho fora de manhã e fico em casa à tarde."
              aria-invalid={erroDaRotina ? true : undefined}
              aria-describedby={erroDaRotina ? "rotina-dica rotina-erro" : "rotina-dica"}
              className={`w-full rounded-[10px] border bg-fundo-superficie px-[15px] py-[14px] text-corpo text-texto-principal placeholder:text-texto-terciario focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-1 focus-visible:outline-marca-roxo ${
                erroDaRotina ? "border-status-erro-texto" : "border-borda-forte"
              }`}
            />
            <div className="mt-1 flex justify-between gap-3 text-legenda">
              <span id="rotina-erro" className="text-status-erro-texto">
                {erroDaRotina}
              </span>
              <span className="text-texto-terciario">
                {rotina.length}/{MAXIMO}
              </span>
            </div>
          </div>

          <div className="flex flex-wrap items-end justify-between gap-4">
            {ehPessoaFisica ? (
              <p className="text-compacto text-texto-secundario">
                As sugestões são de animais do estado do seu perfil, como na vitrine.
              </p>
            ) : (
              <div className="flex flex-col gap-1">
                <label htmlFor="estado-da-pessoa" className="text-compacto text-texto-secundario">
                  Em qual estado você está?
                </label>
                <div className="relative inline-flex">
                  <select
                    id="estado-da-pessoa"
                    value={estado}
                    onChange={(evento) => setEstado(evento.target.value)}
                    className="appearance-none rounded-full border border-borda-sutil bg-fundo-superficie py-2 pl-4 pr-10 font-titulo text-campo font-semibold text-texto-principal focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-marca-roxo"
                  >
                    <option value="">Todos os estados</option>
                    {Object.entries(estados).map(([sigla, nome]) => (
                      <option key={sigla} value={sigla}>
                        {nome}
                      </option>
                    ))}
                  </select>
                  <SetaSelecao className="right-4 text-texto-principal" />
                </div>
              </div>
            )}
            <Botao type="submit" disabled={situacao === "pensando"}>
              {situacao === "pensando" ? "A IA está pensando..." : "Ver sugestões"}
            </Botao>
          </div>
        </form>
      )}

      {situacao === "pensando" && <Carregando texto="Procurando os animais que combinam com você..." />}

      {situacao === "erro" && (
        <p role="alert" className="rounded-[12px] bg-status-erro-fundo px-4 py-3 text-compacto text-status-erro-texto">
          {erro}
        </p>
      )}

      {situacao === "pronto" && resultado && (
        <section aria-labelledby="sugestoes-titulo" className="flex flex-col gap-5">
          <h2
            id="sugestoes-titulo"
            ref={resultadoRef}
            tabIndex={-1}
            className="font-titulo text-secao font-semibold text-texto-principal focus:outline-none"
          >
            {resultado.sugestoes.length === 0
              ? "Nenhum animal combinou com a sua rotina agora"
              : resultado.sugestoes.length === 1
                ? "1 animal que combina com você"
                : `${resultado.sugestoes.length} animais que combinam com você`}
          </h2>

          {resultado.sugestoes.length > 0 && (
            <ol className="grid gap-[22px] sm:grid-cols-2 lg:grid-cols-3">
              {resultado.sugestoes.map(({ animal, motivo }) => (
                <li key={animal.id} className="flex flex-col gap-3">
                  <p className="rounded-[12px] bg-marca-roxo-suave px-4 py-3 text-compacto text-texto-principal">
                    <strong className="font-semibold">Por que combina:</strong> {motivo}
                  </p>
                  <CardAnimal animal={animal} />
                </li>
              ))}
            </ol>
          )}

          {resultado.conselho && (
            <p className="rounded-[12px] bg-status-atencao-fundo px-4 py-3 text-compacto text-status-atencao-texto">
              <strong className="font-semibold">Dica:</strong> {resultado.conselho}
            </p>
          )}

          <p className="text-legenda text-texto-terciario">
            Sugestões feitas por IA a partir dos animais disponíveis no site. Confira o perfil completo e
            converse com o protetor antes de decidir.
          </p>
          <div>
            <Botao variante="secundario" para="/animais">
              Ver todos os animais
            </Botao>
          </div>
        </section>
      )}
    </main>
  );
}
