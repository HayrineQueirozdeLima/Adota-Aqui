# Casos de teste

Plano de casos de teste da plataforma Adota Aqui, escrito pelo Cristian (squad de Testes) e revisado pela equipe pra bater com o que o sistema faz hoje.

- **Versão:** 1.5 (outubro de 2026)
- **Total:** 65 casos, 62 já automatizados e 3 manuais

Este documento diz **o que** precisa funcionar, do ponto de vista de quem usa o site. O [plano de testes](plano-de-testes.md) diz **como** a equipe testa (ferramentas, cobertura, quem faz o quê).

## 1. Visão geral e objetivos

Garantir que o Adota Aqui funciona do jeito que os requisitos pedem: cadastro e login seguros, vitrine com filtros, perfil do animal, demonstração de interesse com termo e triagem, cadastro de animais e o painel em que o protetor aprova a adoção. Também entram usabilidade, acessibilidade, segurança e desempenho.

**Coberto:** página inicial e navegação, cadastro e login, vitrine, busca e filtros, perfil do animal, demonstração de interesse e desistência, cadastro de animal e Meus animais, painel de interesses recebidos, Minhas candidaturas, Meu perfil, acessibilidade, segurança e desempenho.

**Fora do escopo desta fase:**

- teste de carga (muitos acessos ao mesmo tempo);
- doações e pagamentos, que estão fora do MVP (ERS, seção 6).

## 2. Casos de teste

A coluna **Automatizado em** mostra o arquivo de teste que já confere o caso. Os que dizem **Manual** precisam ser testados à mão antes de cada entrega. Arquivos `.java` ficam em `backend/src/test/java/com/adotaaqui/` e os `.jsx` em `frontend/tests/`.

### Módulo 1: Navegação e página inicial

| ID        | Cenário                 | Tipo           | Resultado esperado                                                                                                                                                                                                                                                                     | Automatizado em                           |
| --------- | ----------------------- | -------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ----------------------------------------- |
| CT-NAV-01 | Abrir a página inicial  | Smoke          | O menu, o título e os cartões dos animais aparecem, sem erro no console                                                                                                                                                                                                                | `App.test.jsx`, `VitrineAnimais.test.jsx` |
| CT-NAV-02 | Responsividade          | UI             | Nos tamanhos do Figma, celular (390px), tablet (834px) e computador (1440px), e também nos celulares mais estreitos (360px e 320px), as telas se ajustam: não aparece rolagem pro lado, nenhum texto ou botão fica cortado ou passa da borda do cartão, e o menu mostra todos os itens | Manual                                    |
| CT-NAV-03 | Menu conforme a conta   | Funcional      | Visitante vê "Cadastrar" e "Entrar". Logado vê "Explorar", "Meus animais" e "Interesses recebidos", e só pessoa física vê "Minhas candidaturas"                                                                                                                                        | `Navbar.test.jsx`                         |
| CT-NAV-04 | Endereço que não existe | Funcional      | Aparece "Página não encontrada", com o menu e os botões "Ver animais disponíveis" e "Ir para a página inicial"                                                                                                                                                                         | `App.test.jsx`                            |
| CT-NAV-05 | Trocar o tema           | UI             | O botão do topo troca entre claro e escuro, e a escolha continua depois de recarregar a página. Quem nunca escolheu vê o tema do sistema operacional                                                                                                                                   | `BotaoTema.test.jsx`                      |
| CT-NAV-06 | Links do rodapé         | Funcional      | "Explorar animais", "Como adotar", "Abrigos e protetores independentes" e "Cadastrar um animal" levam pra tela certa                                                                                                                                                                   | `Rodape.test.jsx`, `Home.test.jsx`        |
| CT-NAV-07 | Trocar de página        | UI             | A página nova abre no topo, mesmo vindo do fim da anterior (ex.: um link do rodapé). Voltar no navegador devolve a pessoa onde ela estava                                                                                                                                              | `RolarParaOTopo.test.jsx`                 |
| CT-NAV-08 | Título da aba           | Acessibilidade | Cada página mostra o nome dela na aba do navegador (ex.: "Meus animais"), e o leitor de tela anuncia a página nova                                                                                                                                                                     | `App.test.jsx`, `EditarAnimal.test.jsx`   |

