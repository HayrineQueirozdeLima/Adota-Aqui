import { useId } from "react";

// Mesmo visual e mesma acessibilidade do CampoTexto, pra listas de opções (<select>).
// A primeira opção é o "placeholder" vazio: enquanto ela estiver escolhida, o campo não foi respondido.
export default function CampoSelecao({
  rotulo,
  erro,
  dica,
  opcoes,
  vazio = "Escolha",
  className = "",
  ...propsDoSelect
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
      <select
        id={id}
        aria-invalid={erro ? true : undefined}
        aria-describedby={ajuda ? idAjuda : undefined}
        className={`w-full rounded-[10px] border bg-fundo-superficie px-[15px] py-[14px] text-corpo text-texto-principal focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-1 focus-visible:outline-marca-roxo disabled:bg-fundo-pagina disabled:text-texto-terciario ${
          erro ? "border-status-erro-texto" : "border-borda-forte"
        }`}
        {...propsDoSelect}
      >
        <option value="">{vazio}</option>
        {opcoes.map((opcao) => (
          <option key={opcao.valor} value={opcao.valor}>
            {opcao.nome}
          </option>
        ))}
      </select>
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
