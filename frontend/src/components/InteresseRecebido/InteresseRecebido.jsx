import { useId, useState } from "react";
import Botao from "../Botao/Botao";
import Tag from "../Tag/Tag";
import { useAuth } from "../../contexts/AuthContext";
import { atualizarStatusInteresse } from "../../services/interesses";
import { mascaraTelefone } from "../../utils/mascaras";
import { formatarData, haQuantoTempo } from "../../utils/rotulos";
import { respostasDaTriagem, resumoDaTriagem } from "../../utils/triagem";

const LIMITE_DO_MOTIVO = 255;

// Como cada status aparece pro protetor (cores do Figma: Interesses recebidos)
const status = {
  PENDENTE: { texto: "Pendente", variante: "destaqueRoxo" },
  EM_CONTATO: { texto: "Em contato", variante: "atencao" },
  APROVADO: { texto: "Aprovado", variante: "disponivel" },
  DESCONTINUADO: { texto: "Descontinuado", variante: "neutro" },
};

const estiloDoLink =
  "underline decoration-borda-forte underline-offset-2 hover:text-marca-roxo hover:decoration-marca-roxo";

// Um candidato no painel do protetor (UC08): contatos, resumo da triagem e as ações que o status permite.
//   Pendente: marcar em contato ou descontinuar
//   Em contato: aprovar ou descontinuar
//   Aprovado e Descontinuado: só ver os detalhes
// Depois de qualquer mudança, avisa a página pelo aoMudar, e ela busca a lista de novo:
// aprovar um interesse também muda os outros do mesmo animal.
export default function InteresseRecebido({ interesse, aoMudar }) {
  const { id, dataHora, statusAndamento, motivoDescontinuacao, animal, triagem, candidato } = interesse;
  const { token, sair } = useAuth();
  // null | "aprovar" | "descontinuar": qual confirmação está aberta
  const [confirmando, setConfirmando] = useState(null);
  const [motivo, setMotivo] = useState("");
  const [erroMotivo, setErroMotivo] = useState("");
  const [erro, setErro] = useState("");
  const [enviando, setEnviando] = useState(false);
  const [verDetalhes, setVerDetalhes] = useState(false);
  const idMotivo = useId();
  const idDetalhes = useId();

  const respostas = respostasDaTriagem(triagem);
  const momentoContato = respostas.find((item) => item.campo === "momentoContato");
  const temMomentoContato = momentoContato.resposta !== "Não informado";
  const emAndamento = statusAndamento === "PENDENTE" || statusAndamento === "EM_CONTATO";
  const telefone = mascaraTelefone(candidato.telefone);

  async function mudar(novoStatus, avisoDeSucesso) {
    setEnviando(true);
    setErro("");
    try {
      await atualizarStatusInteresse(id, novoStatus, motivo.trim(), token);
      setConfirmando(null);
      setEnviando(false);
      aoMudar(avisoDeSucesso);
    } catch (erroDaApi) {
      if (erroDaApi.status === 401) {
        sair();
        return;
      }
      setErro(erroDaApi.message);
      setEnviando(false);
    }
  }

  function descontinuar() {
    if (!motivo.trim()) {
      setErroMotivo("Escreva o motivo. O candidato vai ver essa mensagem.");
      return;
    }
    mudar("DESCONTINUADO", `O interesse de ${candidato.nome} foi descontinuado.`);
  }

  function abrir(qual) {
    setConfirmando(qual);
    setErro("");
    setErroMotivo("");
  }

  return (
    <li className="rounded-[12px] border border-borda-sutil bg-fundo-pagina px-4 py-[14px]">
      <div className="flex flex-col gap-3 md:flex-row md:items-center md:gap-4">
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-[10px]">
            <h3 className="font-titulo text-item font-semibold text-texto-principal">{candidato.nome}</h3>
            <Tag variante={status[statusAndamento].variante}>{status[statusAndamento].texto}</Tag>
          </div>

          <p className="mt-[5px] flex flex-wrap gap-x-4 gap-y-1 text-compacto text-texto-secundario">
            <a href={`mailto:${candidato.email}`} className={estiloDoLink}>
              {candidato.email}
            </a>
            <a
              href={`https://wa.me/55${candidato.telefone}`}
              target="_blank"
              rel="noopener noreferrer"
              aria-label={`WhatsApp ${telefone}`}
              className={estiloDoLink}
            >
              {telefone}
            </a>
            {temMomentoContato && <span>Melhor horário: {momentoContato.resposta.toLowerCase()}</span>}
          </p>

          <p className="mt-[5px] text-legenda text-texto-terciario">
            Recebido {haQuantoTempo(dataHora)}. Triagem: {resumoDaTriagem(triagem)}
          </p>

          {statusAndamento === "DESCONTINUADO" && motivoDescontinuacao && (
            <p className="mt-[5px] text-legenda text-texto-secundario">
              <strong className="font-semibold">Motivo:</strong> {motivoDescontinuacao}
            </p>
          )}
        </div>

        {/* Ações. No celular, um botão embaixo do outro, ocupando a largura toda */}
        {confirmando === null && (
          <div className="flex flex-col gap-[9px] md:shrink-0 md:flex-row">
            {statusAndamento === "PENDENTE" && (
              <Botao
                variante="secundario"
                disabled={enviando}
                onClick={() => mudar("EM_CONTATO", `O interesse de ${candidato.nome} foi marcado como em contato.`)}
              >
                {enviando ? "Salvando..." : "Marcar em contato"}
              </Botao>
            )}
            {statusAndamento === "EM_CONTATO" && (
              <Botao onClick={() => abrir("aprovar")} disabled={enviando}>
                Aprovar
              </Botao>
            )}
            {emAndamento && (
              <Botao variante="perigo" onClick={() => abrir("descontinuar")} disabled={enviando}>
                Descontinuar
              </Botao>
            )}
            {!emAndamento && (
              <Botao
                variante="neutro"
                aria-expanded={verDetalhes}
                aria-controls={idDetalhes}
                onClick={() => setVerDetalhes((atual) => !atual)}
              >
                {verDetalhes ? "Esconder detalhes" : "Ver detalhes"}
              </Botao>
            )}
          </div>
        )}
      </div>

      {verDetalhes && (
        <dl
          id={idDetalhes}
          className="mt-3 grid gap-x-5 gap-y-2 rounded-[10px] bg-fundo-superficie p-4 text-compacto sm:grid-cols-2"
        >
          <div>
            <dt className="text-legenda text-texto-terciario">Recebido em</dt>
            <dd className="text-texto-principal">{formatarData(dataHora.slice(0, 10))}</dd>
          </div>
          {respostas.map(({ campo, pergunta, resposta }) => (
            <div key={campo}>
              <dt className="text-legenda text-texto-terciario">{pergunta}</dt>
              <dd className="text-texto-principal">{resposta}</dd>
            </div>
          ))}
        </dl>
      )}

      {erro && (
        <p role="alert" className="mt-3 text-compacto text-status-erro-texto">
          {erro}
        </p>
      )}

      {confirmando === "aprovar" && (
        <div className="mt-3 rounded-[12px] border border-borda-sutil bg-fundo-superficie p-4">
          <p className="font-titulo font-semibold text-texto-principal">
            Aprovar {candidato.nome} para adotar {animal.nome}?
          </p>
          <p className="mt-1 text-compacto text-texto-secundario">
            {animal.nome} passa para Adotado e sai da vitrine. Os outros interesses em andamento por{" "}
            {animal.nome} são descontinuados automaticamente, e os candidatos ficam sabendo.
          </p>
          <div className="mt-3 flex flex-wrap gap-2">
            <Botao
              disabled={enviando}
              onClick={() =>
                mudar(
                  "APROVADO",
                  `Adoção de ${animal.nome} aprovada para ${candidato.nome}. Os outros interesses em andamento foram descontinuados.`,
                )
              }
            >
              {enviando ? "Aprovando..." : "Confirmar aprovação"}
            </Botao>
            <Botao variante="secundario" onClick={() => setConfirmando(null)} disabled={enviando}>
              Voltar
            </Botao>
          </div>
        </div>
      )}

      {confirmando === "descontinuar" && (
        <div className="mt-3 rounded-[12px] border border-borda-sutil bg-fundo-superficie p-4">
          <label htmlFor={idMotivo} className="font-titulo font-semibold text-texto-principal">
            Por que você vai descontinuar o interesse de {candidato.nome}?
          </label>
          <p className="mt-1 text-legenda text-texto-terciario">
            O candidato vê essa mensagem nas candidaturas dele. Seja gentil e direto.
          </p>
          <textarea
            id={idMotivo}
            rows={3}
            maxLength={LIMITE_DO_MOTIVO}
            value={motivo}
            onChange={(evento) => {
              setMotivo(evento.target.value);
              setErroMotivo("");
            }}
            aria-invalid={erroMotivo ? true : undefined}
            aria-describedby={erroMotivo ? `${idMotivo}-erro` : undefined}
            className={`mt-2 w-full rounded-[10px] border bg-fundo-superficie px-[15px] py-[12px] text-corpo text-texto-principal focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-1 focus-visible:outline-marca-roxo ${
              erroMotivo ? "border-status-erro-texto" : "border-borda-forte"
            }`}
          />
          <div className="flex justify-between gap-3 text-legenda">
            <span id={`${idMotivo}-erro`} className="text-status-erro-texto">
              {erroMotivo}
            </span>
            <span className="text-texto-terciario">
              {motivo.length}/{LIMITE_DO_MOTIVO}
            </span>
          </div>
          <div className="mt-3 flex flex-wrap gap-2">
            <Botao onClick={descontinuar} disabled={enviando}>
              {enviando ? "Enviando..." : "Confirmar"}
            </Botao>
            <Botao variante="secundario" onClick={() => setConfirmando(null)} disabled={enviando}>
              Voltar
            </Botao>
          </div>
        </div>
      )}
    </li>
  );
}
