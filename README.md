# Adota Aqui

Plataforma de adoção de animais — projeto final da Trilha Dev. Full Stack 2026 (+praTi & Codifica).

## Tecnologias

- Front-end: React + Tailwind
- Back-end: Spring Boot + PostgreSQL
- Autenticação: JWT + BCrypt

## Como rodar localmente

### Back-end

```bash
cd backend
mvn spring-boot:run
```

Requer um PostgreSQL local com um banco `adota_aqui` criado, ou as variáveis de ambiente `DB_USERNAME` e `DB_PASSWORD` configuradas.

### Front-end

```bash
cd frontend
npm install
npm run dev
```

## Testes

```bash
# back-end
cd backend && mvn test

# front-end
cd frontend && npm test
```

## Estrutura do projeto

- `backend/` — API REST (Spring Boot)
- `frontend/` — interface web (React)
- `docs/` — requisitos, diagramas e atas
