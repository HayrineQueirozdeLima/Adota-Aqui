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

O arquivo da foto também sai do S3, mas só depois que a remoção é salva (ver "Fotos passam pela API").

### Sessão sem estado, com JWT e BCrypt

A API não guarda sessão: cada pedido leva o token, e o back confere a assinatura toda vez. Assim o back pode reiniciar (o Render faz isso sempre que dorme) sem deslogar ninguém. O token vale 24 horas e a senha é guardada só como hash BCrypt (RNF02, RNF03).

Um token inválido ou vencido recebe 401 mesmo numa rota pública, como a vitrine. Se ele fosse tratado como visitante, a API devolveria os animais de todos os estados enquanto o site ainda mostra a pessoa como logada. Com o 401, o front encerra a sessão, e a vitrine continua aberta, agora como visitante de verdade.

### O animal tem o próprio local

No começo, o animal herdava a cidade e o estado de quem cadastrou. Na reunião de 04/11, o tutor mostrou dois casos em que isso não bate: o protetor que se muda, e a pessoa que cadastra um animal que está com outra pessoa em outra cidade (a avó que achou um cachorro no Maranhão e não sabe usar o site). Agora o animal guarda a própria `cidade` e o próprio `estado`.

- No cadastro, os dois já vêm preenchidos com o endereço da conta, então quem não precisa mudar não digita nada a mais.
- Na edição, o protetor muda o local quando o animal muda de lugar. Mudar o endereço da conta não leva os animais junto.
- A pessoa física logada vê só os animais que estão no estado dela e só pode demonstrar interesse neles (RF14). Visitante e abrigo veem todos. A comparação continua pela sigla do estado, sem distância nem mapa.
- Os animais que já estavam no banco ganham o endereço do protetor na primeira vez que o back sobe com a mudança (`LocalDosAnimaisAntigos`). Como a gente não usa Flyway, essa foi a forma de preencher as colunas novas sem rodar SQL à mão no Neon.

### Interesse com status e aprovação travada

O interesse nasce Pendente, pode passar por Em contato e termina Aprovado ou Descontinuado (RF10). Aprovado e Descontinuado são finais, nada volta pra Pendente, e descontinuar exige um motivo. O service recusa qualquer outra mudança com 409, e o diagrama está em [diagramas/diagramas-adota-aqui.md](diagramas/diagramas-adota-aqui.md).

Aprovar é a operação mais delicada do sistema, e acontece numa transação só: o interesse vira Aprovado, o animal vira Adotado e os outros interesses ativos dele viram Descontinuados, com o motivo "Outro candidato foi aprovado para este animal." Se um passo falha, nenhum é gravado.

Já a desistência do candidato apaga o interesse, em vez de criar um status "Desistiu". Ela só vale pra interesse em andamento, que ainda não teve decisão do protetor, então não tem resultado a guardar, e a pessoa pode demonstrar interesse de novo depois, se quiser. Aprovado e Descontinuado não podem ser apagados.

### Depoimento preso à adoção

O depoimento (RF11) não é um post solto: ele fica ligado ao interesse aprovado, com `unique` no banco, e é dali que vêm o adotante e o animal. Assim, só quem adotou de verdade escreve, e uma vez por adoção. A regra da "adoção atual" (aprovada, com o animal Adotado e sem outra aprovação depois) cobre a devolução: depois de uma devolução e de uma nova adoção, a vez passa pra quem adotou por último.

O mural é público, então a API manda só o primeiro nome e o estado de quem contou, e a pessoa autoriza a publicação antes de enviar (LGPD). A foto tem que ter passado pelo `POST /api/fotos`: uma URL de outro site no mural seria uma imagem que ninguém conferiu.

O prazo de 30 dias da ERS (6.3) precisava da data da aprovação, que o interesse não guardava. A coluna `aprovado_em` entrou junto, e os interesses aprovados antes dela ficam sem prazo, em vez de perder o direito por uma data que não existe.

### Artigos só de protetor, em texto puro

O blog para tutores (ERS 6.4) não tem moderação, então a regra de quem escreve faz esse papel: só abrigo, ou pessoa que já cadastrou um animal. Quem só está procurando um animal pra adotar lê, mas não publica. E só quem escreveu edita ou apaga.

O texto é puro, sem HTML nem Markdown. O site separa os parágrafos pelas linhas em branco e mostra tudo como texto, então um artigo não consegue carregar um script ou um link disfarçado. Formatação mais rica pediria limpar o HTML no back, e pro tamanho de um artigo os parágrafos já resolvem.

### Feira de adoção só de abrigo

