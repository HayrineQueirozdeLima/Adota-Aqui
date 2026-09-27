import Botao from "../../components/Botao/Botao";
import Tag from "../../components/Tag/Tag";

export default function Home() {
  return (
    <main className="p-8 space-y-4">
      <h1 className="font-titulo font-semibold text-display">Adota Aqui</h1>

      <div className="flex gap-2">
        <Tag variante="disponivel">Disponível</Tag>
        <Tag>Fêmea</Tag>
        <Tag variante="atencao">Mais animada</Tag>
      </div>

      <div className="flex gap-4 bg-fundo-marca p-4">
        <Botao>Quero conhecer Mel</Botao>
        <Botao variante="contorno" para="/login">
          Entrar
        </Botao>
      </div>
    </main>
  );
}
