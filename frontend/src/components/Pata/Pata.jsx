// Pegada de pata, desenhada num quadrado de 24x24 com os dedos pra cima.
// FormaDaPata é só o desenho, pra usar dentro de outro <svg> (a ponte do Quem somos usa assim).
// Pata é o ícone pronto, que pega a cor do texto (fill="currentColor")
export function FormaDaPata() {
  return (
    <g>
      <path d="M12 11.2c-3.1 0-6 3-6 5.6 0 1.8 1.4 2.8 3.1 2.8 1.2 0 1.9-.5 2.9-.5s1.7.5 2.9.5c1.7 0 3.1-1 3.1-2.8 0-2.6-2.9-5.6-6-5.6Z" />
      <ellipse cx="5.6" cy="10.4" rx="1.9" ry="2.4" transform="rotate(-22 5.6 10.4)" />
      <ellipse cx="9.4" cy="6.6" rx="2" ry="2.6" transform="rotate(-8 9.4 6.6)" />
      <ellipse cx="14.6" cy="6.6" rx="2" ry="2.6" transform="rotate(8 14.6 6.6)" />
      <ellipse cx="18.4" cy="10.4" rx="1.9" ry="2.4" transform="rotate(22 18.4 10.4)" />
    </g>
  );
}

export default function Pata({ className = "" }) {
  return (
    <svg aria-hidden="true" viewBox="0 0 24 24" fill="currentColor" className={className}>
      <FormaDaPata />
    </svg>
  );
}