Feira junta muita gente e muitos animais num lugar público, e quem organiza costuma ser abrigo ou ONG. Se qualquer conta pudesse divulgar, daria pra marcar um "evento" falso pra encontrar desconhecidos, e o site não tem moderação. Por isso só a conta de abrigo divulga (o service confere, e o front esconde o botão e o formulário de quem não é abrigo), e a feira mostra do abrigo só o nome, como a vitrine.

O horário da feira é o da cidade dela. O "Adicionar à agenda" manda pro Google Agenda o fuso do estado da feira, então quem mora em outro fuso vê a hora certa.

### A lista de protetores mostra só o que já é público

A página de abrigos e protetores mostra o nome, a cidade, o estado, o tipo e as contagens, que é o que já aparece no card de cada animal (RF07). E-mail, telefone e documento ficam de fora, e o contato continua saindo só quando alguém demonstra interesse (RF09). Pessoa só entra na lista depois de cadastrar um animal: quem só está procurando pra adotar não aparece.

A lista junta duas tabelas (`abrigo` e `usuario`) numa ordem só, a alfabética. O `ProtetorService` busca as duas, filtra, põe em ordem com o `Collator` do português (assim "Ágata" fica com os nomes da letra A) e corta a página no Java. Com centenas de protetores isso é rápido e funciona igual no H2 e no PostgreSQL. Se um dia passar de alguns milhares, vale trocar por uma consulta só no banco, com `UNION` e a paginação lá dentro.

### Animal adotado fica travado

Com o animal Adotado, os dados ficam como estão: o formulário só deixa mudar o status (RF06). Pra editar, o protetor volta o status pra Disponível, o que é uma devolução (UC05 FA04), e aí os campos abrem na mesma tela. O interesse aprovado continua no histórico.

A adoção também só acontece pela aprovação de um interesse. Marcar Adotado direto no formulário é recusado, porque aí o animal ficaria adotado sem adotante.

### Fotos passam pela API

O navegador não manda a foto direto pro S3: manda pro `POST /api/fotos`, e o back grava. Assim a chave da AWS fica só no Render, e o back confere o arquivo antes de guardar. O banco guarda só as URLs (RF16), e o navegador carrega as imagens direto do S3, sem passar pela API.

Quando a foto sai de um animal, na edição ou na remoção, o arquivo sai também do S3 (`LimpezaDeFotos`). Isso só acontece depois que a alteração é salva no banco: se a transação falhar, a foto continua lá. E só sai a foto que a própria API guardou e que nenhum outro animal usa.

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

### Swagger junto com o contrato da API

O `docs/api.md` foi escrito antes do código, como o combinado entre front e back, e é onde estão as regras e os erros de cada endpoint. O Swagger (`/swagger-ui.html`) é montado pelo springdoc a partir dos próprios controllers, então não tem como ficar diferente do que a API faz, e deixa qualquer pessoa testar os endpoints no navegador, inclusive os que pedem login (com o token no "Authorize"). Um não substitui o outro: o Swagger mostra o que existe, e o `api.md` explica o porquê.

A página do Swagger é aberta, como o `api.md` no GitHub. Testar uma rota fechada por ali continua pedindo o token. O endereço da API no Swagger é relativo (`/`), porque atrás do proxy do Render ele seria montado com `http`, e o navegador bloquearia o teste numa página `https`.

### Docker pra rodar tudo com um comando

O back já ia pro Render numa imagem Docker (`backend/Dockerfile`). O `docker-compose.yml` junta essa imagem com um PostgreSQL e com o front servido por um nginx, pra quem for avaliar ou entrar na equipe subir o projeto inteiro com `docker compose up --build`, sem instalar Java, Maven, Node nem PostgreSQL. O front continua sendo publicado pelo Netlify, que builda sozinho a partir do `netlify.toml`: o Docker do front é só pra rodar local.

### Botões de salvar no fim do formulário no celular

No Figma, os botões de salvar ficam no topo, ao lado do título. No computador isso funciona, mas no celular o formulário do animal e o Meu perfil são longos, e a pessoa tinha que rolar tudo de volta pra salvar. Agora, no HTML, os botões vêm depois do último campo, com o aviso de erro do envio logo acima deles, e no computador o CSS (`lg:order`, com o formulário virando grade) sobe os dois pro lugar do Figma.

Ficou assim, e não com dois pares de botões (um escondido em cada tamanho de tela), pra ter um botão só na página: o leitor de tela não acha dois "Salvar alterações", e os testes procuram o botão pelo nome sem ambiguidade. A ordem do teclado segue o HTML: a pessoa passa pelos campos e chega no salvar.

### O mapa de clínicas é o do Google, embutido

O mapa de clínicas veterinárias (`/clinicas`) precisava funcionar em qualquer cidade do Brasil. Os dados abertos do OpenStreetMap são gratuitos, mas o cadastro de clínicas é bem desigual entre as cidades, e o mapa ainda pediria uma biblioteca nova. A busca do Google Places tem os dados, mas é paga.

