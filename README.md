# Adota Aqui

Plataforma de adoção de animais — projeto final da Trilha Dev. Full Stack 2026 (+praTi & Codifica).

## Tecnologias

- Front-end: React + Vite + Tailwind
- Back-end: Spring Boot + Spring Security (JWT + BCrypt)
- Banco de dados: PostgreSQL, com tabelas criadas pelo Hibernate (JPA)

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

Na primeira execução o Hibernate cria as tabelas automaticamente a partir
das entidades do pacote `model`. As credenciais do banco podem ser
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

- `backend/` — API REST (Spring Boot). Tem um README próprio explicando as pastas
- `frontend/` — interface web (React). Também tem README próprio
- `docs/` — contrato da API, requisitos, diagramas e atas

## Chegou agora? Começa por aqui

1. Leia o README da sua parte (`backend/README.md` ou `frontend/README.md`).
2. Leia o `docs/api.md`. É o combinado entre front e back.
3. Abra o GitHub Projects, filtre pela sprint atual e pelo seu squad e escolha uma issue.

## Como a gente trabalha

- A `main` é a versão estável. Ninguém faz commit direto nela.
- Cada tarefa ganha uma branch própria, criada a partir da `dev`: `feature/nome-da-tarefa` (ou `fix/...` pra correção).
- Terminou? Abre um pull request **para a `dev`**, com `Closes #número-da-issue` na descrição. Assim a issue fecha sozinha quando o PR entra.
- O PR só entra com o CI verde e pelo menos uma pessoa aprovando.
- Mudou um endpoint? Atualiza o `docs/api.md` no mesmo PR.
