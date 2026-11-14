// Embrulha um bloco pra ele subir e aparecer de leve quando entra na tela (hooks/useRevelarAoRolar e index.css).
// "ordem" atrasa um pouquinho cada item de uma mesma linha, pra eles entrarem um depois do outro.
// O "grid" faz o card de dentro ocupar a altura toda, como se não tivesse nada em volta.
// Pra quem pediu menos movimento, ou em navegador que não sabe observar a rolagem, o bloco já aparece pronto
export default function Revelar({ ordem = 0, className = "", children }) {
  return (
    <div className={`revelar-ao-rolar grid ${className}`} style={{ "--ordem": ordem }}>
      {children}
    </div>
  );
}