Ficou o mapa do Google embutido na página (`output=embed`), já buscando "veterinário" no lugar escolhido (no começo era "clínica veterinária", mas aí ficavam de fora os hospitais e os lugares sem "clínica" no nome). Não precisa de chave, não custa nada e não passa pela nossa API: o site não guarda nem as clínicas nem onde a pessoa está, e a localização vai pro Google arredondada em uns 100 metros. O risco é que esse formato não é a API oficial. Se o Google parar de aceitar, a troca é pela Maps Embed API, que também é gratuita mas pede uma chave, e só muda o endereço montado em `utils/clinicas.js`.

### IA com uma pessoa decidindo no fim

As duas ajudas com IA foram pensadas pra não colocar a IA no lugar de ninguém. No "Escrever com IA", a sugestão aparece separada e só vai pro campo quando o protetor escolhe usar, e ele ainda edita. No "Me ajuda a escolher", a IA só aponta animais da lista que o back mandou: o back numera os animais disponíveis, manda a lista e só aceita de volta números dela, então a IA não tem como inventar um animal nem indicar um de outro estado. A conversa com o protetor continua sendo o caminho pra adotar.

Pra IA não inventar características, as regras que vão junto pedem pra usar só os dados recebidos e tratar o texto da pessoa como informação, ignorando pedidos dentro dele pra mudar as regras. Vai pra IA só o que já é público no perfil do animal, e a tela pede pra pessoa não escrever dado pessoal, porque no nível gratuito o Google pode usar o que recebe pra melhorar os produtos dele.

O Gemini foi escolhido porque tem nível gratuito sem cartão. A chave fica só no Render, a chamada vai com a chave no cabeçalho (fora da URL, pra não parar em log), e a IA é opcional: sem a chave, os botões somem e o site segue igual. O limite de 15 pedidos por hora por conta protege a cota de cliques repetidos e de robô. Nos testes, a IA é uma versão de mentira (Mockito), pra não depender da internet nem gastar a cota.

### O observatório mistura o que é nosso e o que é público

Os números do site, sozinhos, ainda são poucos e de poucos estados, porque o Adota Aqui está começando. Por isso o observatório põe do lado dados públicos sobre cães e gatos, e cada um tem a fonte e a data na tela. Os do site vêm da API, ao vivo; os públicos ficam no código, porque nenhuma dessas fontes tem uma API simples, e a tabela do IBGE fica parada até a próxima pesquisa. O texto avisa que não existe censo oficial de animais abandonados no Brasil, e que os totais do país são estimativas.

O mapa é um mosaico, um quadrado por estado, em vez do desenho das fronteiras: não precisa de biblioteca nova, os estados pequenos não somem, e cada quadrado é um botão que o leitor de tela lê com o nome e o número. As cores seguem um roxo só, do claro ao escuro, com o texto de cada tom passando no contraste, e a tabela com os 27 estados fica embaixo pra quem não quer ler pelo mapa.

### Tema claro e escuro, e acessibilidade

As cores são variáveis CSS com os nomes do Figma, e o tema escuro troca só os valores. Assim nenhuma tela precisa de classe pra cada tema, e um componente novo já nasce funcionando nos dois. A escolha fica salva no navegador, e sem escolha vale a do sistema operacional.

Todas as telas usam rótulo em todo campo, foco visível pelo teclado, mensagem de erro ligada ao campo e o contraste mínimo do WCAG (nível AA) nos dois temas, conferidos no bug bash da #44 ([plano de testes](plano-de-testes.md#bug-bash-da-sprint-5-44)).

### Animações que não roubam a cena

A ideia era deixar a Home e o Quem somos mais vivos sem poluir a tela. Por isso as animações seguem três regras: acontecem uma vez só (quando a página abre ou quando o bloco entra na tela), duram menos de 1 segundo e só mexem em opacidade e posição, que o navegador anima sem travar a rolagem. Nada fica piscando ou se mexendo sem parar, e o foco continua nos animais.

Quem marcou "reduzir movimento" no sistema vê tudo pronto e parado, e o leitor de tela nunca ouve a contagem dos números, só o valor final. Isso segue o critério 2.3.3 do WCAG (animação causada por interação pode ser desligada).

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

### Animação ao rolar sem piscar e sem esconder conteúdo

**Problema.** Pra um bloco subir quando entra na tela, ele precisa começar escondido. Isso trazia três riscos: o bloco aparecer e sumir num piscar enquanto a página carregava, ficar escondido pra sempre num navegador que não sabe observar a rolagem, e o React apagar a marca de "já apareceu", porque ele reescreve a classe do elemento sempre que a tela atualiza.

