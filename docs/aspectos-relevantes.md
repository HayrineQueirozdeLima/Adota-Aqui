# Aspectos relevantes

As decisões de design que a gente tomou, os desafios técnicos que apareceram no caminho e como cada um foi resolvido. A [arquitetura](arquitetura.md) explica como o sistema é organizado e as [funcionalidades](funcionalidades.md) mostram o que cada tela faz. Aqui fica o motivo.

## Decisões de design

### O sistema é uma ponte

O Adota Aqui mostra os animais, registra o interesse e entrega o contato das duas partes (ERS, seção 1.2). A conversa, a entrevista, a visita e a decisão final acontecem fora do sistema, por WhatsApp, telefone ou e-mail, e são responsabilidade de quem cadastrou o animal.

Por isso não tem chat, agenda de visita nem contrato de adoção dentro do site. O interesse já devolve o contato do protetor na hora, e o protetor vê o contato do candidato no painel, então qualquer um dos dois pode chamar primeiro (RF09). Isso manteve o MVP no tamanho do prazo do curso.

### Duas contas, em duas tabelas

Pessoa física (Usuario, com CPF) e abrigo (Abrigo, com CNPJ) são duas entidades e duas tabelas, cada uma com os campos dela: o abrigo tem razão social, a pessoa não. Não existe uma tabela "conta" com um campo de tipo.

- **O que ganhou:** cada tabela só tem as colunas que fazem sentido pra ela, sem campo vazio pra metade das linhas, e o tipo da conta já vem de onde ela está.
- **O que custou:** o animal aponta pra uma das duas (`usuario_id` ou `abrigo_id`), e um `CHECK` no banco garante que é sempre uma e só uma. O e-mail único entre pessoa e abrigo também não dá pra garantir com `unique`, porque são duas tabelas, então quem confere é o service.

Pessoa física tem uma conta só pras duas coisas: adotar e cadastrar um animal que resgatou (ERS, seção 4). No site, ela aparece como Protetor quando cadastra e como Candidato quando demonstra interesse.

### Login do Abrigo compartilhado

A conta do Abrigo é uma só por instituição, e quem trabalha lá entra com o mesmo CNPJ e a mesma senha (ERS, seção 4; `docs/api.md`, cadastro de Abrigo). A gente não criou funcionários, papéis dentro do abrigo nem convite por e-mail.

Assim o abrigo é uma conta como a da pessoa física, com as mesmas telas e as mesmas regras de permissão, e o MVP não precisou de cadastro de equipe nem de papéis diferentes pra cada funcionário. O custo é que o sistema não sabe qual funcionário aprovou um interesse: sabe só que foi o abrigo. E, como todos usam a mesma senha, trocar a senha (em Meu perfil) vale pra todo mundo de uma vez.

### Login por CPF ou CNPJ

No lugar do e-mail, a pessoa entra com o documento. O back conta os dígitos: 11 é CPF (Usuario) e 14 é CNPJ (Abrigo), então a tela de login é uma só, sem a pessoa precisar escolher o tipo de conta (UC03).

- CPF e CNPJ são validados com os dígitos verificadores, com a mesma conta no front e no back (`utils/validacoes.js` e `DocumentoUtils`).
- Documento que não existe e senha errada recebem a mesma mensagem, "Documento ou senha inválidos". Se a mensagem fosse diferente, dava pra descobrir quais documentos têm conta.
- O documento não vai dentro do token. O JWT é assinado, mas qualquer um consegue ler o que tem nele, e CPF é dado pessoal. O token leva só o id e o tipo da conta.

### Ids em UUID

Toda chave primária é um UUID (`3f6c1a2e-8b4d-...`), e não um número que sobe de 1 em 1.

- O id aparece no endereço (`/animais/{id}`). Com número em sequência, dava pra trocar 41 por 42 e ir passando por todos os animais e interesses, ou saber quantos cadastros o site tem.
- O custo é um id mais comprido no endereço e nos testes. Pra quem usa o site, não muda nada.

### Remoção em cascata

Remover um animal apaga junto as fotos, as vacinas e os interesses dele (UC05 FA03). No código, é o `cascade = CascadeType.ALL` com `orphanRemoval` nas listas do `Animal`, e o `DELETE` passa pelo Hibernate, que apaga os dependentes antes.