### Módulo 2: Cadastro, login e sessão

| ID        | Cenário                                     | Tipo             | Resultado esperado                                                                                                        | Automatizado em                                                                      |
| --------- | ------------------------------------------- | ---------------- | ------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------ |
| CT-AUT-01 | Cadastrar pessoa física com dados válidos   | Funcional        | A conta é criada, a pessoa entra logada e vai pra vitrine                                                                 | `Cadastro.test.jsx`, `AutenticacaoIntegrationTest.java`                              |
| CT-AUT-02 | Cadastrar abrigo com dados válidos          | Funcional        | O abrigo é criado com CNPJ e razão social e entra logado                                                                  | `Cadastro.test.jsx`, `AutenticacaoIntegrationTest.java`                              |
| CT-AUT-03 | CPF, CNPJ ou e-mail que já têm conta        | Regra de negócio | A mensagem aparece embaixo do campo certo e nenhuma conta nova é criada                                                   | `Cadastro.test.jsx`, `AutenticacaoIntegrationTest.java`                              |
| CT-AUT-04 | CPF ou CNPJ com número errado               | Validação        | O campo mostra o erro antes de enviar, e o back também recusa                                                             | `Validacoes.test.jsx`, `AutenticacaoIntegrationTest.java`, `DocumentoUtilsTest.java` |
| CT-AUT-05 | Preencher o CEP                             | Funcional        | Cidade, estado e logradouro são preenchidos sozinhos. CEP que não existe mostra "CEP não encontrado. Confira os números." | `Cadastro.test.jsx`                                                                  |
| CT-AUT-06 | Entrar com CPF ou com CNPJ                  | Funcional        | O login funciona com ou sem máscara no documento                                                                          | `Login.test.jsx`, `AutenticacaoIntegrationTest.java`                                 |
| CT-AUT-07 | Senha errada ou documento sem conta         | Segurança        | Nos dois casos aparece a mesma mensagem, "Documento ou senha inválidos", pra ninguém descobrir quem tem conta             | `Login.test.jsx`, `AutenticacaoIntegrationTest.java`                                 |
| CT-AUT-08 | Manter a conta conectada e sair             | Funcional        | Marcado, o login continua depois de fechar o navegador. Desmarcado, some ao fechar a aba. "Sair da conta" apaga a sessão  | `Login.test.jsx`, `AuthContext.test.jsx`                                             |
| CT-AUT-09 | Abrir tela que exige login sem estar logado | Segurança        | A pessoa vai pro login e, depois de entrar, volta pra tela que queria                                                     | `AuthContext.test.jsx`, `Login.test.jsx`                                             |

### Módulo 3: Vitrine, busca e filtros

| ID        | Cenário                                                     | Tipo             | Resultado esperado                                                                                                                                                          | Automatizado em                                         |
| --------- | ----------------------------------------------------------- | ---------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------- |
| CT-FLT-01 | Filtrar por espécie (cães ou gatos)                         | Funcional        | Só aparecem os animais da espécie escolhida                                                                                                                                 | `VitrineAnimais.test.jsx`, `AnimalIntegrationTest.java` |
| CT-FLT-02 | Combinar filtros (porte, sexo, raça, energia e convivência) | Funcional        | Só aparecem os animais que atendem a todos os filtros ao mesmo tempo                                                                                                        | `VitrineAnimais.test.jsx`, `AnimalIntegrationTest.java` |
| CT-FLT-03 | Buscar por cidade                                           | Funcional        | Acha por parte do nome, sem diferença de acento e maiúscula: "sao" acha São Paulo                                                                                           | `VitrineAnimais.test.jsx`, `AnimalIntegrationTest.java` |
| CT-FLT-04 | Filtro sem nenhum resultado                                 | Exceção          | Aparece "Nenhum resultado encontrado com essas informações." e o botão "Ver todos os animais"                                                                               | `VitrineAnimais.test.jsx`                               |
| CT-FLT-05 | Limpar filtros                                              | Funcional        | O botão "Limpar filtros" apaga a busca e os filtros e volta a lista completa                                                                                                | `VitrineAnimais.test.jsx`                               |
| CT-FLT-06 | Pessoa física logada                                        | Regra de negócio | Só aparecem animais do estado dela (RF14). Sem nenhum, aparece "Nenhum animal disponível no seu estado no momento."                                                         | `VitrineAnimais.test.jsx`, `AnimalIntegrationTest.java` |
| CT-FLT-07 | Buscar pelo nome do animal ou do protetor                   | Funcional        | Acha por parte do nome, sem diferença de acento e maiúscula, tanto o nome do animal ("mel") quanto o de quem cadastrou ("joao", "quatro patas"). Soma com os outros filtros | `VitrineAnimais.test.jsx`, `AnimalIntegrationTest.java` |

