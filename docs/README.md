# Documentação do Adota Aqui

O que tem em cada lugar desta pasta:

| Onde                     | O quê                                                                                                                                                      |
| ------------------------ | ---------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `api.md`                 | Contrato da API: todos os endpoints, com entrada, saída, quem pode acessar e os erros. É o combinado entre front e back                                    |
| `deploy.md`              | Onde cada parte roda, as variáveis de ambiente, o passo a passo pra subir tudo do zero, a conferência do banco de produção e o checklist da apresentação   |
| `arquitetura.md`         | Como o sistema é organizado (front, back, banco e o caminho dos dados)                                                                                     |
| `funcionalidades.md`     | O que já funciona, tela por tela: o que faz, como funciona, regras, código, testes e print                                                                 |
| `aspectos-relevantes.md` | As decisões de design, os desafios técnicos e as soluções, e o que ficou de fora do MVP                                                                    |
| `prints/`                | Os prints usados no `funcionalidades.md`                                                                                                                   |
| `plano-de-testes.md`     | Como a equipe testa: ferramentas, cobertura, prioridades e quais testes cobrem cada caso                                                                   |
| `casos-de-teste.md`      | Os casos de teste do ponto de vista de quem usa o site, com o que já é automático e o que é manual                                                         |
| `relatorio-de-testes.md` | O resultado final dos testes e da cobertura, e como guardar a prova dos 70%                                                                                |
| `requisitos/`            | Especificação de Requisitos (ERS) e Casos de Uso                                                                                                           |
| `banco/`                 | SQL pra rodar no banco de produção (Neon): `integridade.sql` cria as regras que o Hibernate não cria, e `conferencia.sql` compara o Neon com o banco local |
| `diagramas/`             | DER conceitual e lógico, diagrama de classes, diagrama de fluxo, dicionário de domínios e máquinas de estado                                               |
| `atas/`                  | Atas das reuniões                                                                                                                                          |

Caso haja mudanças no sistema, é necessário atualizar também o documento.
