# Deploy do Adota Aqui

Como o sistema vai pro ar e como subir tudo de novo, do zero, numa conta nova. A ideia é que nada dependa de uma configuração que só existe na conta ou na cabeça de alguém: o que dá pra ficar em código está no repositório (`render.yaml`, `netlify.toml` e `backend/Dockerfile`), e o resto está listado aqui.

## Onde cada parte roda

| Parte             | Serviço            | Em código, no repositório                               | Só no painel do serviço                                       |
| ----------------- | ------------------ | ------------------------------------------------------- | ------------------------------------------------------------- |
| Front-end         | Netlify            | `netlify.toml`                                          | Nada                                                          |
| Back-end          | Render, com Docker | `render.yaml` e `backend/Dockerfile`                    | As variáveis secretas                                         |
| Banco de dados    | Neon (PostgreSQL)  | As tabelas, que o Hibernate cria a partir das entidades | O projeto e a senha                                           |
| Fotos dos animais | Amazon S3          | Nada                                                    | O bucket, a política de leitura pública e o usuário que grava |

Endereços: o site em https://adotaaqui.netlify.app e a API em https://adota-aqui.onrender.com.

## Quando o deploy acontece

- O Render e o Netlify publicam a branch `main`, que é a de produção. O trabalho do dia a dia entra na `dev`, e vai pro ar quando um PR da `dev` pra `main` é aprovado (no fim de cada sprint, ou antes, se precisar publicar uma correção).
- **Render:** só refaz o deploy quando muda alguma coisa dentro de `backend/`, e só depois que o CI passa. O primeiro build leva uns 5 minutos, porque o Maven baixa todas as bibliotecas.
- **Netlify:** só refaz o site quando muda alguma coisa dentro de `frontend/`. Cada PR ganha uma prévia (deploy preview) com endereço próprio, que já conversa com a API de verdade.
- **Se o back não subir** (erro no build ou variável faltando), o Render mantém a versão anterior no ar. O site não cai.
- **Voltar uma versão:** no Render, aba Events, "Rollback" no deploy anterior. No Netlify, aba Deploys, abre o deploy anterior e "Publish deploy".

## Variáveis de ambiente

### Back (Render)

| Variável                                      | Obrigatória | O que é                                                                                                                                                    |
| --------------------------------------------- | ----------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `DB_URL`                                      | Sim         | Endereço do banco no formato JDBC: `jdbc:postgresql://<host>/<banco>?sslmode=require`                                                                      |
| `DB_USERNAME` e `DB_PASSWORD`                 | Sim         | Usuário e senha do Neon                                                                                                                                    |
| `JWT_SECRET`                                  | Sim         | Chave que assina o token. Pelo menos 32 caracteres aleatórios. O Blueprint gera sozinho                                                                    |
| `CORS_ORIGENS`                                | Sim         | Sites que podem chamar a API, separados por vírgula: `https://adotaaqui.netlify.app,https://deploy-preview-*--adotaaqui.netlify.app,http://localhost:5173` |
| `FOTOS_ARMAZENAMENTO`                         | Sim         | `s3`                                                                                                                                                       |
| `S3_BUCKET`                                   | Sim         | Nome do bucket                                                                                                                                             |
| `AWS_REGION`                                  | Sim         | Região do bucket: `us-east-2`                                                                                                                              |
| `FOTOS_URL_BASE`                              | Sim         | Endereço público do bucket: `https://<bucket>.s3.us-east-2.amazonaws.com`                                                                                  |
| `AWS_ACCESS_KEY_ID` e `AWS_SECRET_ACCESS_KEY` | Sim         | Chave do usuário da AWS que grava as fotos. O SDK da AWS lê sozinho                                                                                        |
| `JWT_EXPIRATION_MS`                           | Não         | Validade do token. Padrão: 24 horas (`86400000`)                                                                                                           |
| `S3_ENDPOINT`                                 | Não         | Só pra usar outro serviço compatível com S3 no lugar da AWS                                                                                                |
| `PORT`                                        | Não         | O Render preenche sozinho                                                                                                                                  |

