// Página inteira com um aviso no meio: "não encontrado", erro, "não é possível"...
// Com alerta, o leitor de tela anuncia a mensagem assim que ela aparece.
export default function AvisoPagina({ titulo, alerta = false, children }) {
  return (
    <main className="px-5 py-12 md:px-14">
      <div
        role={alerta ? "alert" : undefined}
        className="mx-auto max-w-[560px] rounded-[16px] border border-borda-sutil bg-fundo-superficie p-8 text-center text-texto-secundario"
      >
        <h1 className="mb-2 font-titulo text-subtitulo font-semibold text-texto-principal">
          {titulo}
        </h1>
        {children}
      </div>
    </main>
  );
}
