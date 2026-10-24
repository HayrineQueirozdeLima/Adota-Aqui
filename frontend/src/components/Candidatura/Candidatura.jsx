import { useState } from "react";
import Botao from "../Botao/Botao";
import Tag from "../Tag/Tag";
import { useAuth } from "../../contexts/AuthContext";
import { desistirDoInteresse } from "../../services/interesses";
import { mascaraTelefone } from "../../utils/mascaras";
import { haQuantoTempo, resumoDoAnimal } from "../../utils/rotulos";

// As mesmas cores do painel do protetor (Figma: Minhas candidaturas)
const status = {
  PENDENTE: { texto: "Pendente", variante: "destaqueRoxo" },
  EM_CONTATO: { texto: "Em contato", variante: "atencao" },
  APROVADO: { texto: "Aprovado", variante: "disponivel" },
  DESCONTINUADO: { texto: "Descontinuado", variante: "neutro" },
};

// O py-0.5 deixa a área de toque do e-mail e do WhatsApp com pelo menos 24 px de altura no celular
const estiloDoLink =
  "py-0.5 underline decoration-borda-forte underline-offset-2 hover:text-marca-roxo hover:decoration-marca-roxo";

// Uma candidatura em Minhas candidaturas (UC07, RF09): o animal, o andamento e o contato do protetor,
// pra pessoa também poder iniciar a conversa.
//   Ver ficha: só com o animal disponível. Animal adotado só aparece pro protetor
//   Desistir: só com o interesse pendente ou em contato (UC07 FA01). O interesse é apagado
export default function Candidatura({ candidatura, aoDesistir }) {
  const {
    id,
    dataHora,
    statusAndamento,
    motivoDescontinuacao,
    animal,
    contatoProtetor,
  } = candidatura;
  const { token, sair } = useAuth();
  const [confirmando, setConfirmando] = useState(false);
  const [enviando, setEnviando] = useState(false);
  const [erro, setErro] = useState("");

  const emAndamento =
    statusAndamento === "PENDENTE" || statusAndamento === "EM_CONTATO";
  const fichaAberta = animal.statusAdocao === "DISPONIVEL";
  const descricao = resumoDoAnimal(animal);
  const telefone = mascaraTelefone(contatoProtetor.telefone);
  const idBotaoDesistir = `desistir-${id}`;
  const idConfirmacao = `confirmar-desistencia-${id}`;

  function alternarConfirmacao() {
    setConfirmando((atual) => !atual);
    setErro("");
  }

  // O botão de desistir continua na tela, então o foco pode voltar pra ele
  function voltar() {
    setConfirmando(false);
    document.getElementById(idBotaoDesistir)?.focus();
  }

  async function desistir() {
    setEnviando(true);
    setErro("");
    try {
      await desistirDoInteresse(id, token);
      aoDesistir(candidatura);
    } catch (erroDaApi) {
      if (erroDaApi.status === 401) {
        sair();
        return;
      }
      setErro(erroDaApi.message);
      setEnviando(false);
    }
  }

  return (
    <li className="rounded-[18px] border border-borda-sutil bg-fundo-superficie p-5">
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:gap-6">
        <div className="flex min-w-0 flex-1 items-start gap-4">
          {animal.fotoCapa ? (
            <img
              src={animal.fotoCapa}
              alt=""
              className="size-16 shrink-0 rounded-[12px] object-cover md:size-[88px]"
            />
          ) : (
            <span
              aria-hidden="true"
              className="size-16 shrink-0 rounded-[12px] bg-marca-roxo-suave md:size-[88px]"
            />
          )}
          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-[10px]">
              <h2 className="font-titulo text-subtitulo font-semibold text-texto-principal">
                {animal.nome}
              </h2>
              <Tag variante={status[statusAndamento].variante}>
                {status[statusAndamento].texto}
              </Tag>
            </div>
            <p className="mt-[6px] text-compacto text-texto-secundario">
              {descricao && `${descricao}. `}Interesse enviado{" "}
              {haQuantoTempo(dataHora)}
            </p>
            {statusAndamento === "APROVADO" && (
              <p className="mt-[6px] text-compacto text-status-disponivel-texto">
                Adoção aprovada. Combine os próximos passos com o protetor.
              </p>
            )}
            {statusAndamento === "DESCONTINUADO" && motivoDescontinuacao && (
              <p className="mt-[6px] text-compacto text-texto-secundario">
                <strong className="font-semibold">Motivo:</strong>{" "}
                {motivoDescontinuacao}
              </p>
            )}
          </div>
        </div>

        {/* No celular, uma linha separa o contato do animal, como no Figma */}
        <div className="border-t border-borda-sutil pt-4 md:w-[250px] md:shrink-0 md:border-0 md:pt-0">
          <p className="font-titulo text-overline uppercase text-texto-terciario">
            Contato do protetor
          </p>
          <p className="mt-1 font-titulo font-semibold text-texto-principal">
            {contatoProtetor.nome}
          </p>
          <p className="mt-1 flex flex-wrap gap-x-4 gap-y-1 text-compacto text-texto-secundario">
            <a
              href={`mailto:${contatoProtetor.email}`}
              className={`break-all ${estiloDoLink}`}
            >
              {contatoProtetor.email}
            </a>
            <a
              href={`https://wa.me/55${contatoProtetor.telefone}`}
              target="_blank"
              rel="noopener noreferrer"
              aria-label={`WhatsApp ${telefone}`}
              className={estiloDoLink}
            >
              {telefone}
            </a>
          </p>
        </div>

        {/* Sem ações, a coluna continua reservada no computador, pro contato ficar alinhado entre os cartões */}
        <div
          className={`flex-col gap-[9px] md:flex md:w-[190px] md:shrink-0 ${fichaAberta || emAndamento ? "flex" : "hidden"}`}
        >
          {fichaAberta && (
            <Botao
              variante="neutro"
              para={`/animais/${animal.id}`}
              aria-label={`Ver ficha de ${animal.nome}`}
            >
              Ver ficha
            </Botao>
          )}
          {emAndamento && (
            <Botao
              id={idBotaoDesistir}
              variante="perigo"
              aria-label={`Desistir da adoção de ${animal.nome}`}
              aria-expanded={confirmando}
              aria-controls={idConfirmacao}
              onClick={alternarConfirmacao}
              disabled={enviando}
            >
              Desistir da adoção
            </Botao>
          )}
        </div>
      </div>

      {confirmando && (
        <div
          id={idConfirmacao}
          className="mt-4 rounded-[12px] border border-borda-sutil bg-fundo-pagina p-4"
        >
          <p className="font-titulo font-semibold text-texto-principal">
            Desistir da adoção de {animal.nome}?
          </p>
          <p className="mt-1 text-compacto text-texto-secundario">
            Seu interesse é apagado e o protetor deixa de ver seus contatos. Se
            mudar de ideia, dá pra demonstrar interesse de novo.
          </p>
          {erro && (
            <p
              role="alert"
              className="mt-2 text-compacto text-status-erro-texto"
            >
              {erro}
            </p>
          )}
          {/* No celular, um botão embaixo do outro, na largura toda */}
          <div className="mt-3 flex flex-col gap-2 md:flex-row md:flex-wrap">
            <Botao onClick={desistir} disabled={enviando}>
              {enviando ? "Desistindo..." : "Confirmar desistência"}
            </Botao>
            <Botao variante="secundario" onClick={voltar} disabled={enviando}>
              Voltar
            </Botao>
          </div>
        </div>
      )}
    </li>
  );
}