### Módulo 4: Perfil do animal e interesse

| ID        | Cenário                                               | Tipo             | Resultado esperado                                                                                            | Automatizado em                                                 |
| --------- | ----------------------------------------------------- | ---------------- | ------------------------------------------------------------------------------------------------------------- | --------------------------------------------------------------- |
| CT-PET-01 | Ver o perfil de um animal                             | Funcional        | Aparecem as fotos, as características, a convivência, as vacinas, a história e o protetor com cidade e estado | `PerfilAnimal.test.jsx`                                         |
| CT-PET-02 | Clicar em "Quero conhecer"                            | Funcional        | Visitante vai pro login antes. Pessoa física vai pro termo e pra triagem                                      | `PerfilAnimal.test.jsx`, `DemonstrarInteresse.test.jsx`         |
| CT-PET-03 | Animal já adotado                                     | Regra de negócio | Não aparece na vitrine, e o perfil só abre pro protetor dele                                                  | `PerfilAnimal.test.jsx`, `AnimalIntegrationTest.java`           |
| CT-PET-04 | Abrigo, o próprio protetor ou pessoa de outro estado  | Regra de negócio | No lugar do botão aparece um aviso explicando por que não dá pra demonstrar interesse                         | `PerfilAnimal.test.jsx`, `InteresseIntegrationTest.java`        |
| CT-PET-05 | Enviar sem aceitar o termo ou sem responder a triagem | Validação        | Não envia, marca o que falta e leva o foco pro primeiro erro (RF13, RF15)                                     | `DemonstrarInteresse.test.jsx`, `InteresseIntegrationTest.java` |
| CT-PET-06 | Interesse registrado                                  | Funcional        | Aparecem o WhatsApp e o e-mail do protetor, e o perfil passa a mostrar "Desistir da adoção"                   | `DemonstrarInteresse.test.jsx`, `PerfilAnimal.test.jsx`         |
| CT-PET-07 | Desistir do interesse                                 | Funcional        | Pede confirmação, apaga o interesse e o perfil volta a oferecer "Quero conhecer"                              | `PerfilAnimal.test.jsx`, `InteresseIntegrationTest.java`        |

### Módulo 5: Formulários

Vale pro cadastro de conta, pro cadastro de animal e pra demonstração de interesse.

| ID        | Cenário                                  | Tipo      | Resultado esperado                                                                                                    | Automatizado em                                     |
| --------- | ---------------------------------------- | --------- | --------------------------------------------------------------------------------------------------------------------- | --------------------------------------------------- |
| CT-FRM-01 | Enviar com todos os campos válidos       | Funcional | Envia, mostra o aviso de sucesso e leva pra tela seguinte                                                             | `Cadastro.test.jsx`, `CadastroAnimal.test.jsx`      |
| CT-FRM-02 | Enviar com campos obrigatórios em branco | Validação | Não envia, marca cada campo com a mensagem e leva o foco pro primeiro erro                                            | `CadastroAnimal.test.jsx`, `Validacoes.test.jsx`    |
| CT-FRM-03 | E-mail sem @ e telefone com letras       | Validação | O e-mail mostra erro de formato. O telefone não aceita letras e pede 10 ou 11 números                                 | `Validacoes.test.jsx`                               |
| CT-FRM-04 | Clicar duas vezes em enviar              | UI        | O botão fica desativado e muda o texto ("Criando conta...", "Enviando...") até a resposta chegar, sem envio duplicado | `Cadastro.test.jsx`, `DemonstrarInteresse.test.jsx` |

