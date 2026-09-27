/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  theme: {
    extend: {
      // As cores apontam pras variáveis do index.css
      //o Tailwind usa o tema certo sozinho (claro ou escuro)
      colors: {
        fundo: {
          pagina: 'var(--fundo-pagina)',
          superficie: 'var(--fundo-superficie)',
          marca: 'var(--fundo-marca)',
        },
        marca: {
          roxo: 'var(--marca-roxo)',
          'roxo-suave': 'var(--marca-roxo-suave)',
        },
        acao: {
          terracota: 'var(--acao-terracota)',
          'terracota-texto': 'var(--acao-terracota-texto)',
        },
        texto: {
          principal: 'var(--texto-principal)',
          secundario: 'var(--texto-secundario)',
          terciario: 'var(--texto-terciario)',
          'sobre-marca': 'var(--texto-sobre-marca)',
        },
        borda: {
          sutil: 'var(--borda-sutil)',
          forte: 'var(--borda-forte)',
        },
        status: {
          'disponivel-fundo': 'var(--status-disponivel-fundo)',
          'disponivel-texto': 'var(--status-disponivel-texto)',
          'atencao-fundo': 'var(--status-atencao-fundo)',
          'atencao-texto': 'var(--status-atencao-texto)',
          'erro-fundo': 'var(--status-erro-fundo)',
          'erro-texto': 'var(--status-erro-texto)',
          'neutro-fundo': 'var(--status-neutro-fundo)',
          'neutro-texto': 'var(--status-neutro-texto)',
        },
      },
      fontFamily: {
        titulo: ['Outfit', 'system-ui', 'sans-serif'],
        corpo: ['"Source Sans 3"', 'system-ui', 'sans-serif'],
      },
      // Os estilos de texto do Figma, com tamanho, altura da linha e espaçamento
      fontSize: {
        card: ['20px', { lineHeight: '1.25' }],
        display: ['32px', { lineHeight: '1.12', letterSpacing: '-0.02em' }],
        secao: ['24px', { lineHeight: '1.2', letterSpacing: '-0.02em' }],
        subtitulo: ['21px', { lineHeight: '1.3', letterSpacing: '-0.01em' }],
        item: ['16px', { lineHeight: '1.35' }],
        botao: ['15px', { lineHeight: '1.2' }],
        campo: ['13px', { lineHeight: '1.3' }],
        overline: ['12px', { lineHeight: '1.3', letterSpacing: '0.18em' }],
        corpo: ['15px', { lineHeight: '1.65' }],
        compacto: ['14px', { lineHeight: '1.6' }],
        legenda: ['13px', { lineHeight: '1.5' }],
      },
    },
  },
  plugins: [],
};