- **Por quê:** vacina, foto e interesse não fazem sentido sem o animal. Sem a cascata, ou o banco recusaria o `DELETE` (por causa das chaves estrangeiras), ou sobrariam linhas soltas apontando pra nada.
- **O que se perde:** o histórico de interesses daquele animal some junto. Por isso a tela pede confirmação ("Remover {nome} de vez?"). Pra um animal adotado, não precisa remover: como Adotado, ele já sai da vitrine e o histórico fica guardado.
- **O que não vai em cascata:** as contas. O site não apaga conta, e no próprio banco a chave estrangeira impede apagar uma conta que ainda tem animal.

O arquivo da foto continua no S3 depois da remoção (ver [O que ficou de fora](#o-que-ficou-de-fora)).

### Sessão sem estado, com JWT e BCrypt

A API não guarda sessão: cada pedido leva o token, e o back confere a assinatura toda vez. Assim o back pode reiniciar (o Render faz isso sempre que dorme) sem deslogar ninguém. O token vale 24 horas e a senha é guardada só como hash BCrypt (RNF02, RNF03).

Um token inválido ou vencido recebe 401 mesmo numa rota pública, como a vitrine. Se ele fosse tratado como visitante, a API devolveria os animais de todos os estados enquanto o site ainda mostra a pessoa como logada. Com o 401, o front encerra a sessão, e a vitrine continua aberta, agora como visitante de verdade.

### O estado do animal vem de quem cadastrou

O animal não tem endereço próprio: o estado e a cidade dele são os de quem cadastrou (RF14). A pessoa física logada vê só os animais do mesmo estado e só pode demonstrar interesse neles. Visitante e abrigo veem todos.

Assim o protetor não digita o endereço a cada animal, e não tem como o animal ficar com um estado diferente do protetor. A comparação é pela sigla do estado, sem distância nem mapa.

### Interesse com status e aprovação travada

O interesse nasce Pendente, pode passar por Em contato e termina Aprovado ou Descontinuado (RF10). Aprovado e Descontinuado são finais, nada volta pra Pendente, e descontinuar exige um motivo. O service recusa qualquer outra mudança com 409, e o diagrama está em [diagramas/diagramas-adota-aqui.md](diagramas/diagramas-adota-aqui.md).

Aprovar é a operação mais delicada do sistema, e acontece numa transação só: o interesse vira Aprovado, o animal vira Adotado e os outros interesses ativos dele viram Descontinuados, com o motivo "Outro candidato foi aprovado para este animal." Se um passo falha, nenhum é gravado.

Já a desistência do candidato apaga o interesse, em vez de criar um status "Desistiu". Ela só vale pra interesse em andamento, que ainda não teve decisão do protetor, então não tem resultado a guardar, e a pessoa pode demonstrar interesse de novo depois, se quiser. Aprovado e Descontinuado não podem ser apagados.

### Animal adotado fica travado

Com o animal Adotado, os dados ficam como estão: o formulário só deixa mudar o status (RF06). Pra editar, o protetor volta o status pra Disponível, o que é uma devolução (UC05 FA04), e aí os campos abrem na mesma tela. O interesse aprovado continua no histórico.

A adoção também só acontece pela aprovação de um interesse. Marcar Adotado direto no formulário é recusado, porque aí o animal ficaria adotado sem adotante.

### Fotos passam pela API

O navegador não manda a foto direto pro S3: manda pro `POST /api/fotos`, e o back grava. Assim a chave da AWS fica só no Render, e o back confere o arquivo antes de guardar. O banco guarda só as URLs (RF16), e o navegador carrega as imagens direto do S3, sem passar pela API.

Na máquina de vocês, as fotos ficam na memória, e ninguém precisa de conta na AWS pra desenvolver. Qual dos dois vale é uma variável (`FOTOS_ARMAZENAMENTO`), e os services não sabem a diferença, porque os dois implementam a mesma interface (`ArmazenamentoFotos`).

### Tabelas criadas pelo Hibernate

A estrutura inicial do back veio com o Flyway e um SQL de criação das tabelas (`V1__schema_inicial.sql`). No mesmo dia ele saiu, seguindo o que a documentação do projeto definiu e o jeito que o curso ensina JPA, e o Hibernate passou a criar as tabelas a partir das entidades (`ddl-auto=update`).

- **O que ganhou:** a entidade é o único lugar que diz como a tabela é. Mudar a entidade já muda a tabela, sem um SQL pra escrever junto e manter igual ao Java em cada PR.
- **O que custou:** o Hibernate só acrescenta. Ele não muda o tamanho nem o tipo de uma coluna que já existe, não cria `CHECK` em tabela que já existe e não atualiza a lista de valores de um enum. Isso virou dois desafios (ver abaixo) e dois arquivos: `banco/integridade.sql` e `banco/conferencia.sql`.

### Um formato de erro só

Todo erro da API sai igual: `status`, `erro`, `mensagem`, `campos` e `timestamp` (`docs/api.md`, seção 4). O service só lança a exceção certa, e o `GlobalExceptionHandler` escolhe o status.

Pro front, isso quer dizer que uma função só (`requisicao`, em `services/api.js`) entende qualquer erro, e cada tela põe a mensagem embaixo do campo que veio em `campos`. As mensagens dizem o que corrigir ("A raça deve pertencer à espécie informada"), e não o que falhou por dentro.

### O CEP é consultado pelo front

Quem consulta o ViaCEP é o navegador, e o back recebe o endereço completo (`docs/api.md`, decisão 1). Assim o formulário preenche cidade, estado e logradouro enquanto a pessoa digita, e o back não depende de um serviço de fora pra cadastrar ninguém. Os campos continuam editáveis, pra quando o CEP não traz logradouro ou o ViaCEP está fora do ar.

### O deploy em código, e conferido

O que dá pra deixar no repositório fica lá: `render.yaml`, `netlify.toml` e `backend/Dockerfile`. As senhas e chaves ficam só no painel do Render. Quando o back sobe ligado no banco de produção, a `ConferenciaDoDeploy` confere se a chave do JWT, as fotos no S3 e o CORS foram configurados, e se faltar algum, ele não sobe ([deploy](deploy.md)).

### Tema claro e escuro, e acessibilidade

As cores são variáveis CSS com os nomes do Figma, e o tema escuro troca só os valores. Assim nenhuma tela precisa de classe pra cada tema, e um componente novo já nasce funcionando nos dois. A escolha fica salva no navegador, e sem escolha vale a do sistema operacional.

Todas as telas usam rótulo em todo campo, foco visível pelo teclado, mensagem de erro ligada ao campo e o contraste mínimo do WCAG (nível AA) nos dois temas, conferidos no bug bash da #44 ([plano de testes](plano-de-testes.md#bug-bash-da-sprint-5-44)).

## Desafios técnicos e soluções

### A API do Render dorme

**Problema.** No plano gratuito, o Render desliga a API depois de 15 minutos sem uso, e o primeiro pedido depois disso leva perto de 1 minuto. Sem nenhum aviso, quem abre o site acha que ele travou.

**Solução.** Quando uma tela passa de 4 segundos carregando, aparece "O servidor estava parado e está acordando. Isso pode levar até 1 minuto." (`components/Carregando`). Pra apresentação, o workflow "Conferir produção" (`.github/workflows/producao.yml`) acorda a API e confere se o site, a API, o CORS e o banco estão respondendo. Ele roda todo dia de manhã e pelo botão na aba Actions ([deploy](deploy.md#antes-da-apresentação)).

### O CORS e as prévias do Netlify

**Problema.** O Netlify cria um endereço novo pra prévia de cada PR (`deploy-preview-12--adotaaqui.netlify.app`). Como o CORS só aceitava endereços exatos, o site abria na prévia, mas o navegador bloqueava todas as chamadas pra API.

**Solução.** O `CORS_ORIGENS` aceita padrões com `*` (`https://deploy-preview-*--adotaaqui.netlify.app`), pelo `setAllowedOriginPatterns` do Spring. Assim cada PR pode ser testado no navegador antes de entrar.

### Funcionava no H2 e quebrava no PostgreSQL

**Problema.** Os testes rodam no H2 e o site, no PostgreSQL, e os dois não se comportam igual. No painel de interesses, uma consulta com filtro opcional (`:animalId IS NULL OR ...`) passa no H2 e quebra no PostgreSQL com "could not determine data type of parameter", porque lá um UUID nulo chega sem tipo. Os testes ficariam verdes, e o erro só apareceria no site.

**Solução.** A consulta ficou sem os parâmetros opcionais, e os filtros passaram pro service (`InteresseRepository.findRecebidos`). Na busca sem acento, a gente escolheu de propósito uma função que existe nos dois bancos (`translate`), pra busca funcionar igual no Neon e nos testes. O comentário no código explica o motivo, pra ninguém voltar ao jeito que quebra.

### Duas aprovações ao mesmo tempo

**Problema.** Se duas pessoas do mesmo abrigo (o login é compartilhado) aprovassem dois candidatos do mesmo animal no mesmo segundo, as duas aprovações podiam ler o animal como Disponível, e o animal seria adotado duas vezes.

**Solução.** Antes de mexer no interesse, o back trava a linha do animal no banco (`findByIdParaAtualizacao`, com `@Lock(PESSIMISTIC_WRITE)`, que vira um `SELECT ... FOR UPDATE`). A segunda aprovação espera a primeira terminar e só então lê o interesse, que a primeira já descontinuou. Aí ela recebe 409, e o animal fica com um adotante só. O mesmo lock vale pra interesse novo, pra não entrar candidato num animal que acabou de ser adotado.

### Conta repetida ao mesmo tempo

**Problema.** O service confere se o CPF, o CNPJ ou o e-mail já existem antes de cadastrar. Mas dois cadastros iguais chegando juntos passam os dois pela conferência, e o segundo cairia num erro 500 quando o banco recusasse.

**Solução.** O `unique` do banco é a última barreira, e o `GlobalExceptionHandler` reconhece o código 23505 ("valor repetido", igual no PostgreSQL e no H2) e responde 409 "Já existe uma conta cadastrada com esses dados", a mesma resposta da conferência normal.

### O Hibernate não atualiza o que já existe

**Problema.** Na #40, o peso maior que zero e a dose da vacina 1 ou mais entraram como `CHECK` nas entidades. No banco local, recriado do zero, as duas regras apareceram. No Neon, onde as tabelas já existiam desde o primeiro deploy, não. O mesmo vale pra coluna que mudou de tamanho e pra valor novo num enum.

**Solução.** Duas coisas, uma pra cada parte do problema:

- `banco/integridade.sql` cria no Neon, à mão, os `CHECK` que o Hibernate não cria em tabela existente. Pode rodar mais de uma vez.
- `banco/conferencia.sql` (#46) lista as colunas, as regras e os índices do banco e gera uma "impressão" (md5) de cada parte. Roda no banco local recém-criado e no Neon, e se as impressões batem, os dois bancos são iguais. Se não batem, a lista mostra exatamente o que mudou ([deploy](deploy.md#conferir-o-banco-de-produção)).

### Deploy com valores de desenvolvimento

**Problema.** O `application.properties` tem valores padrão pra rodar na máquina de vocês sem configurar nada: uma chave de JWT de exemplo, fotos na memória e CORS só pro `localhost`. Se uma variável faltasse no Render, o back subiria normalmente com esses valores. Com a chave de exemplo, que está no repositório público, qualquer pessoa conseguiria criar um token válido.

**Solução.** A `ConferenciaDoDeploy` confere esses três valores quando o back sobe ligado num PostgreSQL fora da máquina. Se algum ainda for o de desenvolvimento, o back não sobe e diz quais variáveis faltam. No Render, o deploy falha e a versão anterior continua no ar.

### Arquivo que não é imagem

**Problema.** O nome e o tipo que o navegador manda no upload são escolhidos por quem envia. Um arquivo `.exe` renomeado pra `.jpg` passaria por uma conferência só da extensão, e ficaria público no S3.

**Solução.** O `FotoService` ignora o nome e lê os primeiros bytes do arquivo, que dizem o formato de verdade. Só aceita JPG, PNG e WEBP de até 5 MB, e o nome no S3 é gerado pelo back (`animais/` mais um UUID), então ninguém escolhe onde o arquivo vai parar.

### Front e back entendendo a regra de jeitos diferentes

**Problema.** Na revisão dos casos de teste contra o RF06, o fluxo de devolução não fechava: o front deixava voltar o animal adotado pra Disponível e editar os dados no mesmo salvamento, como o RF06 diz ("na mesma tela"), mas o back recusava com 409, porque entendia que animal adotado só muda o status. Os testes dos dois lados passavam, porque cada um testava a regra do seu jeito.

**Solução.** A #98 alinhou o back com o RF06 e o UC05 FA04: na devolução, os dados novos são aceitos e validados junto com o status. O teste novo (`devolucaoVoltaParaDisponivelComOsDadosNovos`) faz o mesmo pedido que o front faz. A divergência e a correção estão no [plano de testes](plano-de-testes.md).

### Navegação de site de uma página só

**Problema.** No React, trocar de página não recarrega o site, e duas coisas que o navegador faz sozinho deixaram de acontecer: a rolagem voltar pro topo (quem clicava num link do rodapé caía no meio da página nova) e o título da aba mudar (todas as abas se chamavam "Adota Aqui", e o leitor de tela não anunciava a página nova).

**Solução.** O `RolarParaOTopo` leva toda página nova pro topo, menos os links com `#` e o voltar do navegador, que devolve a pessoa onde ela estava. O `useTituloDaPagina` põe o nome de cada página no título ("Meus animais | Adota Aqui"). As duas correções vieram do bug bash da #44, junto com o contraste de alguns textos no tema escuro e o "Tentar de novo" nas telas que ainda não tinham.

## Como a equipe trabalhou

- **Sprints de uma semana.** Foram cinco sprints, de setembro a outubro, mais a semana final até 31/10. Cada sprint é um marco (milestone) no GitHub, com as issues dela.
- **Squads.** A equipe se dividiu em seis squads: front-end, back-end, banco de dados, testes, DevOps e documentação. Cada issue tem a etiqueta do squad, e o quadro do GitHub Projects mostra quem está com o quê.
- **Issue com dependência.** Toda issue diz o que fazer, do que depende, a sprint e o squad. Assim dava pra ver o que podia começar e o que estava esperando outra parte.
- **Contrato antes do código.** O `docs/api.md` foi escrito antes dos endpoints. O front começou as telas com dados de exemplo no formato do contrato (`frontend/src/mocks`) e depois ligou na API, e o back implementou o mesmo contrato, sem um esperar o outro.
- **Branch e PR.** Cada issue ganha uma branch a partir da `dev`, e o PR só entra com o CI verde (testes e cobertura mínima de 70%) e a aprovação de alguém. A `main` só recebe a `dev`, e é ela que está no ar.

## O que ficou de fora

A ERS (seção 6) já separava o que não cabia nos dois meses do curso. Ficaram pra uma próxima versão:

| O quê                                            | Por quê ficou de fora                                                                                                                                                                        |
| ------------------------------------------------ | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Formulário completo de candidatura               | Coletaria dados de outras pessoas da casa, o que pede um cuidado com a LGPD maior que o aviso do RF13. No lugar, entrou a triagem curta do RF15, com a opção de responder direto ao protetor |
| Doações e apadrinhamento                         | Precisam de um serviço de pagamento, com cobrança recorrente no caso do apadrinhamento                                                                                                       |
| Depoimento e mural de adoções (RF11, UC09)       | Era opcional na ERS e ficou pra depois do fluxo principal                                                                                                                                    |
| Blog, animais desaparecidos, estatísticas e mapa | Funcionalidades novas, fora do fluxo de adoção                                                                                                                                               |
| Aviso por e-mail de interesse novo               | No MVP, o aviso é o próprio painel: interesse novo aparece como Pendente (`docs/api.md`, decisão 3)                                                                                          |
| Paginação da vitrine                             | A vitrine traz todos os disponíveis de uma vez. No volume do curso fica rápido, mas com muitos animais vai precisar                                                                          |
| Apagar a imagem do S3                            | Remover uma foto ou um animal tira a URL do banco, mas o arquivo continua no S3                                                                                                              |