### Módulo 6: Cadastro de animal e Meus animais

| ID        | Cenário                                    | Tipo             | Resultado esperado                                                                                                        | Automatizado em                                         |
| --------- | ------------------------------------------ | ---------------- | ------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------- |
| CT-CAD-01 | Enviar foto JPG, PNG ou WEBP               | Funcional        | A foto aparece no formulário, e a primeira vira a principal                                                               | `CadastroAnimal.test.jsx`, `FotoIntegrationTest.java`   |
| CT-CAD-02 | Enviar PDF, TXT ou imagem com mais de 5 MB | Segurança        | O arquivo é recusado com a mensagem dos formatos e do tamanho aceitos. O back confere o tipo pelo conteúdo, não pelo nome | `CadastroAnimal.test.jsx`, `FotoIntegrationTest.java`   |
| CT-CAD-03 | Cadastrar animal                           | Funcional        | O animal aparece em Meus animais e na vitrine como Disponível                                                             | `CadastroAnimal.test.jsx`, `AnimalIntegrationTest.java` |
| CT-CAD-04 | Editar animal                              | Funcional        | As mudanças são salvas, inclusive fotos e vacinas                                                                         | `EditarAnimal.test.jsx`, `AnimalIntegrationTest.java`   |
| CT-CAD-05 | Remover animal                             | Funcional        | Pede confirmação. Depois, o animal some junto com as vacinas e os interesses                                              | `EditarAnimal.test.jsx`, `AnimalIntegrationTest.java`   |
| CT-CAD-06 | Editar animal adotado                      | Regra de negócio | Continuando Adotado, só o status pode mudar (RF06). Na devolução pra Disponível, os dados mudam no mesmo salvamento       | `EditarAnimal.test.jsx`, `AnimalIntegrationTest.java`   |
| CT-CAD-07 | Outra conta tenta editar ou remover        | Segurança        | A tela não mostra o formulário e a API recusa                                                                             | `EditarAnimal.test.jsx`, `AnimalIntegrationTest.java`   |

### Módulo 7: Interesses recebidos

| ID        | Cenário                         | Tipo             | Resultado esperado                                                                                                | Automatizado em                                                                                      |
| --------- | ------------------------------- | ---------------- | ----------------------------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------- |
| CT-INT-01 | Ver os interesses recebidos     | Funcional        | Os candidatos aparecem agrupados por animal, com e-mail, WhatsApp e a triagem                                     | `InteressesRecebidos.test.jsx`                                                                       |
| CT-INT-02 | Filtrar por status e por animal | Funcional        | A lista e as contagens mudam conforme o filtro                                                                    | `InteressesRecebidos.test.jsx`                                                                       |
| CT-INT-03 | Marcar em contato               | Funcional        | O interesse Pendente passa pra Em contato                                                                         | `InteressesRecebidos.test.jsx`, `InteresseIntegrationTest.java`                                      |
| CT-INT-04 | Descontinuar                    | Regra de negócio | Sem motivo não envia. Com motivo, o interesse vira Descontinuado e o motivo fica guardado                         | `InteressesRecebidos.test.jsx`, `InteresseIntegrationTest.java`, `model/RegrasDasEntidadesTest.java` |
| CT-INT-05 | Aprovar                         | Regra de negócio | Pede confirmação. O animal vira Adotado e os outros interesses dele são descontinuados com o motivo padrão (RF10) | `InteressesRecebidos.test.jsx`, `InteresseIntegrationTest.java`                                      |

### Módulo 8: Minhas candidaturas

