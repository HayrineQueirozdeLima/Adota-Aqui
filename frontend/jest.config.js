export default {
  testEnvironment: 'jsdom',
  setupFilesAfterEnv: ['<rootDir>/jest.setup.js'],
  // Todo import que termina em .svg, .png, .jpg... vai pro arquivo substituto
  moduleNameMapper: {
    '\\.(svg|png|jpg|jpeg|webp)$': '<rootDir>/tests/__mocks__/arquivo.js',
  },
  // entra na cobertura todo o src, menos o que não tem lógica ainda pra testar
  collectCoverageFrom: ['src/**/*.{js,jsx}', '!src/main.jsx', '!src/mocks/**'],
};