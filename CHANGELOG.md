# Histórico de versões

Cada vez que a `dev` entra na `main` (o que está no ar), sai uma versão nova, com uma tag no Git (`v1.3.0`, por exemplo) e uma página em [Releases](https://github.com/HayrineQueirozdeLima/Adota-Aqui/releases). O número segue a ideia do versionamento semântico: o do meio sobe quando entra funcionalidade nova, e o último, quando é só correção.

Cada item tem o número do PR. É por ele que dá pra chegar na issue, nos commits e na discussão de cada mudança.

## 1.4.0 (a publicar, antes da apresentação de 16/11/2026)

O que foi feito depois da entrega, pra apresentação:

- Mapa de clínicas veterinárias perto de você, em qualquer cidade do Brasil (#135)
- Compartilhar o animal no WhatsApp e o selo "Esperando há..." pra quem está há mais tempo no site, com a ordem "Esperando há mais tempo" na vitrine (#137)
- Agenda de feiras de adoção, que só abrigo divulga (#139)
- Patinhas no caminho do mouse e trilha de patas nas faixas roxas (#141)
- Observatório da adoção, com os números do site por estado e dados públicos do IBGE (#143)
- Ajudas com IA: "Escrever com IA" no cadastro do animal e "Me ajuda a escolher" (#145)
- Topo fixo com as páginas do site, "Minha área" pra quem está logado, os recursos novos na Home e o mapa de clínicas buscando "veterinário" (#147)
- Swagger com a documentação da API, Docker Compose pra rodar tudo com um comando e este histórico de versões (#149)
- Foto de perfil pra pessoa e abrigo, no topo, nos cards dos animais e na página de abrigos e protetores (#151)
- Animações na Home e no Quem somos: blocos que sobem ao rolar, números que contam até o valor e a trilha da história que fica laranja conforme a leitura (#155)

## 1.3.0 (12/11/2026)

- Quem somos com o desenho da ponte, fotos próprias e animações (#132)

## 1.2.1 (12/11/2026)

- As listas de filtro começam em "todos", e a raça "Outra" aparece como "Outras raças" (#130)

## 1.2.0 (11/11/2026)

- Local próprio do animal (cidade e estado), definido no cadastro e editável (#125, #126)
- Seta das listas de opções afastada da borda (#127)

## 1.1.0 (04/11/2026)

- Página Quem somos e a chamada pra ela no fim da Home (#122)
- Página de abrigos e protetores, com filtro por tipo, estado, cidade e nome (#121)
- Botões de salvar no fim do formulário no celular (#120)

## 1.0.1 (02/11/2026)

- Cards dos animais com foto quadrada e mais cards por linha (#114)

## 1.0.0 (01/11/2026): entrega do projeto

- Minhas candidaturas e Meu perfil, com edição dos dados e troca de senha (#101)
- Devolução do animal e as correções do bug bash (#102)
- Histórias de adoção, contadas por quem adotou (#110)
- Blog de dicas dos protetores (#112)
- Números do site na página inicial (#108)
- Vitrine em páginas, e a foto apagada do S3 quando sai do animal (#106)
- Documentação final e relatório de testes (#103, #104)

## 0.3.0 (20/10/2026): MVP

- Cadastro, edição e remoção de animal, e a tela Meus animais (#68, #84)
- Fotos dos animais no Amazon S3 (#77, #78)
- Perfil do animal e o fluxo de demonstrar interesse, com termo, triagem e contatos (#80, #81, #82, #86)
- Painel de interesses recebidos (#85)
- Vitrine ligada na API, com busca e filtros (#76, #79, #88)
- Erros da API no mesmo formato, em português (#71)
- Integridade do banco com índices e constraints (#94)
- Responsividade, tema claro e escuro e polimento visual (#92, #93)
- Deploy no Render, Netlify e Neon, e CI com cobertura mínima de 70% (#66, #83, #99)
- Arquitetura, funcionalidades e revisão da documentação (#87, #90, #97)

## 0.2.0 (30/09/2026)

- Autenticação com JWT: cadastro de pessoa e de abrigo, e login por CPF ou CNPJ (#57, #60)
- Primeira versão da vitrine (#61)
- Cobertura de testes e plano de testes (#56)
- A `dev` como branch padrão (#55)

## 0.1.0 (27/09/2026)

- Entidades conforme o DER lógico e a documentação inicial do projeto (#52)
- Rotas do front e componentes-base a partir do Figma (#54)
