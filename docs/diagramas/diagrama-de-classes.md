# Diagrama de classes com métodos

As classes do pacote `model` do back-end (as entidades que viram tabelas), com atributos, métodos e relacionamentos, do jeito que estão no código.

- Arquivo editável: `diagrama-de-classes-metodos.drawio` (abre no draw.io, app.diagrams.net).
- Pra entregar ou imprimir: `diagrama-de-classes-metodos.pdf` (duas páginas: as classes e as enumerações) e `diagrama-de-classes-metodos.png`, exportados do draw.io.
- O diagrama conceitual de setembro continua em `diagrama-de-classes-adota-aqui.pdf`.
- Os valores de cada enumeração estão no [dicionário de domínios](diagramas-adota-aqui.md#2-dicionário-de-domínios).

## Como ler

- `-` é privado e `+` é público. Método sublinhado é `static`.
- Getters e setters ficam de fora: só aparecem os métodos que têm alguma regra.
- **Composição** (losango cheio): a parte não existe sem o todo. Vacinas e interesses são apagados junto com o animal, e o endereço é guardado dentro da própria tabela de `usuario` e de `abrigo` (por isso o `<<Embeddable>>`).
- **Multiplicidade**: `0..1` é "nenhum ou um", `0..*` é "nenhum ou vários". Cada animal tem exatamente um protetor, Usuario **ou** Abrigo (é o `{xor}` entre as duas linhas "cadastra"), e o banco garante isso com um `CHECK`.
- **Local do animal**: `cidade` e `estado` do Animal são onde ele está, que pode ser diferente do `Endereco` do protetor. É o estado do animal que a vitrine compara com o estado de quem está logado (RF14).

## O que cada método faz

| Classe | Método | O que faz |
| --- | --- | --- |
| Animal | `preencherLocalSeFaltar()` | Animal sem cidade e estado fica no endereço de quem cadastrou. Roda no cadastro e, quando o back sobe, nos animais antigos (`LocalDosAnimaisAntigos`) |
| Animal | `adicionarVacina()` e `removerVacina()` | Mexem na lista de vacinas já ligando ou desligando a vacina do animal |
| Animal | `antesDeCriar()` e `antesDeAtualizar()` | Rodam antes de salvar (`@PrePersist` e `@PreUpdate`). Os dois chamam o `validarProtetor()`, e o de criar também chama o `preencherLocalSeFaltar()` |
| Animal | `validarProtetor()` | Recusa animal sem protetor ou com os dois |
| Interesse | `aoCriar()` | Roda antes de salvar a primeira vez: preenche a data e hora e confere o motivo |
| Interesse | `aoAtualizar()` e `validarMotivo()` | Recusam um interesse Descontinuado sem motivo (RF10) |
| Raca | `pertenceA()` e `listarPorEspecie()` | Conferem se a raça é da espécie escolhida e listam as raças de uma espécie (`GET /api/racas`) |

## Diagrama

![Diagrama de classes com métodos](diagrama-de-classes-metodos.png)

## Como atualizar

Mudou uma entidade do back (atributo novo, método com regra, relacionamento)? Abre o `.drawio`, atualiza a classe e exporta de novo o PNG e o PDF, tudo no mesmo PR.

Na mudança do local do animal (novembro), o `.drawio` ganhou `cidade`, `estado` e `cadastradoEm` no Animal, os métodos novos e o `aprovadoEm` no Interesse. O PNG e a primeira página do PDF foram ajustados direto na imagem, sem passar pelo draw.io. Na próxima vez que alguém abrir o `.drawio`, vale exportar os dois de novo pra voltar a ter o PDF em vetor.
