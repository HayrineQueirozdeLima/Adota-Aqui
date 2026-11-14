import { useState } from "react";
import Botao from "../Botao/Botao";
import Tag from "../Tag/Tag";
import {
  dataPorExtenso,
  diaDaFeira,
  diaEmDestaque,
  horarioDaFeira,
  linkComoChegar,
  linkDaAgenda,
} from "../../utils/feiras";

// Card de uma feira de adoção (página de feiras e Home), no formato do GET /api/feiras (docs/api.md).
// O quadradinho da esquerda é a folha do calendário, pra data ser a primeira coisa que a pessoa vê.
// O abrigo que divulgou vê "Editar" e "Apagar" quando a tela manda o aoApagar
export default function CardFeira({ feira, nivelDoTitulo = 2, aoApagar }) {
  const Titulo = `h${nivelDoTitulo}`;
  const { id, titulo, descricao, data, local, endereco, cidade, estado, abrigo, ehMinha } = feira;
  const { dia, mes, semana } = diaDaFeira(data);
  const destaque = diaEmDestaque(data);
  // "Sábado, 21 de novembro, das 9h às 13h"
  const extenso = dataPorExtenso(data);
  const quando = `${extenso.charAt(0).toUpperCase()}${extenso.slice(1)}, ${horarioDaFeira(feira)}`;
  const [confirmando, setConfirmando] = useState(false);
  const [apagando, setApagando] = useState(false);
  const [erro, setErro] = useState("");

  async function apagar() {
    setApagando(true);
    setErro("");
    try {
      await aoApagar(feira);
    } catch (erroDaApi) {
      setErro(erroDaApi.message);
      setApagando(false);
    }
  }

  return (
    <article className="flex gap-3 rounded-[16px] border border-borda-sutil bg-fundo-superficie p-4 sm:gap-4 sm:p-5">
      {/* A data por extenso fica no texto pro leitor de tela. O quadradinho é só pra ver */}
      <div
        aria-hidden="true"
        className="flex w-14 shrink-0 flex-col items-center self-start overflow-hidden rounded-[12px] border border-marca-roxo-suave text-center sm:w-[68px]"
      >
        <span className="w-full bg-marca-roxo py-1 font-titulo text-legenda font-semibold uppercase text-texto-sobre-marca">
          {mes}
        </span>
        <span className="pt-1 font-titulo text-[24px] font-semibold leading-none text-texto-principal sm:text-[28px]">
          {dia}
        </span>
        <span className="pb-2 pt-1 text-legenda text-texto-terciario">
          {semana.slice(0, 3)}
        </span>
      </div>

      <div className="flex min-w-0 flex-1 flex-col gap-2">
        <div className="flex flex-wrap items-center gap-2">
          <Titulo className="font-titulo text-item font-semibold text-texto-principal">
            {titulo}
          </Titulo>
          {destaque && <Tag variante="atencao">{destaque}</Tag>}
        </div>

        <p className="text-compacto font-semibold text-texto-principal">
          {quando}
        </p>
        <p className="text-compacto text-texto-secundario">
          {local}, {endereco}, {cidade}/{estado}
        </p>
        <p className="text-legenda text-texto-terciario">
          Organizada por {abrigo.nome}
        </p>
        {descricao && (
          <p className="whitespace-pre-line text-compacto text-texto-secundario">
            {descricao}
          </p>
        )}

        <div className="mt-2 flex flex-wrap gap-2">
          <Botao variante="secundario" href={linkComoChegar(feira)}>
            Como chegar
          </Botao>
          <Botao variante="neutro" href={linkDaAgenda(feira)}>
            Adicionar à agenda
          </Botao>
        </div>

        {ehMinha && aoApagar && (
          <div className="mt-1 flex flex-col gap-2 border-t border-borda-sutil pt-3">
            {confirmando ? (
              <>
                <p className="text-compacto text-texto-principal">
                  Apagar esta feira? Ela some da lista na hora.
                </p>
                <div className="flex flex-wrap gap-2">
                  <Botao variante="perigo" onClick={apagar} disabled={apagando}>
                    {apagando ? "Apagando..." : "Sim, apagar"}
                  </Botao>
                  <Botao
                    variante="neutro"
                    onClick={() => setConfirmando(false)}
                    disabled={apagando}
                  >
                    Não apagar
                  </Botao>
                </div>
              </>
            ) : (
              <div className="flex flex-wrap gap-2">
                <Botao variante="neutro" para={`/feiras/${id}/editar`}>
                  Editar
                </Botao>
                <Botao variante="perigo" onClick={() => setConfirmando(true)}>
                  Apagar
                </Botao>
              </div>
            )}
            {erro && (
              <p role="alert" className="text-compacto text-status-erro-texto">
                {erro}
              </p>
            )}
          </div>
        )}
      </div>
    </article>
  );
}
