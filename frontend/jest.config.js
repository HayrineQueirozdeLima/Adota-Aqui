export default {
  testEnvironment: 'jsdom',
  setupFilesAfterEnv: ['<rootDir>/jest.setup.js'],
  moduleNameMapper: {
    // Todo import que termina em .svg, .png, .jpg... vai pro arquivo substituto
    '\\.(svg|png|jpg|jpeg|webp)$': '<rootDir>/tests/__mocks__/arquivo.js',
    // O ambiente.js usa import.meta, que só o Vite entende. Nos testes entra o substituto
    '^.+/config/ambiente$': '<rootDir>/tests/__mocks__/ambiente.js',
  },
  // entra na cobertura todo o src, menos o que não tem lógica ainda pra testar
  collectCoverageFrom: ['src/**/*.{js,jsx}', '!src/main.jsx', '!src/mocks/**', '!src/config/ambiente.js'],
  // text: a tabela no terminal; lcov: o relatório em HTML; json-summary: o total que o CI mostra no resumo
  coverageReporters: ['text', 'lcov', 'json-summary'],
  // RNF04: o teste falha se a cobertura de linhas ficar abaixo de 70%
  coverageThreshold: { global: { lines: 70, statements: 70 } },
};