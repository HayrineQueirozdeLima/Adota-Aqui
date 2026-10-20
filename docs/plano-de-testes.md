# Plano de testes do Adota Aqui

Os casos de teste do ponto de vista de quem usa o site, incluindo os que são testados à mão, estão em [casos-de-teste.md](casos-de-teste.md).

## Por que a gente testa

Além do curso pedir **no mínimo 70% de cobertura de testes**, sugerindo JUnit no back e Jest no front, com 9 pessoas mexendo no mesmo código, o teste é o que avisa quando uma mudança quebra algo que já funcionava, antes de chegar na apresentação.

**Cobertura** é a porcentagem do código que foi executada pelos testes. Ela mostra o que **ninguém testou**, mas não garante que o que foi testado está certo. Então a meta não é "bater 70%" de qualquer jeito, é testar primeiro o que é mais importante (ver a seção de prioridades) e deixar a porcentagem ser consequência.

## Ferramentas

| Parte | Roda os testes | Mede a cobertura |
| --- | --- | --- |
| Back-end | JUnit 5 (já vem com o Spring Boot) | JaCoCo |
| Front-end | Jest + Testing Library | O próprio Jest (`--coverage`) |

Os testes do back usam um banco H2 em memória, então não precisa de PostgreSQL pra rodar.

## Como rodar e ver a cobertura

**Back-end**

```bash
cd backend
mvn verify
```

O relatório fica em `backend/target/site/jacoco/index.html`. É só abrir no navegador.

**Front-end**

```bash
cd frontend
npm run test:coverage
```

Aparece uma tabela no terminal, e o relatório completo fica em `frontend/coverage/lcov-report/index.html`.

**Sem rodar nada:** a cada push, o CI mostra a cobertura de linhas e de ramos do back e do front no resumo da execução (aba **Actions**, abre a execução, e os números aparecem em cima). O relatório completo, arquivo por arquivo, fica em **Artifacts**: `cobertura-backend` e `cobertura-frontend`.

**O mínimo é obrigatório:** se a cobertura de linhas do back ou do front ficar abaixo de 70%, o CI falha e o PR não entra. No back quem confere é o JaCoCo (`check`, no `mvn verify`); no front, o `coverageThreshold` do `jest.config.js` (no `npm run test:coverage`).

## O que entra na conta

Fica **de fora** da cobertura só o que não tem lógica pra testar:

- `AdotaAquiApplication.java` (só liga a aplicação);
- a pasta `dto/` do back (só carrega dados de um lado pro outro);
- o `main.jsx`, o `config/ambiente.js` e a pasta `mocks/` do front (inicialização, endereço da API e dados de exemplo).

As entidades do `model` **entram**, porque têm regra de negócio (o xor do protetor, o motivo obrigatório na descontinuação, a raça que pertence à espécie).

## Prioridades

Testar nesta ordem. É a ordem de importância pro sistema funcionar: se o login quebrar, nada mais funciona.

| # | O quê | Casos que não podem faltar | Origem |
| --- | --- | --- | --- |
| 1 | **Cadastro** (Usuario e Abrigo) | cadastro certo; campo obrigatório vazio; CPF/CNPJ repetido; e-mail repetido (inclusive entre Usuario e Abrigo); senha e confirmação diferentes; senha salva com BCrypt, nunca em texto puro | UC01, UC02, RNF02 |
| 2 | **Login** | login certo com CPF e com CNPJ; senha errada; documento não cadastrado; documento sem 11 nem 14 dígitos; o token volta com o tipo de conta certo | UC03, RF03 |
| 3 | **Cadastro de animal** | cadastro certo; raça de outra espécie; sem foto; data futura; só o dono edita e remove; animal adotado só deixa mudar o status | UC04, UC05, RF06 |
| 4 | **Demonstrar interesse** | interesse certo; sem o aceite; triagem incompleta; conta de Abrigo; animal de outro estado; animal já adotado; interesse duplicado | UC07, RF13, RF14, RF15 |
| 5 | **Aprovar interesse** | aprovar deixa o animal ADOTADO e descontinua os outros interesses; descontinuar sem motivo é recusado; transição de status que não pode acontecer | UC08, RF10 |

As tabelas de **Erros** de cada endpoint no `docs/api.md` são um bom roteiro: cada linha da tabela vira pelo menos um teste.

No front, a prioridade é a mesma, olhando pro que a pessoa vê: o formulário mostra o erro certo, o botão certo aparece pra cada tipo de conta, a lista vazia mostra a mensagem certa.

## Revisão das prioridades 1 a 3

Revisão feita na issue #24: cada caso das prioridades 1 a 3 e o teste que cobre. Os marcados com **(novo)** entraram nessa revisão. Nomes do back sem pasta ficam em `backend/src/test/java/com/adotaaqui/`, e os do front em `frontend/tests/`.

