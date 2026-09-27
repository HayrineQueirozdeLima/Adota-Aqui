// As cores de cada tipo de tag
// os nomes vêm dos tokens de status do Figma
const variantes = {
  disponivel: "bg-status-disponivel-fundo text-status-disponivel-texto",
  neutro: "bg-status-neutro-fundo text-status-neutro-texto",
  atencao: "bg-status-atencao-fundo text-status-atencao-texto",
  erro: "bg-status-erro-fundo text-status-erro-texto",
  destaque_roxo: "bg-marca-roxo-suave text-marca-roxo",
};

export default function Tag({ variante = "neutro", children }) {
  return (
    <span
      className={`inline-flex items-center rounded-[7px] px-[9px] py-[5px] font-titulo font-semibold text-campo whitespace-nowrap ${variantes[variante]}`}
    >
      {children}
    </span>
  );
}