Sem `JWT_SECRET`, `FOTOS_ARMAZENAMENTO=s3` ou `CORS_ORIGENS`, o back **não sobe** quando está ligado num banco de produção, e o log diz qual variável falta (`config/ConferenciaDoDeploy`). Isso evita, por exemplo, subir com a chave de desenvolvimento que está no repositório, com a qual qualquer pessoa conseguiria criar um token válido.

Segredo (senhas, chaves da AWS e o `JWT_SECRET`) fica **só** no painel do Render: nunca no código, no grupo ou em print. Se vazar, gere outro no serviço de origem e troque no Render. Trocar o `JWT_SECRET` desloga todo mundo, porque os tokens antigos deixam de valer.

### Front (Netlify)

Não tem nada pra configurar no painel. O `netlify.toml` define a pasta (`frontend`), o build (`npm run build`), a pasta publicada (`dist`), a versão do Node (20, a mesma do CI) e a `VITE_API_URL`. A `VITE_API_URL` entra no código na hora do build: se o endereço da API mudar, troque no `netlify.toml` e faça um deploy novo.

## Subir do zero

A ordem importa: o banco e o S3 primeiro, porque o back precisa dos dois pra subir, e o site por último, porque ele precisa do endereço da API.

### 1. Banco (Neon)

1. Crie um projeto no Neon, numa região da AWS nos Estados Unidos (perto do Render e do S3).
2. Em "Connection details", copie a string de conexão. Ela vem assim: `postgresql://<usuario>:<senha>@<host>/<banco>?sslmode=require`.
3. Separe as partes: `DB_URL` é `jdbc:postgresql://<host>/<banco>?sslmode=require`, e o usuário e a senha vão em `DB_USERNAME` e `DB_PASSWORD`.
4. Não precisa criar tabela. O Hibernate cria todas no primeiro deploy, com os índices e as regras (`CHECK`).

### 2. Fotos (Amazon S3)

1. Crie um bucket na região `us-east-2`. Em "Block Public Access", desmarque só as duas opções de **políticas** (bucket policies). As de ACL continuam marcadas.
2. Em Permissions > Bucket policy, libere a leitura das fotos (troque `NOME-DO-BUCKET`):

   ```json
   {
     "Version": "2012-10-17",
     "Statement": [
       {
         "Sid": "LeituraPublicaDasFotos",
         "Effect": "Allow",
         "Principal": "*",
         "Action": "s3:GetObject",
         "Resource": "arn:aws:s3:::NOME-DO-BUCKET/*"
       }
     ]
   }
   ```

3. No IAM, crie um usuário só pra API, com uma política que deixa **apenas** gravar fotos na pasta `animais/` do bucket:

   ```json
   {
     "Version": "2012-10-17",
     "Statement": [
       {
         "Effect": "Allow",
         "Action": "s3:PutObject",
         "Resource": "arn:aws:s3:::NOME-DO-BUCKET/animais/*"
       }
     ]
   }
   ```

4. Crie uma access key desse usuário e cole direto no Render (passo 3). A chave secreta só aparece uma vez.

### 3. Back (Render)

**Pelo Blueprint (mais rápido):** New > Blueprint, escolha este repositório. O Render lê o `render.yaml`, cria o serviço e pede os valores secretos. O `JWT_SECRET` ele gera sozinho.

**Na mão (se preferir):** New > Web Service, escolha o repositório e preencha:

| Campo                          | Valor                        |
| ------------------------------ | ---------------------------- |
| Language                       | Docker                       |
| Branch                         | `main`                       |
| Dockerfile Path                | `./backend/Dockerfile`       |
| Docker Build Context Directory | `./backend`                  |
| Build Filters, Included Paths  | `backend/**`                 |
| Instance Type                  | Free                         |
| Environment                    | As variáveis da tabela acima |
| Auto-Deploy                    | After CI Checks Pass         |

Quando terminar, abra `https://<seu-servico>.onrender.com/api/racas?especie=CAO`. Tem que aparecer a lista de raças de cão.

