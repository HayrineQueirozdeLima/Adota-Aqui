# Front-end — Adota Aqui

React + Vite + Tailwind. Se você é do squad de front, começa por aqui.

## Antes de mexer em qualquer coisa

1. As telas estão no Figma. Monte igual ao que está lá.
2. Leia o `docs/api.md`. Ali estão todos os endpoints, com o formato exato do JSON que a API recebe e devolve.

Não precisa esperar o back ficar pronto. Monte a tela com dados de exemplo no mesmo formato do `api.md` e, quando o endpoint real estiver pronto, é só trocar pela chamada de verdade.

## Onde fica cada coisa

```
src/
├── pages/        uma pasta por tela do Figma (Login, Cadastro, Vitrine...)
├── components/   o que se repete em várias telas (botão, card de animal, navbar)
├── services/     as chamadas pra API. Nenhuma tela chama a API direto, sempre por aqui
├── contexts/     dados compartilhados entre telas (ex.: quem está logado e o token)
├── hooks/        hooks personalizados
├── routes/       as rotas das páginas (React Router)
├── styles/       CSS global
├── assets/       imagens, ícones e logo exportados do Figma
└── utils/        funções de apoio (tirar máscara de CPF, formatar data...)
```

As rotas que cada tela vai ter estão no documento de diagramas (seção "Tabela de rotas").

## Cores

As cores do projeto já estão no `tailwind.config.js`. Use as classes, nunca o código hexadecimal solto no meio do código:

| Classe | Cor | Uso |
| --- | --- | --- |
| `roxo` | #4A2D73 | marca. Nunca como fundo de botão |
| `terracota` | #C1502E | botão principal |
| `ouro` | #C99A3D | detalhes e selos secundários |
| `pinho` | #16785F | selo de "disponível" |
| `vermelho` | #A63D35 | erro e urgência |

Exemplo: `className="bg-terracota text-white"`.

## Alguns combinados com a API

- CPF, CNPJ, CEP e telefone vão **só com números**. A máscara é só visual; tira ela antes de enviar.
- O token do login vai no cabeçalho `Authorization: Bearer <token>`.
- Se a API responder `401`, a sessão acabou: manda a pessoa pro login.
- Lista vazia vem como `[]` com status 200, não é erro. Mostra a mensagem de "nenhum resultado".
- Todo erro vem no mesmo formato, com uma `mensagem` pronta pra exibir e, nos erros de formulário, um `campos` com o erro de cada campo.

## Rodando

```bash
npm install
npm run dev
```

## Testes

```bash
npm test
```

A meta do curso é **70% de cobertura**, então o teste vem junto com o componente.
