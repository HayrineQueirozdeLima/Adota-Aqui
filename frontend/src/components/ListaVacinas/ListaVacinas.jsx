import { useState } from "react";
import Botao from "../Botao/Botao";
import CampoTexto from "../CampoTexto/CampoTexto";
import { descricaoDaVacina } from "../../utils/rotulos";

const vacinaVazia = { nome: "", dose: "", dataAplicacao: "" };

// Histórico de vacinação: "Adicionar vacina" abre um mini formulário dentro do cartão.
// Os botões são type="button": eles ficam dentro do formulário do animal e não podem enviar ele.
export default function ListaVacinas({
  vacinas,
  aoAdicionar,
  aoRemover,
  erro,
  desativado = false,
  hoje = new Date(),
}) {
  const [adicionando, setAdicionando] = useState(false);
  const [nova, setNova] = useState(vacinaVazia);
  const [erros, setErros] = useState({});
  const hojeIso = [
    hoje.getFullYear(),
    String(hoje.getMonth() + 1).padStart(2, "0"),
    String(hoje.getDate()).padStart(2, "0"),
  ].join("-");

  function mudar(campo, valor) {
    setNova((atual) => ({ ...atual, [campo]: valor }));
    setErros((atuais) => ({ ...atuais, [campo]: undefined }));
  }

  function adicionar() {
    const encontrados = {};
    if (!nova.nome.trim()) encontrados.nome = "Informe o nome da vacina.";
    if (
      nova.dose &&
      !(Number.isInteger(Number(nova.dose)) && Number(nova.dose) >= 1)
    ) {
      encontrados.dose = "A dose é um número a partir de 1.";
    }
    // datas no formato AAAA-MM-DD podem ser comparadas como texto
    if (nova.dataAplicacao && nova.dataAplicacao > hojeIso)
      encontrados.dataAplicacao = "A data não pode ser no futuro.";
    if (Object.keys(encontrados).length > 0) {
      setErros(encontrados);
      return;
    }
    aoAdicionar({
      nome: nova.nome.trim(),
      dose: nova.dose ? Number(nova.dose) : null,
      dataAplicacao: nova.dataAplicacao || null,
    });
    setNova(vacinaVazia);
    setAdicionando(false);
  }

  // Enter num campo do mini formulário adiciona a vacina (em vez de enviar o formulário do animal)
  function aoApertarTecla(evento) {
    if (evento.key === "Enter") {
      evento.preventDefault();
      adicionar();
    }
  }

  return (
    <div>
      {vacinas.length === 0 ? (
        <p className="text-compacto text-texto-terciario">
          Nenhuma vacina registrada.
        </p>
      ) : (
        <ul className="flex flex-col gap-2.5">
          {vacinas.map((vacina, posicao) => (
            <li
              key={`${vacina.nome}-${posicao}`}
              className="flex flex-wrap items-center justify-between gap-2 rounded-[10px] border border-borda-sutil bg-fundo-pagina px-3.5 py-3"
            >
              <span className="font-titulo font-semibold text-texto-principal">
                {vacina.nome}
              </span>
              <span className="flex items-center gap-3">
                <span className="text-legenda text-texto-terciario">
                  {descricaoDaVacina(vacina)}
                </span>
                {!desativado && (
                  <Botao
                    variante="secundario"
                    onClick={() => aoRemover(posicao)}
                    aria-label={`Remover a vacina ${vacina.nome}`}
                  >
                    Remover
                  </Botao>
                )}
              </span>
            </li>
          ))}
        </ul>
      )}

      {erro && (
        <p className="mt-2 text-legenda text-status-erro-texto">{erro}</p>
      )}

      {!desativado &&
        (adicionando ? (
          <div className="mt-4 rounded-[12px] border border-borda-sutil p-4">
            <div className="grid gap-3 sm:grid-cols-[2fr_1fr_1.4fr]">
              <CampoTexto
                rotulo="Vacina"
                placeholder="V10, Antirrábica..."
                value={nova.nome}
                onChange={(e) => mudar("nome", e.target.value)}
                onKeyDown={aoApertarTecla}
                erro={erros.nome}
              />
              <CampoTexto
                rotulo="Dose (opcional)"
                type="number"
                min="1"
                inputMode="numeric"
                value={nova.dose}
                onChange={(e) => mudar("dose", e.target.value)}
                onKeyDown={aoApertarTecla}
                erro={erros.dose}
              />
              <CampoTexto
                rotulo="Data (opcional)"
                type="date"
                max={hojeIso}
                value={nova.dataAplicacao}
                onChange={(e) => mudar("dataAplicacao", e.target.value)}
                onKeyDown={aoApertarTecla}
                erro={erros.dataAplicacao}
              />
            </div>
            <div className="mt-3 flex flex-wrap gap-2">
              <Botao onClick={adicionar}>Adicionar</Botao>
              <Botao
                variante="secundario"
                onClick={() => {
                  setAdicionando(false);
                  setNova(vacinaVazia);
                  setErros({});
                }}
              >
                Cancelar
              </Botao>
            </div>
          </div>
        ) : (
          <Botao
            variante="secundario"
            onClick={() => setAdicionando(true)}
            className="mt-4"
          >
            Adicionar vacina
          </Botao>
        ))}
    </div>
  );
}
