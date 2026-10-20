// Endereço da API. No Netlify ele vem da variável VITE_API_URL;
// na máquina de vocês, sem variável nenhuma, usa o back rodando local.
// O Jest não entende import.meta (é coisa do Vite), por isso nos testes este arquivo
// é trocado pelo tests/__mocks__/ambiente.js (ver o moduleNameMapper do jest.config.js).
export const URL_API = (import.meta.env.VITE_API_URL || 'http://localhost:8080').replace(/\/$/, '');