| ID        | Cenário                               | Tipo             | Resultado esperado                                                                                                                            | Automatizado em                                                            |
| --------- | ------------------------------------- | ---------------- | --------------------------------------------------------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------- |
| CT-CAN-01 | Ver minhas candidaturas               | Funcional        | Cada candidatura mostra o animal, o status, quando foi enviada e o e-mail e o WhatsApp do protetor. As em andamento vêm primeiro              | `MeusInteresses.test.jsx`, `InteresseIntegrationTest.java`                 |
| CT-CAN-02 | Filtrar por status                    | Funcional        | A lista e as contagens mudam conforme o filtro                                                                                                | `MeusInteresses.test.jsx`                                                  |
| CT-CAN-03 | Candidatura aprovada ou descontinuada | Regra de negócio | A descontinuada mostra o motivo que o protetor escreveu. Animal já adotado não tem "Ver ficha", e só as em andamento têm "Desistir da adoção" | `MeusInteresses.test.jsx`, `InteresseIntegrationTest.java`                 |
| CT-CAN-04 | Desistir pela lista                   | Funcional        | Pede confirmação, apaga o interesse e a candidatura some da lista, com um aviso                                                               | `MeusInteresses.test.jsx`, `InteresseIntegrationTest.java`                 |
| CT-CAN-05 | Conta de abrigo                       | Segurança        | O menu não mostra "Minhas candidaturas", a tela manda pra página inicial e a API responde 403                                                 | `Navbar.test.jsx`, `AuthContext.test.jsx`, `InteresseIntegrationTest.java` |

### Módulo 9: Meu perfil

| ID        | Cenário               | Tipo             | Resultado esperado                                                                                                   | Automatizado em                                 |
| --------- | --------------------- | ---------------- | -------------------------------------------------------------------------------------------------------------------- | ----------------------------------------------- |
| CT-PRF-01 | Abrir Meu perfil      | Funcional        | O formulário vem preenchido. O CPF ou o CNPJ aparecem, mas não dá pra editar                                         | `Perfil.test.jsx`, `PerfilIntegrationTest.java` |
| CT-PRF-02 | Editar os dados       | Funcional        | Nome, telefone, e-mail e endereço são salvos, e o nome novo aparece no menu sem entrar de novo                       | `Perfil.test.jsx`, `PerfilIntegrationTest.java` |
| CT-PRF-03 | E-mail de outra conta | Regra de negócio | A mensagem aparece embaixo do e-mail e nada é salvo                                                                  | `Perfil.test.jsx`, `PerfilIntegrationTest.java` |
| CT-PRF-04 | Mudar o estado        | Regra de negócio | A vitrine passa a mostrar os animais do estado novo, e os animais da conta passam a aparecer pra quem é de lá (RF14) | `PerfilIntegrationTest.java`                    |
| CT-PRF-05 | Trocar a senha        | Funcional        | Pede a senha atual e a confirmação. Depois, o login só funciona com a senha nova                                     | `Perfil.test.jsx`, `PerfilIntegrationTest.java` |
| CT-PRF-06 | Senha atual errada    | Segurança        | A mensagem aparece embaixo da senha atual e a pessoa continua logada                                                 | `Perfil.test.jsx`, `PerfilIntegrationTest.java` |

### Módulo 10: Desempenho, acessibilidade e segurança

