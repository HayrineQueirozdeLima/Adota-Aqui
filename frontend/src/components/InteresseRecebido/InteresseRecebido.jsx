import { useId, useState } from "react";
import Botao from "../Botao/Botao";
import Tag from "../Tag/Tag";
import { useAuth } from "../../contexts/AuthContext";
import { atualizarStatusInteresse } from "../../services/interesses";
import { mascaraTelefone } from "../../utils/mascaras";
import { formatarData } from "../../utils/rotulos";
import { respostasDaTriagem } from "../../utils/triagem";

const LIMITE_DO_MOTIVO = 255;

// Como cada status aparece pro protetor
const status = {
  PENDENTE: { texto: "Pendente", variante: "atencao" },
  EM_CONTATO: { texto: "Em contato", variante: "destaqueRoxo" },
  APROVADO: { texto: "Aprovado", variante: "disponivel" },
  DESCONTINUADO: { texto: "Descontinuado", variante: "neutro" },
};

// Um candidato no painel do protetor (UC08): contatos, triagem e as ações que o status permite.
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
  const idMotivo = useId();

  const respostas = respostasDaTriagem(triagem);
  const momentoContato = respostas.find((item) => item.campo === "momentoContato");
  const demaisRespostas = respostas.filter((item) => item.campo !== "momentoContato");
  const emAndamento = statusAndamento === "PENDENTE" || statusAndamento === "EM_CONTATO";

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
    const texto = motivo.trim();
    if (!texto) {
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
    <li className="rounded-[16px] border border-borda-sutil bg-fundo-superficie p-5">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h3 className="font-titulo text-subtitulo font-semibold text-texto-principal">{candidato.nome}</h3>
          <p className="text-legenda text-texto-terciario">Recebido em {formatarData(dataHora.slice(0, 10))}</p>
        </div>
        <Tag variante={status[statusAndamento].variante}>{status[statusAndamento].texto}</Tag>
      </div>

      <ul className="mt-3 flex flex-wrap gap-x-5 gap-y-1.5 text-compacto">
        <li>
          <a
            href={`https://wa.me/55${candidato.telefone}`}
            target="_blank"
            rel="noopener noreferrer"
            className="text-marca-roxo underline"
          >
            WhatsApp: {mascaraTelefone(candidato.telefone)}
          </a>
        </li>
        <li>
          <a href={`mailto:${candidato.email}`} className="text-marca-roxo underline">
            {candidato.email}
          </a>
        </li>
        {momentoContato && (
          <li className="text-texto-secundario">Melhor horário para contato: {momentoContato.resposta}</li>
        )}
      </ul>

      <dl className="mt-4 grid gap-x-5 gap-y-2 rounded-[12px] bg-fundo-pagina p-4 text-compacto sm:grid-cols-2">
        {demaisRespostas.map(({ campo, pergunta, resposta }) => (
          <div key={campo}>
            <dt className="text-legenda text-texto-terciario">{pergunta}</dt>
            <dd className="text-texto-principal">{resposta}</dd>
          </div>
        ))}
      </dl>

      {statusAndamento === "DESCONTINUADO" && motivoDescontinuacao && (
        <p className="mt-3 text-compacto text-texto-secundario">
          <strong>Motivo:</strong> {motivoDescontinuacao}
        </p>
      )}

      {statusAndamento === "APROVADO" && (
        <p className="mt-3 text-compacto text-texto-secundario">
          Adoção aprovada: {candidato.nome} é quem vai cuidar de {animal.nome}.
        </p>
      )}

      {erro && (
        <p role="alert" className="mt-3 text-compacto text-status-erro-texto">
          {erro}
        </p>
      )}

      {emAndamento && confirmando === null && (
        <div className="mt-4 flex flex-wrap gap-2">
          {statusAndamento === "PENDENTE" && (
            <Botao
              variante="secundario"
              disabled={enviando}
              onClick={() => mudar("EM_CONTATO", `O interesse de ${candidato.nome} foi marcado como em contato.`)}
            >
              Marcar como em contato
            </Botao>
          )}
          <Botao onClick={() => abrir("aprovar")} disabled={enviando}>
            Aprovar adoção
          </Botao>
          <Botao variante="secundario" onClick={() => abrir("descontinuar")} disabled={enviando}>
            Descontinuar
          </Botao>
        </div>
      )}

      {confirmando === "aprovar" && (
        <div className="mt-4 rounded-[12px] border border-borda-sutil bg-fundo-pagina p-4">
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
        <div className="mt-4 rounded-[12px] border border-borda-sutil bg-fundo-pagina p-4">
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