### 1. Cadastro

| Caso | Back | Front |
| --- | --- | --- |
| Cadastro certo, pessoa física e abrigo | `AutenticacaoIntegrationTest`: `cadastraUsuarioFazLoginEAutenticaToken`, `cadastraAbrigoFazLoginEAutenticaToken` | `Cadastro.test.jsx`: "envia só números e entra logada na vitrine", "envia CNPJ e razão social pro endpoint de abrigos" |
| Campo obrigatório vazio ou fora do formato | `campoObrigatorioVazioOuInvalidoApontaOCampo` **(novo)** e `dto/DtoValidationTest` | `Validacoes.test.jsx`: "aponta cada campo com problema"; `Cadastro.test.jsx`: "os erros de campo que vêm da API aparecem no lugar certo" |
| CPF repetido | `cpfRepetidoNaoCriaOutraContaEDizOMotivo` **(novo)** | "CPF já cadastrado aparece embaixo do campo CPF" |
| CNPJ repetido | `cnpjRepetidoNaoCriaOutroAbrigoEDizOMotivo` **(novo)** | "CNPJ já cadastrado aparece embaixo do campo CNPJ" **(novo)** |
| E-mail repetido, inclusive entre pessoa e abrigo e com maiúsculas | `emailRepetidoValeParaAsDuasContasEIgnoraMaiusculas` **(novo)** e `rejeitaDocumentoDuplicadoEEmailEntreTiposDeConta` | "e-mail já cadastrado aparece embaixo do campo E-mail" **(novo)** |
| CPF ou CNPJ com tamanho, letras ou dígito verificador errado | `cpfOuCnpjComFormatoInvalidoNaoCriaConta` **(novo)**, `rejeitaDocumentosComDigitosVerificadoresInvalidos` e `util/DocumentoUtilsTest` **(novo)** | `Validacoes.test.jsx`: "recusa dígito errado, tamanho errado e números repetidos" |
| Senha e confirmação diferentes | `rejeitaConfirmacaoAusenteOuDiferenteParaAmbasContas` | "não envia com as senhas diferentes" |
| Senha guardada com BCrypt, nunca em texto puro | `cadastraUsuarioFazLoginEAutenticaToken` (confere o hash) | Não se aplica |

### 2. Login

| Caso | Back | Front |
| --- | --- | --- |
| Login certo com CPF e com CNPJ | `cadastraUsuarioFazLoginEAutenticaToken`, `cadastraAbrigoFazLoginEAutenticaToken` | `Login.test.jsx`: "mostra a máscara, mas manda só os números" |
| Documento com máscara | `loginAceitaDocumentoComMascara` **(novo)** | O mesmo teste acima |
| Senha errada e documento não cadastrado, com a mesma mensagem | `senhaIncorretaEContaInexistenteRetornamMesmoErro` (agora confere o texto "Documento ou senha inválidos") | "mostra a mensagem da API quando a senha está errada" |
| Documento sem 11 nem 14 dígitos | `rejeitaLoginSemCamposOuDocumentoComTamanhoInvalido` e `documentoSemOnzeNemQuatorzeDigitosExplicaOFormatoNoLogin` **(novo)** | `Validacoes.test.jsx`: "recusa documento que não tem 11 nem 14 dígitos"; `Login.test.jsx`: "valida antes de chamar a API" |
| Token com o tipo de conta certo | `cadastraUsuarioFazLoginEAutenticaToken` e `cadastraAbrigoFazLoginEAutenticaToken` (conferem o papel) | `AuthContext.test.jsx` |
| Token inválido ou vencido | `rejeitaTokenInvalidoOuExpiradoInclusiveNoLogin` | `AuthContext.test.jsx`: "sessão com o token vencido é descartada" |
| Manter a conta conectada ou não | Não se aplica | `Login.test.jsx`: os dois testes de "manter conectada" |

### 3. Cadastro de animal (CRUD)

