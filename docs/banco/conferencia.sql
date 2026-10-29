-- Conferência do banco de produção (issue #46)
-- Só lê: não muda nada no banco. Pode rodar quantas vezes quiser.
--
-- Pra que serve: o Hibernate (ddl-auto=update) cria tabela e coluna nova sozinho, mas não muda
-- coluna que já existe (tamanho ou tipo), não cria CHECK em tabela que já existe e não atualiza a
-- lista de valores aceitos de um enum. O Neon vem sendo atualizado assim desde o primeiro deploy, então pode
-- ter ficado diferente do banco que as entidades criam hoje.
--
-- Como usar (o passo a passo completo está no docs/deploy.md, seção "Conferir o banco de produção"):
--   1. Rode no banco local, recém-criado pelo back a partir das entidades de hoje
--   2. Rode no Neon, no SQL Editor
--   3. Compare as 4 linhas de resumo do fim. Se as impressões (md5) baterem, os dois bancos têm as
--      mesmas tabelas, colunas, regras e índices. Se uma parte não bater, compare só as linhas dela
--
-- Os nomes que o Hibernate e o PostgreSQL inventam (das chaves estrangeiras, dos unique e dos índices)
-- ficam de fora da comparação: o que importa é o que a regra garante, não o nome dela.

with colunas as (
    select 'colunas' as parte,
           c.table_name || '.' || c.column_name || ' ' || c.data_type
               || coalesce('(' || c.character_maximum_length || ')', '')
               || case when c.is_nullable = 'NO' then ' not null' else '' end as linha
    from information_schema.columns c
    where c.table_schema = 'public'
),
regras as (
    select 'regras' as parte,
           t.relname || ' '
               || case r.contype
                      when 'p' then 'chave primária'
                      when 'f' then 'chave estrangeira'
                      when 'u' then 'unique'
                      when 'c' then 'check'
                      else r.contype::text
                  end
               || ' ' || pg_get_constraintdef(r.oid) as linha
    from pg_constraint r
    join pg_class t on t.oid = r.conrelid
    join pg_namespace n on n.oid = t.relnamespace
    where n.nspname = 'public'
),
indices as (
    select 'indices' as parte,
           tablename || ' ' || regexp_replace(indexdef, ' INDEX \S+ ON ', ' INDEX ON ') as linha
    from pg_indexes
    where schemaname = 'public'
),
tudo as (
    select * from colunas
    union all select * from regras
    union all select * from indices
),
resumo as (
    select 'resumo' as parte,
           parte || ': ' || count(*) || ' itens, impressão ' || md5(string_agg(linha, E'\n' order by linha)) as linha
    from tudo
    group by parte
    union all
    select 'resumo',
           'tudo: ' || count(*) || ' itens, impressão ' || md5(string_agg(parte || ' ' || linha, E'\n' order by parte, linha))
    from tudo
)
select parte, linha
from (
    select parte, linha, 1 as ordem from tudo
    union all
    select parte, linha, 2 from resumo
) lista
order by ordem, parte, linha;