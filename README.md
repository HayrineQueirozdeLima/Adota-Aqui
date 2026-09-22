# Adota Aqui

Plataforma de adoção de animais — projeto final da Trilha Dev. Full Stack 2026 (+praTi & Codifica).

## Tecnologias

- Front-end: React + Vite + Tailwind
- Back-end: Spring Boot + Spring Security (JWT + BCrypt)
- Banco de dados: PostgreSQL, com versionamento de schema via Flyway

## Como rodar localmente

### Pré-requisitos

- Java 17+ e Maven
- Node.js 20+
- PostgreSQL com um banco chamado `adota_aqui`

### Back-end

```bash
cd backend
mvn spring-boot:run
```

Na primeira execução o Flyway cria as tabelas automaticamente a partir de
`src/main/resources/db/migration`. As credenciais do banco podem ser
definidas pelas variáveis de ambiente `DB_URL`, `DB_USERNAME` e `DB_PASSWORD`.

### Front-end

```bash
cd frontend
npm install
npm run dev
```

## Testes

```bash
# back-end (usa banco H2 em memória, não precisa de PostgreSQL)
cd backend && mvn test

# front-end
cd frontend && npm test
```

## Estrutura do projeto

- `backend/` — API REST (Spring Boot)
- `frontend/` — interface web (React)
- `docs/` — requisitos, diagramas e atas