| Caso | Back | Front |
| --- | --- | --- |
| Cadastro certo, por pessoa física e por abrigo | `AnimalIntegrationTest`: `cadastraComProtetorDoTokenEListaSomenteSeusAnimais` | `CadastroAnimal.test.jsx`: "publica com o corpo do api.md e volta pra Meus animais com o aviso" |
| Raça de outra espécie | `naoPermiteAdotarPeloPutNemSalvarRacaIncompativel`, `rejeitaEntradasInvalidasSemPersistirAnimal`, `dto/DtoValidationTest` e `model/enums/RacaTest` | `CadastroAnimal.test.jsx`: "a raça só libera depois da espécie e vem da API" |
| Sem foto | `rejeitaEntradasInvalidasSemPersistirAnimal` | `FormularioAnimal.test.jsx`: "o formulário em branco acusa todos os obrigatórios" |
| Data no futuro (nascimento e vacina) | `rejeitaEntradasInvalidasSemPersistirAnimal` | `FormularioAnimal.test.jsx`: "confere peso e nascimento" |
| Foto que não é imagem ou maior que 5 MB | `FotoIntegrationTest` | `CadastroAnimal.test.jsx`: "recusa arquivo que não é imagem e imagem maior que 5 MB" |
| Editar | `donoEditaEAtualizacaoSubstituiFotosEVacinas` | `EditarAnimal.test.jsx`: "salva com PUT levando todos os campos e o status" |
| Só o dono edita e remove | `terceirosNaoPodemEditarOuRemover` | `EditarAnimal.test.jsx`: "quem não cadastrou o animal não vê o formulário" |
| Animal adotado só deixa mudar o status | `adotadoSoMudaStatusEPreservaVacinasEHistorico` | `EditarAnimal.test.jsx`: "só o status fica editável" |
| Remover | `removerApagaDependentesMasPreservaContas` | `EditarAnimal.test.jsx`: os três testes de remoção |
| Listar os animais da conta | `cadastraComProtetorDoTokenEListaSomenteSeusAnimais` | `MeusAnimais.test.jsx` |
| Sem login | `rotasProtegidasExigemTokenEErrosDeEntradaSaoPadronizados` | `AuthContext.test.jsx`: "sem login, as telas de quem está logado mandam pro login" |

### Divergência encontrada

Na devolução de um animal adotado, o front destrava os campos e deixa salvar dados novos junto com a volta pra Disponível (`EditarAnimal.test.jsx`). O back recusa com `409` se algum dado mudar nesse mesmo salvamento (`adotadoSoMudaStatusEPreservaVacinasEHistorico`). Os dois testes passam, cada um do seu lado, mas juntos o fluxo falha. Como o RF06, o UC05 FA04 e o `docs/api.md` deixam editar os dados na mesma tela da devolução, quem muda é o back, junto com o teste `adotadoSoMudaStatusEPreservaVacinasEHistorico`.

## Revisão das prioridades 4 e 5 (regras de negócio críticas)

Revisão feita na issue #33: cada regra de interesse e de adoção e o teste que cobre. Os testes do back sem nome de arquivo ficam no `InteresseIntegrationTest`, e os marcados com **(novo)** entraram nessa revisão, no `model/RegrasDasEntidadesTest`.

### 4. Demonstrar interesse

| Caso | Back | Front |
| --- | --- | --- |
| Interesse certo, com o contato do protetor | `registraOInteresseEDevolveOContatoDoProtetor`, `quandoOProtetorEUmAbrigoOContatoEDoAbrigo` | `DemonstrarInteresse.test.jsx`: "envia o aceite e a triagem com o token e mostra os contatos do Protetor" |
| Sem o aceite do termo | `exigeOAceiteDoTermo` | "sem aceite e sem respostas, não envia e leva o foco pro primeiro erro" |
| Triagem incompleta | `exigeTodasAsRespostasDaTriagem` | O mesmo teste acima e "erro de campo vindo da API aparece na pergunta certa" |
| Melhor momento pra contato sem a opção de responder depois (RF15) | `oMomentoDeContatoNaoAceitaResponderDepois` | "a pergunta de contato não tem a opção de responder depois (RF15)" |
| Conta de Abrigo | `abrigoNaoDemonstraInteresse` | `PerfilAnimal.test.jsx`: "Abrigo não demonstra interesse"; `AuthContext.test.jsx`: "abrigo não entra nas telas que são só de pessoa física" |
| O próprio protetor | `oProtetorNaoDemonstraInteresseNoProprioAnimal` | `PerfilAnimal.test.jsx`: "o protetor que cadastrou vê o botão de editar" |
| Animal de outro estado (RF14) | `soDemonstraInteresseEmAnimalDoMesmoEstado` | "animal de outro estado: explica e volta pro perfil" |
| Animal já adotado | `animalAdotadoNaoRecebeInteresse` | "mostra a mensagem da API quando ela recusa (ex.: 409)" |
| Interesse duplicado | `naoDeixaDoisInteressesEmAndamentoNoMesmoAnimal` | "quem já tem interesse em andamento não vê o formulário" |
| Clique duplo no envio | Não se aplica | "trava o botão enquanto envia, sem registrar o interesse duas vezes" |
| Desistir (UC07 FA01) | `oCandidatoDesisteEOInteresseEApagado`, `soQuemDemonstrouOInteressePodeDesistir`, `interesseFinalizadoFicaNoHistorico` | `PerfilAnimal.test.jsx`: os três testes de desistência |

### 5. Aprovar e descontinuar