**Solução.** Um script curto no `index.html`, antes do site desenhar, põe a classe `animar` no `<html>` só quando o navegador tem o `IntersectionObserver` e a pessoa não pediu menos movimento. Sem essa classe, nada começa escondido. A marca de "já apareceu" é um atributo (`data-revelado`), e não uma classe, então o React não mexe nela. E um `MutationObserver` pega os blocos que chegam depois, como os cards que vêm da API. A trilha do Quem somos mede a linha pontilhada, e não a laranja, porque a laranja encolhe e cresce com a própria medida.

### A IA demorava e voltava sem resposta

**Problema.** No ar, a chave funcionava (`/api/ia/disponivel` dizia `true`), mas o "Escrever com IA" e o "Me ajuda a escolher" demoravam e terminavam em "A ajuda com IA não está disponível agora". Eram duas causas juntas. O modelo escolhido (Gemini 3.8 Flash) "pensa" antes de responder, e esse pensamento gasta o mesmo limite de tokens da resposta: ele levava vários segundos e às vezes chegava no limite sem escrever nada. E, no nível gratuito, esse modelo aceita poucos pedidos por dia, que acabavam com os testes da equipe. Pra piorar, o log só dizia o tipo do erro do Java, sem o motivo.

**Solução.** O modelo principal passou a ser um Flash-Lite, que responde em poucos segundos e tem uma cota grátis bem maior. O pedido manda pensar pouco (`thinkingLevel: low`) e tem folga de tokens. Se o principal estiver sem cota, fora do ar ou voltar sem texto, a API tenta uma vez um modelo reserva; se a chave estiver errada, não tenta, porque daria o mesmo erro. O log agora mostra o código e o tipo do erro do Google (ex.: `429 RESOURCE_EXHAUSTED`), sem a chave nem o pedido, e o [deploy.md](deploy.md) tem uma tabela do que cada um quer dizer. Os modelos e o quanto ele pensa podem ser trocados no Render, sem mexer no código. Teste: `ClienteGeminiTest`, com um servidor de mentira fazendo o papel do Google.

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

A ERS (seção 6) já separava o que não cabia nos dois meses do curso. Na reunião de 04/11, o tutor sugeriu outras ideias pra evoluir o site, e a equipe avaliou cada uma. As que dão pra fazer, mas não cabiam antes da apresentação final, entraram na mesma seção da ERS (de 6.10 a 6.12, e as avaliações em 6.2, 6.5 e 6.8) e nesta tabela. Depois, o mapa de clínicas veterinárias (ERS 6.10) e o observatório com os dados por estado (ERS 6.8) acabaram entrando ([funcionalidades](funcionalidades.md#16-clínicas-veterinárias-perto-de-você) e [observatório](funcionalidades.md#18-observatório-da-adoção)). Ficaram pra uma próxima versão:

| O quê | Por quê ficou de fora |
| --- | --- |
| Formulário completo de candidatura | Coletaria dados de outras pessoas da casa, o que pede um cuidado com a LGPD maior que o aviso do RF13. No lugar, entrou a triagem curta do RF15, com a opção de responder direto ao protetor |
| Doação pelo site e apadrinhamento | Precisam de um serviço de pagamento, e o site passaria a intermediar dinheiro de outras pessoas, com taxa, estorno, contestação e risco de golpe. Num projeto de curso, só daria pra mostrar em modo de teste. O jeito mais simples numa próxima versão é o abrigo mostrar a própria chave PIX no perfil, com o dinheiro indo direto pra ele (ERS 6.2 e 6.6) |
| Animais perdidos e encontrados | Dá pra fazer aproveitando o envio de fotos, os cards, os filtros e o local do animal, mas pede tabela e telas novas, validade pros anúncios antigos e um jeito de contato que não exponha o telefone. Leva de uma a duas semanas, então é a primeira da fila depois da apresentação (ERS 6.5) |
| Receber denúncia de maus-tratos | Guardar denúncia é guardar dado sensível de outras pessoas, com risco de acusação falsa, e o site não tem como agir sobre o caso. Uma página só informativa, explicando que é crime e mostrando os canais oficiais, não guarda nada e pode entrar antes (ERS 6.11) |
| Inteligência artificial nas fotos | Reconhecer o animal pela foto ou comparar fotos de perdidos e encontrados precisa de um serviço de imagem pago e de alguém conferindo o resultado. A IA de texto entrou ([funcionalidades](funcionalidades.md#19-ajudas-com-inteligência-artificial)) (ERS 6.12) |
| Aviso por e-mail de interesse novo | No MVP, o aviso é o próprio painel: interesse novo aparece como Pendente (`docs/api.md`, decisão 3) |
