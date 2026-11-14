# Adota Aqui

Plataforma de adoção de animais, criada como projeto final da Trilha Dev. Full Stack 2026 (+praTi & Codifica).

ONGs, abrigos e pessoas que resgataram um animal cadastram os animais pra adoção. Quem quer adotar procura na vitrine, demonstra interesse e já recebe o contato do protetor. O sistema é a ponte: a conversa e a decisão acontecem fora dele.

## Links do projeto

| O quê                                         | Onde                                                                                                 |
| --------------------------------------------- | ---------------------------------------------------------------------------------------------------- |
| Site no ar                                    | https://adotaaqui.netlify.app                                                                        |
| API no ar                                     | https://adota-aqui.onrender.com                                                                      |
| Documentação da API (Swagger), pra testar     | https://adota-aqui.onrender.com/swagger-ui.html                                                      |
| Repositório                                   | https://github.com/HayrineQueirozdeLima/Adota-Aqui                                                   |
| Quadro de tarefas (GitHub Projects)           | https://github.com/users/HayrineQueirozdeLima/projects/3                                             |
| Protótipo e design system (Figma)             | https://www.figma.com/design/WPaYohTNilNf8V0gU4OXTH                                                  |
| Versões                                       | [`CHANGELOG.md`](CHANGELOG.md) e [Releases](https://github.com/HayrineQueirozdeLima/Adota-Aqui/releases) |
| Requisitos (ERS) e casos de uso               | [`docs/requisitos/`](docs/requisitos/)                                                               |

A API "dorme" depois de 15 minutos sem uso. O primeiro acesso depois disso pode levar cerca de 1 minuto (no site e no Swagger).

## Tecnologias

- Front-end: React + Vite + Tailwind, no Netlify
- Back-end: Spring Boot + Spring Security (JWT + BCrypt), no Render
- Banco de dados: PostgreSQL no Neon, com tabelas criadas pelo Hibernate (JPA)
- Fotos dos animais: Amazon S3
- Testes: JUnit e JaCoCo no back, Jest e Testing Library no front
- CI: GitHub Actions, com cobertura mínima de 70% nos dois lados
- Documentação da API: Swagger (springdoc-openapi), gerado a partir dos controllers
- Docker: a imagem do back (a mesma que o Render usa) e um Docker Compose com banco, back e front
- IA (opcional): Gemini, do Google, nas ajudas "Escrever com IA" e "Me ajuda a escolher"

## Documentação técnica

| O que o curso pede             | Onde está                                                                                                      |
| ------------------------------ | -------------------------------------------------------------------------------------------------------------- |
| Instruções para execução local | [Como rodar localmente](#como-rodar-localmente), logo abaixo                                                   |
| Descrição da arquitetura       | [`docs/arquitetura.md`](docs/arquitetura.md): front, back, banco, autenticação e o caminho dos dados           |
| Funcionalidades implementadas  | [`docs/funcionalidades.md`](docs/funcionalidades.md): cada tela, com regras, código, testes e print            |
| Aspectos relevantes            | [`docs/aspectos-relevantes.md`](docs/aspectos-relevantes.md): decisões de design, desafios técnicos e soluções |

E os diferenciais que o curso sugere:

| Diferencial | Onde está |
| ----------- | --------- |
| Docker      | [`docker-compose.yml`](docker-compose.yml), [`backend/Dockerfile`](backend/Dockerfile) e [`frontend/Dockerfile`](frontend/Dockerfile). Como usar: [Rodar com Docker](#rodar-com-docker) |
| Swagger     | https://adota-aqui.onrender.com/swagger-ui.html (e `http://localhost:8080/swagger-ui.html` na sua máquina) |

Também ajudam:

- [`docs/api.md`](docs/api.md): o contrato da API, com todos os endpoints e os erros. O Swagger mostra os mesmos endpoints, pra testar no navegador
- [`docs/deploy.md`](docs/deploy.md): onde cada parte roda, as variáveis de ambiente e o checklist da apresentação
- [`docs/relatorio-de-testes.md`](docs/relatorio-de-testes.md): o resultado final dos testes e da cobertura
- [`docs/README.md`](docs/README.md): o mapa de toda a pasta `docs/`, com os requisitos e os diagramas

## Rodar com Docker

Com o [Docker Desktop](https://www.docker.com/products/docker-desktop/) instalado, um comando sobe o banco, o back e o front, sem instalar Java, Maven, Node nem PostgreSQL:

```bash
git clone https://github.com/HayrineQueirozdeLima/Adota-Aqui.git
cd Adota-Aqui
docker compose up --build
```

A primeira vez demora uns minutos (baixa as imagens e as bibliotecas). Quando aparecer `Started AdotaAquiApplication`, abra:

- Site: http://localhost:5173
- Swagger: http://localhost:8080/swagger-ui.html

Pra parar, `Ctrl+C`. Pra apagar também o banco, `docker compose down -v`. O banco começa vazio, e as fotos ficam na memória do back, como explica o passo 6 logo abaixo.

## Como rodar localmente

### 1. Instale

- Java 17 ou mais novo, e o Maven
- Node.js 20 ou mais novo
- PostgreSQL (qualquer versão recente)
- Git

Não precisa de conta na AWS: na sua máquina, as fotos ficam na memória.

### 2. Baixe o projeto

```bash
git clone https://github.com/HayrineQueirozdeLima/Adota-Aqui.git
cd Adota-Aqui
```

### 3. Crie o banco

Crie um banco vazio chamado `adota_aqui`. As tabelas, quem cria é o back, na primeira vez que ele subir.

```bash
createdb -U postgres adota_aqui
```

Se preferir, crie pelo pgAdmin ou pelo `psql`, com `CREATE DATABASE adota_aqui;`.

### 4. Suba o back-end

```bash
cd backend
mvn spring-boot:run
```

Ele sobe em `http://localhost:8080` e procura o banco em `localhost:5432` com o usuário `postgres` e a senha `postgres`. Se os seus forem outros, passe pelas variáveis de ambiente em vez de mudar o `application.properties` (senão a sua senha vai parar no repositório):

```bash
DB_USERNAME=seu_usuario DB_PASSWORD=sua_senha mvn spring-boot:run
```

Quando aparecer `Started AdotaAquiApplication` no terminal, o back está pronto. Pra conferir, abra http://localhost:8080/api/racas?especie=CAO no navegador: tem que aparecer a lista de raças. A documentação da API, pra testar cada endpoint, fica em http://localhost:8080/swagger-ui.html.

### 5. Suba o front-end

Em outro terminal, a partir da pasta do projeto:

```bash
cd frontend
npm install
npm run dev
```

Abra http://localhost:5173. Sem configurar nada, o front já chama o back em `localhost:8080`.

### 6. Experimente

O banco começa vazio. Pra ver a vitrine com animais:

1. Crie uma conta de abrigo (ou de pessoa física) em "Cadastrar", no topo, e cadastre um animal em Meus animais.
2. Numa janela anônima, crie uma conta de pessoa física no estado onde o animal está (no cadastro, ele já vem com o endereço da conta, mas dá pra trocar) e demonstre interesse no animal.
3. Volte pra primeira conta e veja o interesse em Interesses recebidos.

Na sua máquina, o envio da foto funciona, mas a imagem aparece quebrada no formulário e na vitrine: ela fica só na memória do back, o endereço salvo não abre e a foto some quando o back reinicia. No site publicado, as fotos vão pro S3 e aparecem normalmente.

## Testes

```bash
# back-end: testes + relatório de cobertura (JaCoCo) + a régua de 70%
# usa um banco H2 em memória, não precisa do PostgreSQL
cd backend && mvn verify

# front-end: testes + relatório de cobertura
cd frontend && npm run test:coverage
```

Os relatórios ficam em `backend/target/site/jacoco/index.html` e `frontend/coverage/lcov-report/index.html`. O resultado final está no [relatório de testes](docs/relatorio-de-testes.md).

## Estrutura do projeto

- `backend/`: API REST (Spring Boot). Tem um README próprio explicando as pastas
- `frontend/`: interface web (React). Também tem README próprio
- `docs/`: documentação técnica, contrato da API, requisitos, diagramas e o SQL do banco de produção
- `.github/workflows/`: o CI de cada PR e a conferência diária do site publicado
- `render.yaml` e `netlify.toml`: a configuração do deploy
- `docker-compose.yml`: o projeto inteiro (banco, back e front) com um comando
- `CHANGELOG.md`: o histórico de versões

## Chegou agora? Começa por aqui

1. Leia o README da sua parte (`backend/README.md` ou `frontend/README.md`).
2. Leia o `docs/api.md`. É o combinado entre front e back.
3. Abra o GitHub Projects, filtre pela sprint atual e pelo seu squad e escolha uma issue.

## Como a gente trabalha

- A `dev` é a branch padrão: é onde o trabalho do time se junta.
- A `main` é a versão estável, a que vai ser apresentada e a que está no ar (o Render e o Netlify publicam a `main`). Ela só recebe a `dev`,
  por Pull Request, no fim de cada sprint.
- Ninguém faz push direto na `main` nem na `dev`. As duas são protegidas.
- Cada tarefa ganha uma branch própria, criada a partir da `dev`:
  `feature/nome-da-tarefa` (ou `fix/...` pra correção).
- Terminou? Abre um Pull Request para a `dev`, com `Closes #número-da-issue` na descrição.
  Quando o PR entra, a issue fecha sozinha.
- O PR só entra com o CI verde e pelo menos uma pessoa aprovando.
- Mudou um endpoint? Atualiza o `docs/api.md` no mesmo PR.
- Cada entrega na `main` vira uma versão: uma tag `vX.Y.Z` e o que mudou no [`CHANGELOG.md`](CHANGELOG.md), com o número de cada PR.

Como o deploy funciona e como subir tudo do zero: [`docs/deploy.md`](docs/deploy.md).
