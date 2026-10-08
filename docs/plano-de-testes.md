# Plano de testes do Adota Aqui

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

**Sem rodar nada:** o CI gera os dois relatórios a cada push. Na aba **Actions** do GitHub, abre a execução mais recente e baixa `cobertura-backend` ou `cobertura-frontend` em **Artifacts**.

## O que entra na conta

Fica **de fora** da cobertura só o que não tem lógica pra testar:

- `AdotaAquiApplication.java` (só liga a aplicação);
- a pasta `dto/` do back (só carrega dados de um lado pro outro);
- o `main.jsx` e a pasta `mocks/` do front (inicialização e dados de exemplo).

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
- Ao revisar um PR, confira no relatório de cobertura do CI se a porcentagem não caiu.

## Metas por sprint

| Sprint | Meta |
| --- | --- |
| 2 | Testes do cadastro, do login e do CRUD de animal (prioridades 1 a 3) |
| 3 | Testes das regras de interesse (prioridades 4 e 5) |
| 4 | Fechar os 70% no back e no front. A partir daqui, o CI passa a recusar PR que deixe a cobertura abaixo de 70% |
| 5 | Rodar tudo uma última vez e guardar o relatório final como prova |
