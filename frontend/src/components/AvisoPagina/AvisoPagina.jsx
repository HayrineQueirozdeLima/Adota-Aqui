// Página inteira com um aviso no meio: "não encontrado", erro, "não é possível"...
// Com alerta, o leitor de tela anuncia a mensagem assim que ela aparece.
// A imagem é opcional e fica em cima do título (ex.: página não encontrada)
export default function AvisoPagina({ titulo, alerta = false, imagem, children }) {
  return (
    <main className="px-5 py-12 md:px-14">
      <div
        role={alerta ? "alert" : undefined}
        className="mx-auto max-w-[560px] overflow-hidden rounded-[16px] border border-borda-sutil bg-fundo-superficie text-center text-texto-secundario"
      >
        {imagem && <img src={imagem} alt="" className="aspect-[3/2] w-full object-cover" />}
        <div className="p-8">
          <h1 className="mb-2 font-titulo text-subtitulo font-semibold text-texto-principal">
            {titulo}
          </h1>
          {children}
        </div>
      </div>
    </main>
  );
}
