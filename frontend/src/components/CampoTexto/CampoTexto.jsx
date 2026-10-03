import { useId } from "react";

//  rótulo em cima, dica ou erro embaixo.
// O aria-describedby liga a mensagem ao campo, então o leitor de tela lê as duas juntas.
// Tudo que não é rotulo/erro/dica/className vai direto pro <input> (value, onChange, type...).
export default function CampoTexto({
  rotulo,
  erro,
  dica,
  className = "",
  ...propsDoInput
}) {
  const id = useId();
  const idAjuda = `${id}-ajuda`;
  const ajuda = erro || dica;

  return (
    <div className={className}>
      <label
        htmlFor={id}
        className="mb-[7px] block font-titulo text-campo font-semibold text-texto-principal"
      >
        {rotulo}
      </label>
      <input
        id={id}
        aria-invalid={erro ? true : undefined}
        aria-describedby={ajuda ? idAjuda : undefined}
        className={`w-full rounded-[10px] border bg-fundo-superficie px-[15px] py-[14px] text-corpo text-texto-principal placeholder:text-texto-terciario focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-1 focus-visible:outline-marca-roxo ${
          erro ? "border-status-erro-texto" : "border-borda-forte"
        }`}
        {...propsDoInput}
      />
      {ajuda && (
        <p
          id={idAjuda}
          className={`mt-1.5 text-legenda ${erro ? "text-status-erro-texto" : "text-texto-terciario"}`}
        >
          {ajuda}
        </p>
      )}
    </div>
  );
}
