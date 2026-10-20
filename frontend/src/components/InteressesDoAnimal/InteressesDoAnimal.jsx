import { useState } from "react";
import { Link } from "react-router-dom";
import InteresseRecebido from "../InteresseRecebido/InteresseRecebido";
import Tag from "../Tag/Tag";
import { MOTIVO_PADRAO } from "../../services/interesses";
import { artigoDefinido, resumoDoAnimal } from "../../utils/rotulos";

// Em contato primeiro (é com quem o protetor já está conversando), depois os pendentes,
// o aprovado e os descontinuados. No mesmo status, quem chegou antes vem antes
const ordemDoStatus = { EM_CONTATO: 0, PENDENTE: 1, APROVADO: 2, DESCONTINUADO: 3 };

function emOrdem(lista) {
  return [...lista].sort(
    (a, b) =>
      ordemDoStatus[a.statusAndamento] - ordemDoStatus[b.statusAndamento] || a.dataHora.localeCompare(b.dataHora),
  );
}

// O resumo à direita do nome: "3 interesses, 1 em contato", "1 interesse pendente" ou "Histórico encerrado"
function resumoDosInteresses(interesses, encerrado) {
  if (encerrado) return "Histórico encerrado";
  const emContato = interesses.filter((interesse) => interesse.statusAndamento === "EM_CONTATO").length;
  const pendentes = interesses.filter((interesse) => interesse.statusAndamento === "PENDENTE").length;
  const emAndamento = emContato + pendentes;

  if (emAndamento === 0) return "Nenhum interesse em andamento";
  if (emContato === 0) return emAndamento === 1 ? "1 interesse pendente" : `${emAndamento} interesses pendentes`;
  return `${emAndamento === 1 ? "1 interesse" : `${emAndamento} interesses`}, ${emContato} em contato`;
}

// Um cartão por animal no painel do protetor (Figma: Interesses recebidos).
// "interesses" são todos os do animal. "status" é o filtro escolhido na página ("" = todos).
// Sem filtro, os descontinuados ficam recolhidos numa linha no fim do cartão, e o protetor abre se quiser
export default function InteressesDoAnimal({ animal, interesses, status, aoMudar }) {
  const [mostrarDescontinuados, setMostrarDescontinuados] = useState(false);
  const { id, nome, fotoCapa, statusAdocao, sexo, protetor } = animal;

  const encerrado =
    statusAdocao === "ADOTADO" || interesses.some((interesse) => interesse.statusAndamento === "APROVADO");
  const emAndamento = interesses.some((interesse) =>
    ["PENDENTE", "EM_CONTATO"].includes(interesse.statusAndamento),
  );
  const descontinuados = interesses.filter((interesse) => interesse.statusAndamento === "DESCONTINUADO");
  const recolherDescontinuados = status === "" && descontinuados.length > 0;

  let linhas;
  if (status) linhas = interesses.filter((interesse) => interesse.statusAndamento === status);
  else if (mostrarDescontinuados) linhas = interesses;
  else linhas = interesses.filter((interesse) => interesse.statusAndamento !== "DESCONTINUADO");
  linhas = emOrdem(linhas);

  // Os dados completos vêm de Meus animais. Se não vierem, o cartão mostra só o nome e a foto
  const descricao = resumoDoAnimal(animal);
  const ondeEsta = protetor ? `, em ${protetor.cidade}/${protetor.estado}` : "";
  const nomeComArtigo = sexo ? `${artigoDefinido(sexo)} ${nome}` : nome;

  const quantosDescontinuados =
    descontinuados.length === 1 ? "1 interesse descontinuado" : `${descontinuados.length} interesses descontinuados`;
  const descontinuadosPelaAprovacao =
    encerrado && descontinuados.every((interesse) => interesse.motivoDescontinuacao === MOTIVO_PADRAO);

  return (
    <section
      aria-labelledby={`animal-${id}`}
      className="flex flex-col gap-[14px] rounded-[18px] border border-borda-sutil bg-fundo-superficie p-5 md:p-6"
    >
      <div className="flex flex-wrap items-center gap-x-[14px] gap-y-3">
        {fotoCapa ? (
          <img src={fotoCapa} alt="" className="size-16 shrink-0 rounded-[12px] object-cover" />
        ) : (
          <span aria-hidden="true" className="size-16 shrink-0 rounded-[12px] bg-marca-roxo-suave" />
        )}
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-[10px]">
            <h2 id={`animal-${id}`} className="font-titulo text-subtitulo font-semibold text-texto-principal">
              <Link to={`/animais/${id}`} className="hover:underline">
                {nome}
              </Link>
            </h2>
            {statusAdocao === "ADOTADO" && <Tag>Adotado</Tag>}
            {statusAdocao === "DISPONIVEL" && <Tag variante="disponivel">Disponível</Tag>}
          </div>
          {descricao && (
            <p className="mt-[5px] text-legenda text-texto-terciario">
              {descricao}
              {ondeEsta}
            </p>
          )}
        </div>
        {/* No celular o resumo desce pra linha de baixo. Do tablet pra cima, fica à direita */}
        <p className="w-full text-compacto text-texto-secundario md:w-auto">
          {resumoDosInteresses(interesses, encerrado)}
        </p>
      </div>

      <hr className="border-borda-sutil" />

      {linhas.length > 0 && (
        <ul className="flex flex-col gap-[14px]">
          {linhas.map((interesse) => (
            <InteresseRecebido key={interesse.id} interesse={interesse} aoMudar={aoMudar} />
          ))}
        </ul>
      )}

      {!encerrado && emAndamento && status !== "APROVADO" && status !== "DESCONTINUADO" && (
        <p className="text-legenda text-texto-terciario">
          Ao aprovar um candidato, {nomeComArtigo} passa para Adotado e os demais interesses são descontinuados
          automaticamente, com motivo padrão.
        </p>
      )}

      {recolherDescontinuados && (
        <p className="text-legenda text-texto-terciario">
          {quantosDescontinuados}
          {descontinuadosPelaAprovacao && " automaticamente quando esta adoção foi aprovada"}.{" "}
          <button
            type="button"
            aria-expanded={mostrarDescontinuados}
            aria-label={`${mostrarDescontinuados ? "Esconder" : "Mostrar"} interesses descontinuados de ${nome}`}
            onClick={() => setMostrarDescontinuados((atual) => !atual)}
            className="font-titulo font-semibold text-marca-roxo underline underline-offset-2 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-marca-roxo"
          >
            {mostrarDescontinuados ? "Esconder" : "Mostrar"}
          </button>
        </p>
      )}
    </section>
  );
}
