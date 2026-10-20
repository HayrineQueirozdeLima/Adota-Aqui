// Uma pergunta de múltipla escolha (só uma resposta), no formato de "pílulas" do Figma.
// Por baixo são <input type="radio"> de verdade: funciona com teclado (setas) e leitor de tela.
// O <fieldset> com <legend> faz o leitor de tela anunciar a pergunta junto com cada opção.
export default function GrupoOpcoes({
  nome,
  legenda,
  opcoes,
  valor,
  aoMudar,
  erro,
}) {
  const idErro = `${nome}-erro`;

  return (
    <fieldset>
      <legend className="mb-2 font-titulo font-semibold text-campo text-texto-principal">
        {legenda}
      </legend>
      <div className="flex flex-wrap gap-2">
        {opcoes.map((opcao) => (
          <label
            key={opcao.valor}
            className={`inline-flex cursor-pointer items-center gap-2 rounded-[10px] border-[1.5px] bg-fundo-superficie px-3.5 py-2.5 font-titulo font-semibold text-campo text-texto-principal has-[:checked]:border-marca-roxo has-[:checked]:bg-marca-roxo-suave has-[:focus-visible]:outline has-[:focus-visible]:outline-2 has-[:focus-visible]:outline-offset-2 has-[:focus-visible]:outline-marca-roxo ${
              erro ? "border-status-erro-texto" : "border-borda-forte"
            }`}
          >
            <input
              type="radio"
              name={nome}
              value={opcao.valor}
              checked={valor === opcao.valor}
              onChange={() => aoMudar(opcao.valor)}
              aria-invalid={erro ? true : undefined}
              aria-describedby={erro ? idErro : undefined}
              className="size-4 accent-marca-roxo focus:outline-none"
            />
            {opcao.nome}
          </label>
        ))}
      </div>
      {erro && (
        <p id={idErro} className="mt-1.5 text-legenda text-status-erro-texto">
          {erro}
        </p>
      )}
    </fieldset>
  );
}
