import { useId } from "react";

// Igual ao CampoTexto, mas pra texto comprido (depoimento, artigo do blog): rótulo em cima,
// erro ou dica embaixo e, com "maximo", o contador de caracteres ("120/1000").
// Tudo que não é das props abaixo vai direto pro <textarea> (value, onChange, placeholder...)
export default function CampoTextoLongo({
  rotulo,
  erro,
  dica,
  maximo,
  linhas = 6,
  className = "",
  value = "",
  ...propsDoTexto
}) {
  const id = useId();
  const idAjuda = `${id}-ajuda`;
  const idContador = `${id}-contador`;
  const ajuda = erro || dica;
  const descricao = [ajuda && idAjuda, maximo && idContador]
    .filter(Boolean)
    .join(" ");

  return (
    <div className={className}>
      <label
        htmlFor={id}
        className="mb-[7px] block font-titulo text-campo font-semibold text-texto-principal"
      >
        {rotulo}
      </label>
      <textarea
        id={id}
        rows={linhas}
        value={value}
        maxLength={maximo}
        aria-invalid={erro ? true : undefined}
        aria-describedby={descricao || undefined}
        className={`w-full rounded-[10px] border bg-fundo-superficie px-[15px] py-[14px] text-corpo text-texto-principal placeholder:text-texto-terciario focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-1 focus-visible:outline-marca-roxo ${
          erro ? "border-status-erro-texto" : "border-borda-forte"
        }`}
        {...propsDoTexto}
      />
      <div className="mt-1.5 flex justify-between gap-3 text-legenda">
        {ajuda ? (
          <p
            id={idAjuda}
            className={erro ? "text-status-erro-texto" : "text-texto-secundario"}
          >
            {ajuda}
          </p>
        ) : (
          <span />
        )}
        {maximo && (
          <p id={idContador} className="shrink-0 text-texto-secundario">
            {value.length}/{maximo}
          </p>
        )}
      </div>
    </div>
  );
}
