import { iniciais } from "../../utils/rotulos";

// A foto de perfil redonda, ou as iniciais quando a conta não pôs foto.
// A foto é enfeite (alt vazio): o nome da pessoa ou do abrigo sempre aparece do lado, em texto.
// className traz o tamanho e as cores das iniciais, que mudam de um lugar pro outro
export default function Avatar({ nome, fotoUrl, className = "" }) {
  if (fotoUrl) {
    return <img src={fotoUrl} alt="" className={`shrink-0 rounded-full object-cover ${className}`} />;
  }
  return (
    <span
      aria-hidden="true"
      className={`flex shrink-0 items-center justify-center rounded-full font-titulo font-semibold ${className}`}
    >
      {iniciais(nome)}
    </span>
  );
}
