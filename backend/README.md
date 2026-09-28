# Back-end — Adota Aqui

API REST em Spring Boot. Se você é do squad de back, começa por aqui.

## Antes de mexer em qualquer coisa

1. Leia o `docs/api.md`. Ele é o combinado com o front: cada endpoint que a gente implementar tem que ficar igual ao que está lá.
2. Dê uma olhada no DER lógico e no dicionário de domínios (pasta `docs/diagramas/`). As entidades do pacote `model` seguem eles.

## Onde fica cada coisa

```
src/main/java/com/adotaaqui/
├── AdotaAquiApplication.java   liga a aplicação. Não mova ele de lugar
├── config/       Spring Security e CORS
├── controller/   as rotas da API
├── dto/          formatos de entrada e saída (o JSON)
├── exception/    tratamento de erros
├── model/        as entidades (viram as tabelas do banco)
│   └── enums/    as listas fechadas de opções
├── repository/   quem conversa com o banco
├── security/     JWT e login
└── service/      as regras de negócio
```

Cada pasta que ainda está vazia tem um `package-info.java` explicando o que vai nela.

O caminho de uma requisição é sempre: **controller → service → repository → banco**. O controller não fala direto com o repository, e regra de negócio fica só no service.

## O que já está pronto

- As entidades (`Usuario`, `Abrigo`, `Animal`, `Vacina`, `Interesse` e `Endereco`) e os enums, iguais ao DER lógico e ao dicionário de domínios.
- Os repositories com as buscas principais (login por CPF/CNPJ, meus animais, listagem por estado, interesses ativos).
- O teste `RacaTest`, que pode servir de modelo pros próximos.

Controllers, services, DTOs, segurança e tratamento de erro ainda estão por fazer. Cada um tem a sua issue no Projects.

## Banco de dados

A gente não escreve `CREATE TABLE`. O Hibernate cria e atualiza as tabelas sozinho a partir das entidades (`ddl-auto=update`), do jeito que o curso ensina.

Então, **pra mudar uma tabela, muda a entidade**. Só tem um cuidado: o Hibernate só acrescenta coluna. Se você renomear ou apagar um campo, avisa no grupo, porque todo mundo vai ter que apagar e recriar o banco local:

```sql
DROP DATABASE adota_aqui;
CREATE DATABASE adota_aqui;
```

## Rodando

```bash
mvn spring-boot:run
```

Precisa de um PostgreSQL rodando com o banco `adota_aqui` criado. O projeto usa usuário `postgres` e senha `postgres`. Se os seus forem diferentes, configure as variáveis de ambiente `DB_USERNAME` e `DB_PASSWORD` em vez de mudar o `application.properties` (senão a sua senha vai parar no repositório).

## Testes

```bash
mvn test
```

Os testes usam um banco H2 em memória, então não precisa do PostgreSQL. A meta do curso é **70% de cobertura**, então escreve o teste junto com o código, não deixa pro final.