| ID        | Cenário                            | Tipo           | Resultado esperado                                                                                                                                                                                                           | Automatizado em                                                                             |
| --------- | ---------------------------------- | -------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------- |
| CT-NFR-01 | Tempo de carregamento              | Desempenho     | No Lighthouse do Chrome, modo celular, a primeira pintura (FCP) fica abaixo de 2,5 segundos. Medir com a API já acordada: no plano gratuito do Render, o primeiro acesso depois de 15 minutos parada pode levar até 1 minuto | Manual                                                                                      |
| CT-NFR-02 | Texto alternativo nas fotos        | Acessibilidade | Toda foto de animal tem texto alternativo com o nome dele ("Foto de Mel", "Foto 1 de 3 de Mel"), pra quem usa leitor de tela                                                                                                 | `CardAnimal.test.jsx`, `PerfilAnimal.test.jsx`                                              |
| CT-NFR-03 | Código no meio do texto (XSS)      | Segurança      | Um animal com `<script>alert(1)</script>` na história mostra o código como texto e nada é executado. O React não transforma texto em HTML, e o projeto não usa `dangerouslySetInnerHTML`                                     | `PerfilAnimal.test.jsx`                                                                     |
| CT-NFR-04 | Senha protegida                    | Segurança      | A senha nunca volta nas respostas da API e fica guardada com BCrypt                                                                                                                                                          | `AutenticacaoIntegrationTest.java`                                                          |
| CT-NFR-05 | API protegida                      | Segurança      | Sem login, a API responde 401. Com login de outra conta, 403                                                                                                                                                                 | `AnimalIntegrationTest.java`, `InteresseIntegrationTest.java`, `PerfilIntegrationTest.java` |
| CT-NFR-06 | Usar o site só com o teclado       | Acessibilidade | Dá pra navegar e enviar os formulários só com Tab, Enter e espaço, com o foco sempre visível e na ordem da tela                                                                                                              | Manual                                                                                      |
| CT-NFR-07 | Dado inconsistente direto no banco | Integridade    | O banco recusa CPF, CNPJ ou e-mail repetidos, vacina ou interesse de animal que não existe, apagar conta que ainda tem animal, peso zerado e dose 0. Conta repetida ao mesmo tempo recebe 409, não 500                       | `model/IntegridadeDoBancoTest.java`, `exception/GlobalExceptionHandlerTest.java`            |

## 3. Cobertura

| Módulo                                     | Casos  | Automatizados | Manuais |
| ------------------------------------------ | ------ | ------------- | ------- |
| 1. Navegação e página inicial              | 8      | 7             | 1       |
| 2. Cadastro, login e sessão                | 9      | 9             | 0       |
| 3. Vitrine, busca e filtros                | 7      | 7             | 0       |
| 4. Perfil do animal e interesse            | 7      | 7             | 0       |
| 5. Formulários                             | 4      | 4             | 0       |
| 6. Cadastro de animal e Meus animais       | 7      | 7             | 0       |
| 7. Interesses recebidos                    | 5      | 5             | 0       |
| 8. Minhas candidaturas                     | 5      | 5             | 0       |
| 9. Meu perfil                              | 6      | 6             | 0       |
| 10. Desempenho, acessibilidade e segurança | 7      | 5             | 2       |
| **Total**                                  | **65** | **62**        | **3**   |

A porcentagem de cobertura do código (a meta de 70% do curso) não sai desta tabela: ela é medida pelo JaCoCo e pelo Jest a cada push, como explica o [plano de testes](plano-de-testes.md). Esta tabela mostra outra coisa: quantos comportamentos importantes já têm teste automático e quantos ainda dependem de alguém testar à mão.

## 4. Ambiente e critérios

**Onde testar os casos manuais:** no site publicado (adotaaqui.netlify.app), com uma conta de pessoa física, uma de abrigo e animais cadastrados por cada uma.

**Navegadores:** Chrome, Firefox e Safari, nas versões mais recentes.

**Tamanhos de tela:** celular (390 x 844), tablet (834 x 1194) e computador (1440 x 900), os mesmos do Figma. Pra responsividade (CT-NAV-02), testar também 360 x 800, a largura mais comum dos celulares Android, e 320 x 568, a menor que ainda aparece: foi nessas larguras que a revisão da #36 achou os problemas. No Chrome, dá pra simular todas pelo modo dispositivo (F12 e depois Ctrl+Shift+M).

**Quando um caso falha:** abrir uma issue com o ID do caso, o passo a passo, o que aconteceu e o que deveria acontecer.

**Registro da rodada manual:** antes de cada entrega, preencher:

| Data | Quem testou | Navegador e tela | CT-NAV-02 | CT-NFR-01 | CT-NFR-06 |
| ---- | ----------- | ---------------- | --------- | --------- | --------- |
|      |             |                  |           |           |           |