| Caso | Back | Front |
| --- | --- | --- |
| Aprovar deixa o animal Adotado e descontinua só os outros interesses ativos, com o motivo padrão (RF10) | `aprovarAdotaAnimalEDescontinuaApenasOsDemaisAtivos` | `InteressesRecebidos.test.jsx`: "aprovar pede confirmação, adota o animal e recolhe os outros interesses" |
| Duas aprovações ao mesmo tempo: só uma vale | `aprovacoesSimultaneasTemApenasUmVencedor`, `cadastroSimultaneoAAprovacaoNaoDeixaInteresseAtivo` | Não se aplica |
| Erro no meio da aprovação desfaz tudo | `falhaNaPersistenciaDesfazTodaAAprovacao` | Não se aplica |
| Descontinuar sem motivo é recusado | Pela API: `descontinuacaoManualExigeMotivoEGuardaTexto`. Na entidade: `interesseDescontinuadoSemMotivoNaoEGravado` e `interesseQueJaExisteNaoViraDescontinuadoSemMotivo` **(novo)**. No banco: `bancoRecusaInteresseDescontinuadoSemMotivo` **(novo)** | "descontinuar exige o motivo e envia junto" |
| Transição que não pode acontecer | `naoAlteraInteresseEncerrado`, `naoRetornaParaPendenteNemAprovaAnimalAdotado` | "cada status mostra só as ações que a máquina de estados permite" |
| Só o protetor do animal gerencia os interesses | `gerenciamentoExigeAutenticacaoEPropriedade` | Não se aplica |
| Animal adotado só deixa mudar o status (RF06) | `AnimalIntegrationTest`: `adotadoSoMudaStatusEPreservaVacinasEHistorico` | `EditarAnimal.test.jsx`: "só o status fica editável" |
| Remover o animal apaga os interesses dele (UC05 FA03) | `AnimalIntegrationTest`: `removerApagaDependentesMasPreservaContas` | `EditarAnimal.test.jsx`: "remove depois da confirmação, avisando dos interesses, e volta pra Meus animais" |
| O animal tem exatamente um protetor, pessoa ou abrigo | Na entidade: `animalNaoFicaComDoisProtetoresNemSemNenhum` **(novo)**. No banco: `bancoRecusaAnimalComDoisProtetoresOuSemNenhum` **(novo)** | Não se aplica |

### Por que testar a entidade e o banco

As regras de "descontinuar exige motivo" e "o animal tem um protetor só" estão em três lugares. O primeiro é o service: ele recusa o motivo vazio com a mensagem certa pra tela, e o protetor nem tem como vir errado, porque sai do token. Os outros dois são a entidade (`validarMotivo` e `validarProtetor`) e o banco, com um `CHECK` na tabela. Os testes da API passam pelo service, que barra antes, então nunca chegam nas outras duas barreiras. O `RegrasDasEntidadesTest` grava direto pelo repository e pelo SQL, sem o service, pra garantir que as outras duas barreiras também funcionam. Se um código novo esquecer a validação, o erro aparece aqui e não no banco de produção.

O `model/IntegridadeDoBancoTest` (issue #40) faz o mesmo com o resto do banco: os índices das consultas principais, o CPF, o CNPJ e o e-mail únicos, as chaves estrangeiras (nada de vacina ou interesse de animal que não existe) e os `CHECK` de peso e dose.

## Como escrever os testes

- **Quem escreve o código escreve o teste, no mesmo PR.**
- **Um teste por comportamento**, com o nome dizendo o que está sendo testado, em português: `naoPermiteCadastrarCpfRepetido`, `'abrigo não vê Minhas candidaturas'`.
- **Onde ficam:**
  - back: `backend/src/test/java/...`, espelhando o pacote da classe testada (o teste de `service/AnimalService` fica em `service/AnimalServiceTest`);
  - front: `frontend/tests/`, um arquivo por componente ou página (`Navbar.test.jsx`).
- **Testa o que a pessoa vê**, não o funcionamento interno. No front, prefira `getByRole` e `getByText`, que procuram a tela do jeito que um leitor de tela enxergaria.
- **Usem os modelos que já existem:** `RacaTest` (back) e `CardAnimal.test.jsx` e `Navbar.test.jsx` (front).

## Quem faz o quê

- **Cada squad** testa o próprio código.
- **O squad de Testes** revisa os PRs olhando os testes: se os casos das prioridades acima estão cobertos, e se não ficou só o "caminho feliz".
- Ao revisar um PR, confira no resumo do CI se a porcentagem não caiu.

## Metas por sprint

| Sprint | Meta |
| --- | --- |
| 2 | Testes do cadastro, do login e do CRUD de animal (prioridades 1 a 3) |
| 3 | Testes das regras de interesse (prioridades 4 e 5) |
| 4 | Fechar os 70% no back e no front. A partir daqui, o CI recusa PR que deixe a cobertura de linhas abaixo de 70% (feito na #41) |
| 5 | Rodar tudo uma última vez e guardar o relatório final como prova |