### 4. Site (Netlify)

1. Add new project > Import an existing project, escolha este repositório.
2. Não precisa preencher nada na tela de build: o `netlify.toml` cuida disso.
3. Em Project configuration > Build & deploy > Branches, a branch de produção é a `main`.
4. Se a API ficou num endereço diferente de `https://adota-aqui.onrender.com`, troque a `VITE_API_URL` no `netlify.toml`. Se o site ficou num endereço diferente de `https://adotaaqui.netlify.app`, troque o `CORS_ORIGENS` no Render.

### 5. Conferir

- [ ] `/api/racas?especie=CAO` responde a lista (o primeiro acesso depois de um tempo parado pode levar 1 minuto)
- [ ] O site abre e a vitrine carrega, sem erro de CORS no console do navegador (F12)
- [ ] Recarregar a página em `/animais` não dá 404
- [ ] Dá pra criar uma conta de pessoa física e uma de abrigo
- [ ] Dá pra cadastrar um animal com foto, e a foto abre (o endereço dela é do S3)
- [ ] Com a outra conta, dá pra demonstrar interesse, e o protetor consegue aprovar no painel
- [ ] Remova o animal e as contas de teste no fim

## Ensaio do deploy do zero

Pra ter certeza de que este documento basta, alguém que **não** fez o deploy original segue os passos 1, 3, 4 e 5 numa conta própria do Render, do Netlify e do Neon (as gratuitas servem). As fotos podem usar o mesmo bucket e a mesma chave do deploy de verdade, passadas direto pra pessoa, nunca pelo grupo.

Não faça o ensaio na mesma conta do Render do deploy de verdade: lá já existe um serviço chamado `adota-aqui`, e o Blueprint pode tentar assumir o serviço existente.

O que faltar ou estiver confuso, corrija aqui no mesmo dia. No fim, apague os serviços do ensaio.

| Data | Quem fez | Deu certo? | O que precisou corrigir |
| ---- | -------- | ---------- | ----------------------- |
|      |          |            |                         |

## Conferir o banco de produção

O Hibernate (`ddl-auto=update`) cria tabela e coluna nova sozinho, mas não mexe no que já existe: não muda o tamanho de uma coluna, não cria `CHECK` em tabela velha e não acrescenta valor novo na lista de um enum. Como o Neon vem sendo atualizado assim desde o primeiro deploy, no fim de setembro, ele pode ter ficado diferente do banco que as entidades criam hoje. Um enum desatualizado, por exemplo, faz o banco recusar um interesse com uma resposta nova da triagem, e o erro só aparece em produção.

A consulta `docs/banco/conferencia.sql` descreve o banco (colunas, regras e índices) de um jeito que dá pra comparar. Ela só lê, não muda nada.

1. **Banco local novo, criado pelas entidades de hoje.** Crie um banco vazio só pra isso, assim o seu `adota_aqui` fica como está:

   ```bash
   # no Git Bash, com o PostgreSQL instalado (o psql fica em "C:/Program Files/PostgreSQL/16/bin")
   createdb -U postgres adota_aqui_conferencia
   cd backend
   DB_URL=jdbc:postgresql://localhost:5432/adota_aqui_conferencia mvn spring-boot:run
   ```

   Quando aparecer "Started AdotaAquiApplication", as tabelas já foram criadas. Pare o back (Ctrl+C).

