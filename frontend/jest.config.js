export default {
  testEnvironment: 'jsdom',
  setupFilesAfterEnv: ['<rootDir>/jest.setup.js'],
  // Todo import que termina em .svg, .png, .jpg... vai pro arquivo substituto
  moduleNameMapper: {
    '\\.(svg|png|jpg|jpeg|webp)$': '<rootDir>/tests/__mocks__/arquivo.js',
  },
};