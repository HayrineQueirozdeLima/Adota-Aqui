-- Integridade do banco 
-- Rodar no SQL Editor do Neon, no banco de produção. Pode rodar mais de uma vez, não estraga nada.
--
-- Por que precisa: o Hibernate (ddl-auto=update) cria os índices novos sozinho no próximo deploy,
-- mas não acrescenta CHECK numa tabela que já existe. Os dois CHECKs da parte 2 só chegam no Neon por aqui.

-- 1. Índices das consultas que mais rodam (os mesmos das entidades)
create index if not exists idx_animal_status_adocao on animal (status_adocao);
create index if not exists idx_animal_usuario on animal (usuario_id);
create index if not exists idx_animal_abrigo on animal (abrigo_id);
create index if not exists idx_interesse_usuario_animal on interesse (usuario_id, animal_id);
create index if not exists idx_interesse_animal_status on interesse (animal_id, status_andamento);
create index if not exists idx_vacina_animal on vacina (animal_id);

-- 2. Valores que o banco recusa (os mesmos @Check das entidades Animal e Vacina)
alter table animal drop constraint if exists animal_peso_check;
alter table animal add constraint animal_peso_check check (peso is null or peso > 0);
alter table vacina drop constraint if exists vacina_dose_check;
alter table vacina add constraint vacina_dose_check check (dose is null or dose >= 1);

-- 3. Conferência: as regras que o banco garante, tabela por tabela.
-- Tem que aparecer: chave primária em todas, unique no cpf, cnpj e e-mail, as chaves estrangeiras
-- (animal, animal_foto, vacina e interesse) e os CHECKs (um protetor só, motivo, peso, dose e os enums)
select conrelid::regclass as tabela, conname as nome, pg_get_constraintdef(oid) as regra
from pg_constraint
where conrelid::regclass::text in ('usuario', 'abrigo', 'animal', 'animal_foto', 'vacina', 'interesse')
order by 1, 2;

-- E os índices: os seis da parte 1, mais os que o PostgreSQL cria sozinho pras chaves primárias e unique
select tablename as tabela, indexname as indice, indexdef as definicao
from pg_indexes
where schemaname = 'public'
order by 1, 2;