2. **Rode a consulta no banco local:** `psql -U postgres -d adota_aqui_conferencia -f ../docs/banco/conferencia.sql > local.txt` (ou cole a consulta no pgAdmin).
3. **Rode a mesma consulta no Neon**, no SQL Editor.
4. **Compare as 4 linhas de resumo do fim** (`colunas`, `indices`, `regras` e `tudo`). Se as impressões baterem, os dois bancos são iguais e acabou.
5. **Se uma parte não bater**, compare só as linhas dela e corrija o Neon pelo SQL Editor:

   | O que aparece diferente                                                        | Como corrigir no Neon                                                                                                                             |
   | ------------------------------------------------------------------------------ | ------------------------------------------------------------------------------------------------------------------------------------------------- |
   | Coluna com outro tamanho (ex.: `varchar(40)` no Neon e `varchar(60)` no local) | `alter table interesse alter column moradia type varchar(60);`                                                                                    |
   | Coluna que só existe no local                                                  | Faça um deploy do back: o Hibernate cria. Se continuar faltando, crie com `alter table ... add column ...`                                        |
   | Regra (`check`) que só existe no local                                         | Rode o `docs/banco/integridade.sql`. Se for de outra coluna, crie com `alter table ... add constraint ... check (...)`, copiando a regra do local |
   | Regra de enum com menos valores no Neon                                        | Apague a regra antiga e crie a do local: no Neon, `select conname from pg_constraint where conrelid = 'interesse'::regclass` mostra o nome dela   |
   | Índice que só existe no local                                                  | Rode o `docs/banco/integridade.sql`                                                                                                               |

6. Rode a consulta no Neon de novo até as impressões baterem, e anote abaixo.

| Data | Quem conferiu | Bateu? | O que precisou corrigir |
| ---- | ------------- | ------ | ----------------------- |
|      |               |        |                         |

## Antes da apresentação

A versão apresentada é a da `main`. Depois do último PR da `dev` pra `main`, a `main` fica congelada até a apresentação: só entra correção de algo que quebrou, e com o CI verde.

**Na véspera:**

- [ ] O último PR da `dev` pra `main` entrou, com o CI verde
- [ ] No Render, o último deploy é do último commit da `main` (aba Events) e está "Live"
- [ ] No Netlify, o deploy publicado é do último commit da `main` (aba Deploys, "Published")
- [ ] A conferência do banco (seção acima) bateu
- [ ] Na aba Actions do GitHub, o "Conferir produção" passou (rode pelo botão "Run workflow")
- [ ] O roteiro da seção "Conferir" foi feito numa janela anônima, com contas de teste
- [ ] As contas e os animais usados na demonstração estão cadastrados em produção, com foto
- [ ] Tem um plano B: um vídeo curto ou prints de cada fluxo, caso a internet ou o Render falhem na hora

**No dia, uns 10 minutos antes:**

- [ ] Rode o "Conferir produção" pelo botão. Ele acorda a API do Render, que dorme depois de 15 minutos parada
- [ ] Abra o site e a vitrine uma vez, pra conferir que está tudo respondendo
- [ ] Não mude variável de ambiente nem faça deploy

O "Conferir produção" (`.github/workflows/producao.yml`) também roda sozinho todo dia às 7h de Porto Velho. Ele confere se a API responde, se a vitrine carrega, se a API aceita o site (CORS), se as páginas internas do site abrem e se o site publicado chama a API certa. Se algo falhar, o GitHub manda e-mail, e o resumo da execução diz o que falhou e onde olhar.

## Problemas comuns

| O que aparece                                                                    | O que costuma ser                                                                                          |
| -------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------- |
| O site abre, mas a vitrine não carrega, com erro de CORS no console              | O endereço do site não está no `CORS_ORIGENS`                                                              |
| O deploy do back falha com "faltam variáveis de ambiente"                        | A mensagem diz quais. Confira a tabela de variáveis                                                        |
| A primeira página demora quase 1 minuto                                          | O Render gratuito dorme depois de 15 minutos sem uso. É normal: o site avisa que o servidor está acordando |
| A foto do animal não abre                                                        | O bucket está sem a política de leitura pública, ou o `FOTOS_URL_BASE` está errado                         |
| Todo mundo foi deslogado de uma vez                                              | O `JWT_SECRET` mudou                                                                                       |
| Um `CHECK` novo de uma entidade não chegou no banco                              | O Hibernate só cria `CHECK` em tabela nova. Rode o SQL em `docs/banco/integridade.sql` no Neon             |
| Um cadastro funciona no local, mas o Neon recusa com "violates check constraint" | A regra do enum no Neon ficou com os valores antigos. Veja a seção "Conferir o banco de produção"          |
