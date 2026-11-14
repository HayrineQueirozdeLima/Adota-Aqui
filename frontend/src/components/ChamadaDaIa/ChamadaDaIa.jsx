import Botao from "../Botao/Botao";
import { useIaDisponivel } from "../../hooks/useIaDisponivel";

// Chamada pro "Me ajuda a escolher", em cima da vitrine. Sem a IA ligada no servidor, não aparece
export default function ChamadaDaIa() {
  const disponivel = useIaDisponivel();
  if (disponivel !== true) return null;

  return (
    <aside
      aria-label="Ajuda pra escolher"
      className="flex flex-col gap-3 rounded-[16px] border border-marca-roxo-suave bg-marca-roxo-suave px-5 py-4 sm:flex-row sm:items-center sm:justify-between"
    >
      <div>
        <p className="font-titulo text-item font-semibold text-texto-principal">Não sabe por onde começar?</p>
        <p className="text-compacto text-texto-secundario">
          Conte como é a sua rotina e a IA sugere até 3 animais que combinam com ela.
        </p>
      </div>
      <Botao variante="secundario" para="/me-ajuda-a-escolher" className="shrink-0">
        Me ajuda a escolher
      </Botao>
    </aside>
  );
}
