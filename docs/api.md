# Contrato da API — Adota Aqui

Este documento define **todos os endpoints da API REST** do Adota Aqui: o que cada um recebe, o que devolve, quem pode acessar e quais erros pode retornar.

Ele é o acordo entre os squads:

- o **Front End** monta as telas e as chamadas seguindo exatamente os formatos daqui, podendo usar dados de exemplo enquanto o endpoint real não fica pronto;
- o **Back End** implementa cada endpoint respeitando os formatos, os códigos de resposta e as regras daqui;
- o squad de **Testes** usa as tabelas de erro como roteiro de casos de teste.

Fontes: Especificação de Requisitos (RF01–RF17), Casos de Uso (UC01–UC10), DER lógico e dicionário de domínios (documento de diagramas). Quando este documento e os requisitos discordarem, **os requisitos valem** e este documento deve ser corrigido.

---

## Sumário

1. [Como manter este documento](#1-como-manter-este-documento)
2. [Convenções gerais](#2-convenções-gerais)
3. [Autenticação e níveis de acesso](#3-autenticação-e-níveis-de-acesso)
4. [Formato padrão de erro](#4-formato-padrão-de-erro)
5. [Mapa dos endpoints](#5-mapa-dos-endpoints)
6. [Autenticação e cadastro](#6-autenticação-e-cadastro)
7. [Perfil da conta](#7-perfil-da-conta)
8. [Animais](#8-animais)
9. [Interesses](#9-interesses)
10. [Pontos em aberto](#10-pontos-em-aberto)

---

## 1. Como manter este documento

- **Mudou um endpoint no código? Atualize este arquivo no mesmo pull request.** Um contrato desatualizado é pior do que nenhum, porque o outro squad confia nele.
- Nenhum squad muda um formato de entrada ou saída sozinho. Mudança de contrato é combinada entre Front End e Back End antes de ser implementada.
- Cada endpoint indica a sua **origem** (RF/UC). Se um requisito mudar, procure aqui pelo código dele para achar os endpoints afetados.
- Decisões ainda não fechadas ficam na seção [10. Pontos em aberto](#10-pontos-em-aberto) até o time decidir.

---

## 2. Convenções gerais

| Item | Convenção |
| --- | --- |
| URL base | `/api` (local: `http://localhost:8080/api`) |
| Formato | JSON em UTF-8. Toda requisição com corpo envia o cabeçalho `Content-Type: application/json` |
| Nomes dos campos | camelCase, iguais aos atributos dos DTOs Java (`dataNascEstimada`, `statusAndamento`) |
| Identificadores | UUID em texto (`"3f6c1a2e-8b4d-4c7a-9e1f-2a5b7c9d0e11"`) |
| Valores de enum | Texto em maiúsculas, exatamente como no dicionário de domínios (`"DISPONIVEL"`, `"FEMEA"`, `"CAO"`) |
| Datas | `AAAA-MM-DD` (ex.: `"2026-03-15"`) |
| Data e hora | `AAAA-MM-DDTHH:mm:ss` (ex.: `"2026-09-26T14:30:00"`) |
| CPF, CNPJ, CEP e telefone | **Somente números**, sem pontos, traços, barras ou parênteses. O front remove a máscara antes de enviar |
| Campo opcional sem valor | Enviado como `null` ou omitido |
| Senha | Nunca aparece em nenhuma resposta |

### Métodos HTTP

| Método | Uso neste projeto |
| --- | --- |
| `GET` | Consultar. Nunca altera dados |
| `POST` | Criar um registro novo ou enviar dados para processamento (login) |
| `PUT` | Substituir um registro inteiro. O corpo leva **todos** os campos editáveis |
| `PATCH` | Alterar só uma parte do registro (ex.: só o status) |
| `DELETE` | Remover |

### Códigos de resposta

| Código | Significado neste projeto |
| --- | --- |
| `200 OK` | Deu certo e há dados na resposta |
| `201 Created` | Um registro novo foi criado |
| `204 No Content` | Deu certo e não há nada a devolver |
| `400 Bad Request` | Dado faltando, em formato inválido ou que viola uma regra de preenchimento |
| `401 Unauthorized` | Não foi possível identificar quem está pedindo: sem token, token inválido/expirado ou login incorreto |
| `403 Forbidden` | A pessoa foi identificada, mas não pode fazer isso (ex.: mexer no animal de outra pessoa) |
| `404 Not Found` | O recurso não existe (ou não está visível para quem pediu) |
| `409 Conflict` | Conflita com o estado atual dos dados (ex.: CPF já cadastrado, animal já adotado) |
| `500 Internal Server Error` | Falha no servidor. Não é causada por quem pediu |

**Lista vazia não é erro.** Uma consulta que não encontra nada responde `200 OK` com `[]`. Cabe ao front exibir a mensagem de "nenhum resultado".

---

## 3. Autenticação e níveis de acesso

O login (e o cadastro, que já autentica automaticamente) devolve um **token JWT**. Todo endpoint que exige login recebe esse token no cabeçalho:

```
Authorization: Bearer eyJhbGciOiJIUzI1NiJ9...
```

- O token identifica a conta (`id`) e o tipo de conta (`USUARIO` ou `ABRIGO`).
- Validade: **24 horas**. Depois disso, a API responde `401` e o front deve levar a pessoa de volta ao login.
- Se o cabeçalho `Authorization` for enviado com um token inválido ou expirado, a API responde `401` **mesmo em endpoints públicos**. Assim um Usuario com sessão vencida não passa a ver a listagem de todos os estados sem perceber.

| Nível de acesso | Quem pode |
| --- | --- |
| **Público** | Qualquer pessoa, com ou sem token (Visitante, Usuario, Abrigo) |
| **Autenticado** | Usuario ou Abrigo com token válido |
| **Somente Usuario** | Apenas conta de pessoa física (CPF) |
| **Somente Abrigo** | Apenas conta institucional (CNPJ) |
| **Protetor do animal** | Apenas a conta (Usuario ou Abrigo) que cadastrou aquele animal |
| **Candidato do interesse** | Apenas o Usuario que registrou aquele interesse |

O front esconde botões e redireciona conforme o nível de acesso, mas **quem garante a regra é a API** (RNF03). Toda verificação de permissão é feita no Back End.

---

## 4. Formato padrão de erro

Todo erro (4xx e 5xx) responde no mesmo formato, para o front tratar todos do mesmo jeito:

```json
{
  "status": 400,
  "erro": "Bad Request",
  "mensagem": "Existem campos obrigatórios não preenchidos.",
  "campos": {
    "nome": "O nome é obrigatório.",
    "telefone": "O telefone deve conter somente números."
  },
  "timestamp": "2026-09-26T14:30:00"
}
```

| Campo | Descrição |
| --- | --- |
| `status` | Código HTTP |
| `erro` | Nome padrão do código |
| `mensagem` | Texto pronto para exibir na tela, em português |
| `campos` | Presente só em erros de validação: um item por campo com problema. O front exibe cada mensagem embaixo do campo correspondente |
| `timestamp` | Momento do erro |

---

## 5. Mapa dos endpoints

| Método | URL | Acesso | Origem |
| --- | --- | --- | --- |
| `POST` | `/api/auth/login` | Público | RF03, UC03 |
| `POST` | `/api/usuarios` | Público | RF01, UC01 |
| `POST` | `/api/abrigos` | Público | RF02, UC02 |
| `GET` | `/api/usuarios/me` | Somente Usuario | RF17, UC10 |
| `PUT` | `/api/usuarios/me` | Somente Usuario | RF17, UC10 |
| `PATCH` | `/api/usuarios/me/senha` | Somente Usuario | RF17, UC10 FA03 |
| `GET` | `/api/abrigos/me` | Somente Abrigo | RF17, UC10 |
| `PUT` | `/api/abrigos/me` | Somente Abrigo | RF17, UC10 |
| `PATCH` | `/api/abrigos/me/senha` | Somente Abrigo | RF17, UC10 FA03 |
| `GET` | `/api/racas` | Público | RF04, RF07 |
| `GET` | `/api/animais` | Público | RF07, RF14, UC06 |
| `GET` | `/api/animais/{id}` | Público | UC06 |
| `GET` | `/api/animais/meus` | Autenticado | UC05 |
| `POST` | `/api/animais` | Autenticado | RF04, RF05, UC04 |
| `PUT` | `/api/animais/{id}` | Protetor do animal | RF06, UC05 |
| `DELETE` | `/api/animais/{id}` | Protetor do animal | RF06, UC05 FA03 |
| `POST` | `/api/fotos` | Autenticado | RF16 |
| `POST` | `/api/animais/{id}/interesses` | Somente Usuario | RF08, RF09, RF13, RF14, RF15, UC07 |
| `GET` | `/api/interesses/meus` | Somente Usuario | RF09, UC07 |
| `DELETE` | `/api/interesses/{id}` | Candidato do interesse | UC07 FA01 |
| `GET` | `/api/interesses/recebidos` | Autenticado | RF09, UC08 |
| `PATCH` | `/api/interesses/{id}/status` | Protetor do animal | RF10, UC08 |

O depoimento (RF11, UC09) é opcional e não faz parte deste contrato. Se entrar no escopo, os endpoints dele são acrescentados aqui.

---

## 6. Autenticação e cadastro

### POST /api/auth/login

Autentica um Usuario (CPF) ou um Abrigo (CNPJ) e devolve o token.
**Acesso:** Público · **Origem:** RF03, UC03

**Entrada**

```json
{
  "documento": "12345678901",
  "senha": "minhaSenha123"
}
```

| Campo | Regra |
| --- | --- |
| `documento` | Obrigatório. Somente números. 11 dígitos = CPF (Usuario); 14 dígitos = CNPJ (Abrigo) |
| `senha` | Obrigatório |

**Saída — `200 OK`**

```json
{
  "token": "eyJhbGciOiJIUzI1NiJ9...",
  "tipoConta": "USUARIO",
  "id": "3f6c1a2e-8b4d-4c7a-9e1f-2a5b7c9d0e11",
  "nome": "Maria Silva"
}
```

`tipoConta` é `USUARIO` ou `ABRIGO`. O front usa esse campo para decidir quais menus e botões exibir.

**Erros**

| Código | Quando | Origem |
| --- | --- | --- |
| `400` | Documento ou senha não informados | UC03 FA03 |
| `400` | Documento sem 11 nem 14 dígitos | UC03 FA05 |
| `401` | Documento não cadastrado **ou** senha incorreta. A mensagem é a mesma nos dois casos: "CPF/CNPJ ou senha inválidos" | UC03 FA01, FA02 |
| `500` | Falha ao autenticar ou gerar o token | UC03 FA04 |

> A mesma mensagem para "documento não cadastrado" e "senha incorreta" impede que alguém descubra quais CPFs e CNPJs têm conta testando um por um. Ver [Pontos em aberto](#10-pontos-em-aberto).

---

### POST /api/usuarios

Cria a conta de uma pessoa física e já a autentica.
**Acesso:** Público · **Origem:** RF01, UC01

**Entrada**

```json
{
  "nome": "Maria Silva",
  "cpf": "12345678901",
  "telefone": "69999998888",
  "email": "maria@email.com",
  "senha": "minhaSenha123",
  "confirmacaoSenha": "minhaSenha123",
  "endereco": {
    "cep": "76801000",
    "numero": "123",
    "logradouro": "Avenida Sete de Setembro",
    "bairro": "Centro",
    "cidade": "Porto Velho",
    "estado": "RO"
  }
}
```

| Campo | Regra |
| --- | --- |
| `nome` | Obrigatório |
| `cpf` | Obrigatório. 11 dígitos. Único no sistema |
| `telefone` | Obrigatório. DDD + número, somente dígitos |
| `email` | Obrigatório. Formato de e-mail. Único no sistema (entre Usuarios **e** Abrigos) |
| `senha` | Obrigatório |
| `confirmacaoSenha` | Obrigatório. Deve ser igual a `senha`. Não é gravada |
| `endereco.cep` | Obrigatório. 8 dígitos |
| `endereco.numero` | Obrigatório. Aceita "s/n" e complemento |
| `endereco.logradouro`, `endereco.bairro` | Podem vir vazios (há CEPs sem logradouro) |
| `endereco.cidade` | Obrigatório |
| `endereco.estado` | Obrigatório. UF com 2 letras maiúsculas |

O usuário digita só **CEP e número** (RF01). O front consulta o ViaCEP com o CEP digitado, preenche logradouro, bairro, cidade e estado, e envia o endereço completo. Ver [Pontos em aberto](#10-pontos-em-aberto).

**Saída — `201 Created`**

Mesmo formato da resposta do login, porque o cadastro já autentica a conta (UC01, passo 10):

```json
{
  "token": "eyJhbGciOiJIUzI1NiJ9...",
  "tipoConta": "USUARIO",
  "id": "3f6c1a2e-8b4d-4c7a-9e1f-2a5b7c9d0e11",
  "nome": "Maria Silva"
}
```

**Erros**

| Código | Quando | Origem |
| --- | --- | --- |
| `400` | Campos obrigatórios não preenchidos (com a lista em `campos`) | UC01 FA01 |
| `400` | CPF, CEP, telefone, e-mail ou UF em formato inválido | RF01 |
| `400` | `senha` e `confirmacaoSenha` diferentes | UC01 FA03 |
| `409` | CPF já cadastrado | UC01 FA02 |
| `409` | E-mail já usado por outra conta | UC01, regras de negócio |

---

### POST /api/abrigos

Cria a conta de uma ONG ou abrigo e já a autentica.
**Acesso:** Público · **Origem:** RF02, UC02

**Entrada**

```json
{
  "nome": "Abrigo Patas Unidas",
  "razaoSocial": "Associação Protetora Patas Unidas",
  "cnpj": "12345678000199",
  "telefone": "6932221111",
  "email": "contato@patasunidas.org",
  "senha": "senhaDoAbrigo123",
  "confirmacaoSenha": "senhaDoAbrigo123",
  "endereco": {
    "cep": "76801000",
    "numero": "450",
    "logradouro": "Rua Dom Pedro II",
    "bairro": "Centro",
    "cidade": "Porto Velho",
    "estado": "RO"
  }
}
```

As regras dos campos são as mesmas do cadastro de Usuario, com estas diferenças:

| Campo | Regra |
| --- | --- |
| `nome` | Obrigatório. Nome institucional (o que aparece na listagem) |
| `razaoSocial` | Obrigatório |
| `cnpj` | Obrigatório. 14 dígitos. Único no sistema |

A conta do Abrigo é **única e compartilhada** entre os funcionários da instituição.

**Saída — `201 Created`**

Mesmo formato do login, com `"tipoConta": "ABRIGO"`.

**Erros**

| Código | Quando | Origem |
| --- | --- | --- |
| `400` | Campos obrigatórios não preenchidos | UC02 FA01 |
| `400` | CNPJ, CEP, telefone, e-mail ou UF em formato inválido | RF02 |
| `400` | `senha` e `confirmacaoSenha` diferentes | UC02 FA03 |
| `409` | CNPJ ou e-mail já cadastrado | UC02 FA02 |

---

## 7. Perfil da conta

Os endpoints de perfil usam `me` no lugar do id: a API identifica a conta pelo token. Assim ninguém consegue ver ou editar a conta de outra pessoa trocando um id na URL.

### GET /api/usuarios/me

Devolve os dados da conta do Usuario logado.
**Acesso:** Somente Usuario · **Origem:** RF17, UC10

**Saída — `200 OK`**

```json
{
  "id": "3f6c1a2e-8b4d-4c7a-9e1f-2a5b7c9d0e11",
  "nome": "Maria Silva",
  "cpf": "12345678901",
  "telefone": "69999998888",
  "email": "maria@email.com",
  "endereco": {
    "cep": "76801000",
    "numero": "123",
    "logradouro": "Avenida Sete de Setembro",
    "bairro": "Centro",
    "cidade": "Porto Velho",
    "estado": "RO"
  }
}
```

O `cpf` vem na resposta para ser exibido na tela, mas não pode ser editado.

**Erros:** `401` sem token ou token inválido · `403` conta do tipo Abrigo.

---

### PUT /api/usuarios/me

Atualiza os dados editáveis da conta do Usuario logado.
**Acesso:** Somente Usuario · **Origem:** RF17, UC10

**Entrada** (todos os campos editáveis, mesmo os que não mudaram)

```json
{
  "nome": "Maria Silva Souza",
  "telefone": "69999997777",
  "email": "maria.souza@email.com",
  "endereco": {
    "cep": "69005000",
    "numero": "45",
    "logradouro": "Rua Barroso",
    "bairro": "Centro",
    "cidade": "Manaus",
    "estado": "AM"
  }
}
```

- O CPF **não faz parte** do corpo, porque não é editável (RF17).
- A senha é trocada em um endpoint próprio (`PATCH /api/usuarios/me/senha`).
- Se o estado mudar, a listagem e a demonstração de interesse passam a usar o estado novo (RF14, UC10 FA06). O aviso sobre isso é exibido pelo front antes de salvar.

**Saída — `200 OK`:** os dados atualizados, no mesmo formato do `GET /api/usuarios/me`.

**Erros**

| Código | Quando | Origem |
| --- | --- | --- |
| `400` | Campos obrigatórios vazios ou em formato inválido | UC10 FA01 |
| `401` | Sem token ou token inválido | — |
| `403` | Conta do tipo Abrigo | — |
| `409` | E-mail já usado por outra conta | UC10 FA02 |

---

### PATCH /api/usuarios/me/senha

Troca a senha do Usuario logado.
**Acesso:** Somente Usuario · **Origem:** RF17, UC10 FA03

**Entrada**

```json
{
  "senhaAtual": "minhaSenha123",
  "novaSenha": "novaSenha456",
  "confirmacaoNovaSenha": "novaSenha456"
}
```

**Saída — `204 No Content`**

**Erros**

| Código | Quando | Origem |
| --- | --- | --- |
| `400` | Algum campo não preenchido | UC10 FA01 |
| `400` | Senha atual incorreta | UC10 FA04 |
| `400` | `novaSenha` e `confirmacaoNovaSenha` diferentes | UC10 FA05 |
| `401` | Sem token ou token inválido | — |

> A senha atual incorreta responde `400`, e não `401`. O token continua válido, e um `401` faria o front entender que a sessão expirou e deslogar a pessoa.

---

### GET /api/abrigos/me · PUT /api/abrigos/me · PATCH /api/abrigos/me/senha

Iguais aos endpoints de Usuario acima, para a conta do Abrigo logado.
**Acesso:** Somente Abrigo · **Origem:** RF17, UC10

Diferenças:

- A resposta do `GET` traz `cnpj` e `razaoSocial` no lugar de `cpf`.
- O corpo do `PUT` traz `nome` (nome institucional), `razaoSocial`, `telefone`, `email` e `endereco`. O CNPJ não é editável.
- Uma conta do tipo Usuario recebe `403` nesses endpoints.

---

## 8. Animais

### Formato do animal (resposta completa)

Usado nas respostas de `GET /api/animais/{id}`, `POST /api/animais` e `PUT /api/animais/{id}`:

```json
{
  "id": "9b2e4f10-1c3d-4a5b-8e7f-6a5b4c3d2e1f",
  "nome": "Paçoca",
  "especie": "CAO",
  "raca": "SRD_CAO",
  "sexo": "FEMEA",
  "porte": "MEDIO",
  "peso": 12.5,
  "dataNascEstimada": "2024-03-01",
  "castrado": true,
  "energia": "MAIS_ANIMADO",
  "convivencia": {
    "crianca": "CONVIVE_BEM",
    "gato": "NAO_TESTADO",
    "cao": "CONVIVE_BEM"
  },
  "historia": "Resgatada na BR-364 em janeiro. Muito dócil e brincalhona.",
  "fotos": [
    "https://adota-aqui.s3.amazonaws.com/animais/9b2e4f10/1.jpg",
    "https://adota-aqui.s3.amazonaws.com/animais/9b2e4f10/2.jpg"
  ],
  "vacinas": [
    { "id": "5d1a...", "nome": "V10", "dose": 2, "dataAplicacao": "2026-05-10" },
    { "id": "7e3c...", "nome": "Antirrábica", "dose": 1, "dataAplicacao": "2026-06-02" }
  ],
  "statusAdocao": "DISPONIVEL",
  "protetor": {
    "nome": "Abrigo Patas Unidas",
    "cidade": "Porto Velho",
    "estado": "RO"
  },
  "ehMeu": false,
  "podeDemonstrarInteresse": true,
  "meuInteresse": null
}
```

| Campo | Descrição |
| --- | --- |
| `fotos` | Lista ordenada de URLs. **A primeira é a foto de capa** |
| `protetor` | Quem cadastrou o animal. O estado do animal é o estado do protetor (RF14). Telefone e e-mail do protetor **não** aparecem aqui; eles são liberados depois que o interesse é registrado (RF09) |
| `ehMeu` | `true` se quem está logado é o protetor deste animal. O front usa para mostrar "Editar" e "Remover" |
| `podeDemonstrarInteresse` | `true` só quando: a conta é Usuario, o animal está `DISPONIVEL`, o animal é do mesmo estado do Usuario, o Usuario não é o protetor e ainda não tem interesse ativo nele. O front mostra o botão "Demonstrar interesse" com base neste campo, sem repetir as regras |
| `meuInteresse` | Para Usuario logado com interesse neste animal: `{ "id": "...", "statusAndamento": "PENDENTE" }`. Nos demais casos, `null`. O front troca o botão por "Desistir da adoção" quando o interesse está `PENDENTE` ou `EM_CONTATO` (UC07, passo 6) |

---

### GET /api/racas

Lista as raças de uma espécie, para preencher o campo de raça nos formulários e nos filtros.
**Acesso:** Público · **Origem:** RF04, RF07, dicionário de domínios

**Parâmetro:** `especie` (obrigatório) — `CAO` ou `GATO`

Exemplo: `GET /api/racas?especie=GATO`

**Saída — `200 OK`**

```json
[
  { "valor": "SRD_GATO", "nome": "Sem raça definida" },
  { "valor": "SIAMES", "nome": "Siamês" },
  { "valor": "PERSA", "nome": "Persa" }
]
```

`valor` é o que se envia para a API; `nome` é o que se exibe na tela. A lista existe só no Back End (enum `Raca`), então o front não mantém uma cópia própria.

**Erros:** `400` espécie ausente ou inválida.

---

### GET /api/animais

Lista os animais disponíveis para adoção, com filtros.
**Acesso:** Público · **Origem:** RF07, RF14, UC06

**Regras**

- Só aparecem animais com status `DISPONIVEL`.
- **Usuario logado:** vê só os animais do **mesmo estado** que o seu (RF14). Esse filtro é automático e não pode ser removido.
- **Visitante e Abrigo:** veem animais de **todos os estados** (RF07, RF14).
- Sem paginação no MVP.

**Filtros** (todos opcionais, combináveis, passados na URL)

| Parâmetro | Valores |
| --- | --- |
| `especie` | `CAO`, `GATO` |
| `raca` | Valor de uma raça (ver `GET /api/racas`) |
| `porte` | `PEQUENO`, `MEDIO`, `GRANDE` |
| `sexo` | `FEMEA`, `MACHO` |
| `cidade` | Texto. Não diferencia maiúsculas de minúsculas |
| `convivenciaCrianca` | `CONVIVE_BEM`, `NAO_CONVIVE_BEM`, `NAO_TESTADO` |
| `convivenciaGato` | `CONVIVE_BEM`, `NAO_CONVIVE_BEM`, `NAO_TESTADO` |
| `convivenciaCao` | `CONVIVE_BEM`, `NAO_CONVIVE_BEM`, `NAO_TESTADO` |
| `energia` | `MAIS_ANIMADO`, `MAIS_CALMO` |

Exemplo: `GET /api/animais?especie=GATO&porte=PEQUENO&convivenciaCrianca=CONVIVE_BEM`

**Saída — `200 OK`**

```json
[
  {
    "id": "9b2e4f10-1c3d-4a5b-8e7f-6a5b4c3d2e1f",
    "nome": "Paçoca",
    "especie": "CAO",
    "raca": "SRD_CAO",
    "sexo": "FEMEA",
    "porte": "MEDIO",
    "fotoCapa": "https://adota-aqui.s3.amazonaws.com/animais/9b2e4f10/1.jpg",
    "protetor": {
      "nome": "Abrigo Patas Unidas",
      "cidade": "Porto Velho",
      "estado": "RO"
    }
  }
]
```

Nenhum animal encontrado: `200 OK` com `[]`. O front exibe "Nenhum animal disponível no seu estado no momento" (sem filtros, UC06 FA01) ou "Nenhum resultado encontrado com essas informações" (com filtros, UC06 FA02).

**Erros:** `400` valor de filtro inválido (ex.: `porte=ENORME`) · `401` token enviado, porém inválido ou expirado.

---

### GET /api/animais/{id}

Devolve o perfil completo de um animal.
**Acesso:** Público · **Origem:** UC06 (passos 5 e 6)

**Saída — `200 OK`:** o [formato completo do animal](#formato-do-animal-resposta-completa).

**Erros**

| Código | Quando |
| --- | --- |
| `404` | O animal não existe |
| `404` | O animal está `ADOTADO` e quem pede não é o protetor dele. Animal adotado só é visível para o próprio protetor |

---

### GET /api/animais/meus

Lista os animais cadastrados pela conta logada, com qualquer status.
**Acesso:** Autenticado · **Origem:** UC05 (passo 1)

**Saída — `200 OK`:** lista no mesmo formato de `GET /api/animais`, acrescido de `statusAdocao` em cada item.

**Erros:** `401` sem token ou token inválido.

---

### POST /api/animais

Cadastra um animal para adoção. O protetor é a conta logada (Usuario ou Abrigo).
**Acesso:** Autenticado · **Origem:** RF04, RF05, UC04

**Entrada**

```json
{
  "nome": "Paçoca",
  "especie": "CAO",
  "raca": "SRD_CAO",
  "sexo": "FEMEA",
  "porte": "MEDIO",
  "peso": 12.5,
  "dataNascEstimada": "2024-03-01",
  "castrado": true,
  "energia": "MAIS_ANIMADO",
  "convivencia": {
    "crianca": "CONVIVE_BEM",
    "gato": "NAO_TESTADO",
    "cao": "CONVIVE_BEM"
  },
  "historia": "Resgatada na BR-364 em janeiro. Muito dócil e brincalhona.",
  "fotos": [
    "https://adota-aqui.s3.amazonaws.com/animais/tmp/abc123.jpg"
  ],
  "vacinas": [
    { "nome": "V10", "dose": 2, "dataAplicacao": "2026-05-10" }
  ]
}
```

| Campo | Regra |
| --- | --- |
| `nome`, `especie`, `raca`, `sexo`, `porte`, `energia`, `historia` | Obrigatórios |
| `raca` | Precisa pertencer à `especie` informada |
| `peso` | Opcional. Em kg, maior que zero |
| `dataNascEstimada` | Obrigatória. Não pode ser futura. O RF04 fala em "idade": o formulário pode perguntar a idade aproximada e converter para esta data |
| `castrado` | Obrigatório (`true` ou `false`) |
| `convivencia.crianca`, `.gato`, `.cao` | Obrigatórios. Se o protetor não sabe, envia `NAO_TESTADO` |
| `fotos` | Obrigatório, com **pelo menos 1** URL. A ordem da lista é a ordem de exibição, e a primeira é a capa (RF16). As URLs vêm do `POST /api/fotos` |
| `vacinas` | Opcional. Lista vazia ou omitida = nenhuma vacina registrada. Em cada item: `nome` obrigatório; `dose` inteiro ≥ 1; `dataAplicacao` não pode ser futura |

Não se envia `statusAdocao` nem o protetor: todo animal nasce `DISPONIVEL` (UC04, passo 9), e o protetor é a conta do token.

**Saída — `201 Created`:** o [formato completo do animal](#formato-do-animal-resposta-completa).

**Erros**

| Código | Quando | Origem |
| --- | --- | --- |
| `400` | Campos obrigatórios não preenchidos | UC04 FA01 |
| `400` | Dados inválidos: raça de outra espécie, data futura, peso ≤ 0, nenhuma foto, enum inválido | UC04 FA02 |
| `401` | Sem token ou token inválido | UC04, pré-condição |
| `500` | Falha ao registrar | UC04 FA03 |

---

### PUT /api/animais/{id}

Atualiza um animal. Como é `PUT`, o corpo leva **todos** os campos, inclusive os que não mudaram.
**Acesso:** Protetor do animal · **Origem:** RF06, UC05

**Entrada:** a mesma do `POST /api/animais`, acrescida de `statusAdocao`:

```json
{
  "nome": "Paçoca",
  "especie": "CAO",
  "...": "demais campos iguais ao cadastro",
  "statusAdocao": "DISPONIVEL"
}
```

- As listas `fotos` e `vacinas` **substituem** as atuais. Vacina que não estiver na lista enviada é removida.

**Regras de status (RF06, UC05 FA04, máquina de estados do Animal)**

| Status atual | O que o `PUT` pode fazer |
| --- | --- |
| `DISPONIVEL` | Alterar qualquer campo. O status continua `DISPONIVEL`: a passagem para `ADOTADO` acontece **só** pela aprovação de um interesse (RF10) |
| `ADOTADO` | Enviar `statusAdocao: "ADOTADO"` sem mudar mais nada, **ou** enviar `statusAdocao: "DISPONIVEL"` (devolução), podendo alterar os demais campos na mesma requisição |

Na devolução (`ADOTADO` → `DISPONIVEL`), o interesse que resultou na adoção continua `APROVADO` no histórico (RF06). A confirmação "isso torna o animal disponível novamente" é exibida pelo front antes de enviar.

**Saída — `200 OK`:** o [formato completo do animal](#formato-do-animal-resposta-completa).

**Erros**

| Código | Quando | Origem |
| --- | --- | --- |
| `400` | Campos obrigatórios vazios ou dados inválidos | UC05 FA01, FA02 |
| `401` | Sem token ou token inválido | — |
| `403` | Quem pede não é o protetor do animal | UC05, regras de negócio |
| `404` | O animal não existe | — |
| `409` | Animal `ADOTADO` com outros campos alterados sem voltar para `DISPONIVEL` | RF06 |
| `409` | Tentativa de mudar de `DISPONIVEL` para `ADOTADO` pelo `PUT` | RF10 |

---

### DELETE /api/animais/{id}

Remove um animal definitivamente, junto com suas fotos, vacinas e interesses.
**Acesso:** Protetor do animal · **Origem:** RF06, UC05 FA03

Sem corpo. A confirmação ("os interesses recebidos também serão excluídos") é exibida pelo front antes de enviar.

**Saída — `204 No Content`**

**Erros**

| Código | Quando |
| --- | --- |
| `401` | Sem token ou token inválido |
| `403` | Quem pede não é o protetor do animal |
| `404` | O animal não existe |

---

### POST /api/fotos

Envia uma imagem para o armazenamento em nuvem e devolve a URL dela.
**Acesso:** Autenticado · **Origem:** RF16

É o único endpoint que **não** recebe JSON: a imagem vai como `multipart/form-data`, no campo `arquivo`, uma imagem por requisição.

**Fluxo no formulário de animal:** para cada imagem escolhida, o front chama este endpoint, guarda a URL devolvida e, no fim, envia a lista de URLs no campo `fotos` do `POST` ou do `PUT` de animal.

**Saída — `201 Created`**

```json
{
  "url": "https://adota-aqui.s3.amazonaws.com/animais/tmp/abc123.jpg"
}
```

**Erros**

| Código | Quando |
| --- | --- |
| `400` | Nenhum arquivo enviado, arquivo que não é imagem (aceitos: JPG, PNG, WEBP) ou maior que o limite |
| `401` | Sem token ou token inválido |
| `500` | Falha ao enviar para o armazenamento |

> Se o upload para o S3 não for implementado a tempo, este endpoint deixa de existir e o formulário passa a aceitar URLs de imagens já hospedadas, enviadas direto no campo `fotos`. O formato do animal não muda.

---

## 9. Interesses

### Formato do interesse

```json
{
  "id": "c4d5e6f7-a8b9-4c0d-9e1f-2a3b4c5d6e7f",
  "dataHora": "2026-09-26T14:30:00",
  "statusAndamento": "PENDENTE",
  "motivoDescontinuacao": null,
  "animal": {
    "id": "9b2e4f10-1c3d-4a5b-8e7f-6a5b4c3d2e1f",
    "nome": "Paçoca",
    "fotoCapa": "https://adota-aqui.s3.amazonaws.com/animais/9b2e4f10/1.jpg"
  },
  "triagem": {
    "moradia": "CASA_COM_QUINTAL",
    "criancas": "SIM",
    "tempoSozinho": "ATE_4_HORAS",
    "outrosAnimais": "SIM_GATOS",
    "programacaoViagem": "DEIXO_NOS_CUIDADOS_DE_ALGUEM_DE_CONFIANCA",
    "momentoContato": "NOITE"
  },
  "contatoProtetor": {
    "nome": "Abrigo Patas Unidas",
    "telefone": "6932221111",
    "email": "contato@patasunidas.org"
  }
}
```

- Nas respostas para o **candidato**, o interesse traz `contatoProtetor` (RF09).
- Nas respostas para o **protetor**, o interesse traz `candidato` no lugar de `contatoProtetor`, com `nome`, `telefone` e `email` do Usuario interessado.
- Assim, a partir do registro do interesse, cada lado tem o contato do outro, e qualquer um pode iniciar a conversa (UC07, passo 8).

**Estados do interesse** (máquina de estados do Interesse)

```
PENDENTE ──► EM_CONTATO ──► APROVADO
    │             │
    │             └────────► DESCONTINUADO (com motivo)
    ├──────────────────────► APROVADO
    └──────────────────────► DESCONTINUADO (com motivo)
```

`APROVADO` e `DESCONTINUADO` são finais. Quando o candidato desiste, o interesse é **excluído**, por isso não existe um estado para desistência (UC07 FA01).

---

### POST /api/animais/{id}/interesses

Registra o interesse do Usuario logado em um animal.
**Acesso:** Somente Usuario · **Origem:** RF08, RF09, RF13, RF14, RF15, UC07

**Entrada**

```json
{
  "aceiteTermo": true,
  "triagem": {
    "moradia": "CASA_COM_QUINTAL",
    "criancas": "SIM",
    "tempoSozinho": "ATE_4_HORAS",
    "outrosAnimais": "SIM_GATOS",
    "programacaoViagem": "PREFIRO_RESPONDER_DIRETAMENTE_AO_PROTETOR",
    "momentoContato": "NOITE"
  }
}
```

| Campo | Regra |
| --- | --- |
| `aceiteTermo` | Obrigatório e precisa ser `true`: é o checkbox do aviso de guarda responsável (RF13) |
| `triagem.moradia` | Obrigatório. Aceita `PREFIRO_RESPONDER_DIRETAMENTE_AO_PROTETOR` |
| `triagem.criancas` | Obrigatório. Aceita `PREFIRO_RESPONDER_DIRETAMENTE_AO_PROTETOR` |
| `triagem.tempoSozinho` | Obrigatório. Aceita `PREFIRO_RESPONDER_DIRETAMENTE_AO_PROTETOR` |
| `triagem.outrosAnimais` | Obrigatório. Aceita `PREFIRO_RESPONDER_DIRETAMENTE_AO_PROTETOR` |
| `triagem.programacaoViagem` | Obrigatório. Aceita `PREFIRO_RESPONDER_DIRETAMENTE_AO_PROTETOR` |
| `triagem.momentoContato` | Obrigatório. **Não** tem a opção "prefiro responder ao protetor" (RF15) |

Os valores de cada campo da triagem estão no dicionário de domínios.

**Saída — `201 Created`:** o [formato do interesse](#formato-do-interesse), com `statusAndamento: "PENDENTE"` e `contatoProtetor` preenchido.

**Erros**

| Código | Quando | Origem |
| --- | --- | --- |
| `400` | `aceiteTermo` ausente ou `false` | RF13, UC07 FA02 |
| `400` | Algum campo da triagem vazio ou com valor inválido | RF15 |
| `401` | Sem token ou token inválido | UC07, pré-condição |
| `403` | Conta do tipo Abrigo | RF14 |
| `403` | Animal de outro estado | RF14 |
| `403` | O Usuario é o protetor deste animal | Regras de integridade |
| `404` | O animal não existe | — |
| `409` | O animal não está `DISPONIVEL` | UC07, pré-condição |
| `409` | O Usuario já tem um interesse `PENDENTE` ou `EM_CONTATO` neste animal | Regras de integridade |

---

### GET /api/interesses/meus

Lista os interesses registrados pelo Usuario logado, com qualquer status.
**Acesso:** Somente Usuario · **Origem:** RF09, UC07

**Saída — `200 OK`:** lista no [formato do interesse](#formato-do-interesse), com `contatoProtetor` em cada item. Um interesse `DESCONTINUADO` traz o `motivoDescontinuacao`, para o candidato saber o porquê.

**Erros:** `401` sem token ou token inválido · `403` conta do tipo Abrigo.

---

### DELETE /api/interesses/{id}

Desistência: o candidato exclui o próprio interesse.
**Acesso:** Candidato do interesse · **Origem:** UC07 FA01

Sem corpo. Ver [Pontos em aberto](#10-pontos-em-aberto) sobre o motivo da desistência.

**Saída — `204 No Content`**

**Erros**

| Código | Quando |
| --- | --- |
| `401` | Sem token ou token inválido |
| `403` | O interesse é de outro Usuario |
| `404` | O interesse não existe |
| `409` | O interesse já está `APROVADO` ou `DESCONTINUADO`. Só se desiste de interesse `PENDENTE` ou `EM_CONTATO`, para preservar o histórico da adoção (RF06) |

---

### GET /api/interesses/recebidos

Painel do protetor: lista os interesses recebidos em todos os animais da conta logada.
**Acesso:** Autenticado · **Origem:** RF09, UC08

**Filtros** (opcionais)

| Parâmetro | Uso |
| --- | --- |
| `animalId` | Só os interesses de um animal |
| `status` | `PENDENTE`, `EM_CONTATO`, `APROVADO` ou `DESCONTINUADO` |

Exemplo: `GET /api/interesses/recebidos?status=PENDENTE`

**Saída — `200 OK`:** lista no [formato do interesse](#formato-do-interesse), com `candidato` (nome, telefone e e-mail do interessado) no lugar de `contatoProtetor`. Ordenada do mais recente para o mais antigo.

**Erros:** `401` sem token ou token inválido.

---

### PATCH /api/interesses/{id}/status

O protetor muda o status de um interesse recebido.
**Acesso:** Protetor do animal · **Origem:** RF10, UC08

**Entrada**

```json
{
  "statusAndamento": "DESCONTINUADO",
  "motivoDescontinuacao": "O candidato não pode receber visitas no momento."
}
```

| Campo | Regra |
| --- | --- |
| `statusAndamento` | Obrigatório: `EM_CONTATO`, `APROVADO` ou `DESCONTINUADO` |
| `motivoDescontinuacao` | Obrigatório quando o status é `DESCONTINUADO` (RF10). Ignorado nos demais |

**Efeitos da aprovação (RF10, UC08 FA01)** — tudo na mesma operação:

1. o interesse passa para `APROVADO`;
2. o animal passa para `ADOTADO`;
3. os demais interesses `PENDENTE` e `EM_CONTATO` do mesmo animal passam para `DESCONTINUADO`, com o motivo padrão "Outro candidato foi aprovado para este animal.".

**Saída — `200 OK`:** o interesse atualizado, no [formato do interesse](#formato-do-interesse) com `candidato`.

**Erros**

| Código | Quando | Origem |
| --- | --- | --- |
| `400` | `statusAndamento` ausente ou inválido | — |
| `400` | `DESCONTINUADO` sem `motivoDescontinuacao` | RF10 |
| `401` | Sem token ou token inválido | — |
| `403` | Quem pede não é o protetor do animal | UC08 |
| `404` | O interesse não existe | — |
| `409` | Transição não permitida pela máquina de estados (ex.: de `APROVADO` para qualquer outro, ou voltar para `PENDENTE`) | Máquina de estados do Interesse |
| `409` | Aprovar um interesse de um animal que já está `ADOTADO` | RF10 |

---

## 10. Pontos em aberto

Decisões que este contrato assumiu e que o time ainda precisa confirmar. Ao decidir, atualize o endpoint correspondente e remova o item daqui.

| # | Ponto | O que o contrato assumiu | Onde afeta |
| --- | --- | --- | --- |
| 1 | Quem consulta o ViaCEP | O **front** consulta o ViaCEP e envia o endereço completo. Alternativa: o back recebe só CEP e número e consulta o ViaCEP (mais seguro, porém o back passa a depender de um serviço externo, inclusive nos testes) | `POST /api/usuarios`, `POST /api/abrigos`, `PUT .../me` |
| 2 | Mensagem de login | Mesma mensagem para "documento não cadastrado" e "senha incorreta", por segurança. O UC03 prevê mensagens diferentes (FA01 e FA02): ajustar o UC03 ou o contrato | `POST /api/auth/login` |
| 3 | Notificação ao protetor (RF09) | No MVP, a "notificação" é o próprio painel: interesses novos aparecem como `PENDENTE` em `GET /api/interesses/recebidos?status=PENDENTE`. Não há envio de e-mail | `GET /api/interesses/recebidos` |
| 4 | Motivo da desistência (UC07 FA01) | O UC07 prevê um motivo opcional e aviso ao protetor, mas o interesse é excluído e não há onde guardar o motivo. O contrato não envia motivo. Opções: retirar o motivo do UC07, ou criar um registro de desistência | `DELETE /api/interesses/{id}` |
| 5 | Regras de senha | Nenhum tamanho mínimo ou composição foi definido nos requisitos | Cadastros e troca de senha |
| 6 | Limite das imagens | Tamanho máximo por arquivo e quantidade máxima de fotos por animal ainda não definidos | `POST /api/fotos`, `POST /api/animais` |
| 7 | Quantidade de interesses por animal (RF12, opcional) | Não incluída. Se aprovada, entra como campo em `GET /api/animais/meus`, visível só para o protetor | `GET /api/animais/meus` |
| 8 | Registro do aceite (RF13) | O aceite é validado, mas não é gravado (não há campo no modelo de dados). Guardar a data do aceite ajudaria a comprovar a concordância do adotante | `POST /api/animais/{id}/interesses` |
