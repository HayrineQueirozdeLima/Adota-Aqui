# Relatório final de testes

Fechamento da issue #47: todos os testes rodados uma última vez e a cobertura guardada como prova do mínimo de 70% (RNF04). O [plano de testes](plano-de-testes.md) explica como a equipe testa, e os [casos de teste](casos-de-teste.md) dizem o que precisa funcionar do ponto de vista de quem usa o site.

## Resultado

Medido pelo CI do GitHub na `dev`, no commit `99dc6d6` (24/10/2026, depois da #101): [execução no GitHub Actions](https://github.com/HayrineQueirozdeLima/Adota-Aqui/actions/runs/40125119028).

|                          | Back (JUnit 5 e JaCoCo) | Front (Jest e Testing Library) | Mínimo do curso |
| ------------------------ | ----------------------- | ------------------------------ | --------------- |
| Testes                   | 130, em 15 classes      | 207, em 25 arquivos            | -               |
| Linhas cobertas          | **95,1%**               | **95,09%**                     | 70%             |
| Ramos cobertos (if/else) | 84,2%                   | 87,92%                         | -               |
| Resultado                | Todos passando          | Todos passando                 | -               |

A quantidade de testes já conta os da #44 e da #98. Depois do último PR da `dev` pra `main`, atualize a tabela com os números do resumo daquela execução (passo a passo abaixo).

O CI barra qualquer PR que deixe a cobertura de linhas abaixo de 70%, no back (JaCoCo) e no front (Jest). Então todo commit que está na `dev` e na `main` já passou por essa régua.

## O que os testes cobrem

O curso pede testes dos componentes críticos e dos casos de uso principais, como o CRUD e a autenticação. A divisão abaixo é por funcionalidade:

| Funcionalidade                                                | Back                                                                                                                           | Front                                                                                                                                                                      |
| ------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------ | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Cadastro, login e sessão (RF01 a RF03)                        | `AutenticacaoIntegrationTest` (18)                                                                                             | `Cadastro.test.jsx` (13), `Login.test.jsx` (7), `AuthContext.test.jsx` (6)                                                                                                 |
| CRUD de animal e fotos (RF04 a RF06, RF16)                    | `AnimalIntegrationTest` (14), `FotoIntegrationTest` (6)                                                                        | `CadastroAnimal.test.jsx` (11), `EditarAnimal.test.jsx` (10), `FormularioAnimal.test.jsx` (7), `MeusAnimais.test.jsx` (7)                                                  |
| Vitrine, filtros e perfil do animal (RF07, RF14)              | `RacaIntegrationTest` (4)                                                                                                      | `VitrineAnimais.test.jsx` (14), `PerfilAnimal.test.jsx` (16), `CardAnimal.test.jsx` (6), `Home.test.jsx` (3)                                                               |
| Interesse, aprovação e candidaturas (RF08 a RF10, RF13, RF15) | `InteresseIntegrationTest` (33)                                                                                                | `DemonstrarInteresse.test.jsx` (11), `InteressesRecebidos.test.jsx` (18), `MeusInteresses.test.jsx` (14)                                                                   |
| Perfil da conta (RF17)                                        | `PerfilIntegrationTest` (12)                                                                                                   | `Perfil.test.jsx` (20)                                                                                                                                                     |
| Regras do banco e dos dados                                   | `IntegridadeDoBancoTest` (6), `RegrasDasEntidadesTest` (6), `DtoValidationTest` (8), `RacaTest` (4), `DocumentoUtilsTest` (5)  | `Validacoes.test.jsx` (11), `triagem.test.js` (4), `rotulos.test.js` (10)                                                                                                  |
| Erros, deploy e o resto da tela                               | `ErroApiIntegrationTest` (7), `GlobalExceptionHandlerTest` (2), `ConferenciaDoDeployTest` (4), `AdotaAquiApplicationTests` (1) | `App.test.jsx` (4), `Navbar.test.jsx` (4), `Rodape.test.jsx` (1), `Botao.test.jsx` (2), `BotaoTema.test.jsx` (3), `RolarParaOTopo.test.jsx` (4), `carregando.test.jsx` (1) |

Os testes do back que terminam em `IntegrationTest` sobem o Spring inteiro, com o banco H2 em memória, e chamam os endpoints pelo MockMvc: cada pedido passa pelo Spring Security, pelo token, pelas validações e pelo banco, como os pedidos do site. Os do front usam uma API de mentira (`tests/utils/apiFalsa.js`) e conferem o que é trabalho da tela: mandar o pedido certo, mostrar a resposta e cada mensagem de erro.

Dos 3 casos manuais dos casos de teste, a responsividade (CT-NAV-02) foi conferida no bug bash da #44, descrito no plano de testes, junto com o foco visível pelo teclado em todas as telas (parte do CT-NFR-06). Preencher e enviar os formulários só pelo teclado e o tempo de carregamento (CT-NFR-01, pelo Lighthouse do Chrome, no site publicado) ficam pra rodada manual da véspera.

## Como rodar e guardar a prova

1. Rode na sua máquina, se quiser ver antes do CI:

   ```bash
   cd backend && mvn verify              # testes + JaCoCo + a régua de 70%
   cd ../frontend && npm run test:coverage
   ```

   O relatório do back fica em `backend/target/site/jacoco/index.html` e o do front em `frontend/coverage/lcov-report/index.html`.

2. Depois do último PR da `dev` pra `main`, abra no GitHub a aba Actions e a execução do CI desse merge.
3. No resumo (Summary) estão a cobertura do back e a do front. Atualize a tabela "Resultado" com esses números, o commit e o link da execução.
4. Ainda na execução, em Artifacts, baixe `cobertura-backend` e `cobertura-frontend`. Abra o `index.html` de cada um e tire um print da primeira tela, com o total.
5. Salve os prints em `docs/prints/cobertura-back.png` e `docs/prints/cobertura-front.png` e coloque aqui embaixo. O GitHub apaga os artefatos depois de 90 dias, e o print fica no repositório.

<!-- Depois do passo 5:
![Cobertura do back](prints/cobertura-back.png)
![Cobertura do front](prints/cobertura-front.png)
-->
