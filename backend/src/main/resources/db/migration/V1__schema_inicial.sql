-- =============================================================
-- Adota Aqui - Schema inicial
-- Derivado do Diagrama de Classes Conceitual e da ERS
-- Chaves primárias em UUID, geradas pela aplicação
-- =============================================================

-- -------------------------------------------------------------
-- USUARIO (pessoa física - CPF)
-- Endereço é composição 1..1, armazenado nas colunas da própria tabela
-- -------------------------------------------------------------
CREATE TABLE usuario (
    id          UUID PRIMARY KEY,
    cpf         VARCHAR(11)  NOT NULL,
    nome        VARCHAR(150) NOT NULL,
    email       VARCHAR(150) NOT NULL,
    telefone    VARCHAR(20)  NOT NULL,
    senha       VARCHAR(100) NOT NULL,
    cep         VARCHAR(8)   NOT NULL,
    estado      VARCHAR(2)   NOT NULL,
    cidade      VARCHAR(100) NOT NULL,
    logradouro  VARCHAR(150),
    numero      VARCHAR(10)  NOT NULL,
    bairro      VARCHAR(100),
    CONSTRAINT uk_usuario_cpf   UNIQUE (cpf),
    CONSTRAINT uk_usuario_email UNIQUE (email)
);

-- -------------------------------------------------------------
-- ABRIGO (instituição - CNPJ)
-- -------------------------------------------------------------
CREATE TABLE abrigo (
    id            UUID PRIMARY KEY,
    cnpj          VARCHAR(14)  NOT NULL,
    nome          VARCHAR(150) NOT NULL,
    razao_social  VARCHAR(200) NOT NULL,
    email         VARCHAR(150) NOT NULL,
    telefone      VARCHAR(20)  NOT NULL,
    senha         VARCHAR(100) NOT NULL,
    cep           VARCHAR(8)   NOT NULL,
    estado        VARCHAR(2)   NOT NULL,
    cidade        VARCHAR(100) NOT NULL,
    logradouro    VARCHAR(150),
    numero        VARCHAR(10)  NOT NULL,
    bairro        VARCHAR(100),
    CONSTRAINT uk_abrigo_cnpj  UNIQUE (cnpj),
    CONSTRAINT uk_abrigo_email UNIQUE (email)
);

-- -------------------------------------------------------------
-- ANIMAL
-- Cadastrado por um Usuario OU por um Abrigo ({xor} no diagrama)
-- -------------------------------------------------------------
CREATE TABLE animal (
    id                   UUID PRIMARY KEY,
    especie              VARCHAR(30)  NOT NULL,
    nome                 VARCHAR(100) NOT NULL,
    raca                 VARCHAR(60)  NOT NULL,
    porte                VARCHAR(20)  NOT NULL,
    sexo                 VARCHAR(10)  NOT NULL,
    peso                 DOUBLE PRECISION,
    convivencia_crianca  VARCHAR(20)  NOT NULL DEFAULT 'NAO_TESTADO',
    convivencia_gato     VARCHAR(20)  NOT NULL DEFAULT 'NAO_TESTADO',
    convivencia_cao      VARCHAR(20)  NOT NULL DEFAULT 'NAO_TESTADO',
    energia              VARCHAR(20)  NOT NULL,
    data_nasc_estimada   DATE         NOT NULL,
    is_castrado          BOOLEAN      NOT NULL DEFAULT FALSE,
    historia             VARCHAR(500) NOT NULL,
    status_adocao        VARCHAR(20)  NOT NULL DEFAULT 'DISPONIVEL',
    usuario_id           UUID REFERENCES usuario (id),
    abrigo_id            UUID REFERENCES abrigo (id),
    CONSTRAINT ck_animal_protetor_xor
        CHECK ((usuario_id IS NULL) <> (abrigo_id IS NULL)),
    CONSTRAINT ck_animal_convivencia_crianca
        CHECK (convivencia_crianca IN ('CONVIVE_BEM', 'NAO_CONVIVE_BEM', 'NAO_TESTADO')),
    CONSTRAINT ck_animal_convivencia_gato
        CHECK (convivencia_gato IN ('CONVIVE_BEM', 'NAO_CONVIVE_BEM', 'NAO_TESTADO')),
    CONSTRAINT ck_animal_convivencia_cao
        CHECK (convivencia_cao IN ('CONVIVE_BEM', 'NAO_CONVIVE_BEM', 'NAO_TESTADO')),
    CONSTRAINT ck_animal_sexo
        CHECK (sexo IN ('FEMEA', 'MACHO')),
    CONSTRAINT ck_animal_energia
        CHECK (energia IN ('MAIS_ANIMADO', 'MAIS_CALMO')),
    CONSTRAINT ck_animal_status_adocao
        CHECK (status_adocao IN ('DISPONIVEL', 'ADOTADO'))
);

-- Fotos do animal (pictures: List<String>) - somente as URLs
CREATE TABLE animal_pictures (
    animal_id  UUID         NOT NULL REFERENCES animal (id) ON DELETE CASCADE,
    url        VARCHAR(500) NOT NULL
);

-- -------------------------------------------------------------
-- VACINA (composição com Animal: 1 animal -> 0..* vacinas)
-- -------------------------------------------------------------
CREATE TABLE vacina (
    id              UUID PRIMARY KEY,
    nome            VARCHAR(100) NOT NULL,
    dose            INTEGER,
    data_aplicacao  DATE,
    animal_id       UUID NOT NULL REFERENCES animal (id) ON DELETE CASCADE
);

-- -------------------------------------------------------------
-- INTERESSE (Usuario demonstra interesse em um Animal + triagem RF15)
-- -------------------------------------------------------------
CREATE TABLE interesse (
    id                     UUID PRIMARY KEY,
    data                   TIMESTAMP   NOT NULL,
    status_andamento       VARCHAR(20) NOT NULL DEFAULT 'PENDENTE',
    motivo_descontinuacao  VARCHAR(500),
    moradia                VARCHAR(60) NOT NULL,
    criancas               VARCHAR(60) NOT NULL,
    tempo_sozinho          VARCHAR(60) NOT NULL,
    outros_animais         VARCHAR(60) NOT NULL,
    programacao_viagem     VARCHAR(60) NOT NULL,
    momento_contato        VARCHAR(20) NOT NULL,
    usuario_id             UUID NOT NULL REFERENCES usuario (id),
    -- UC05: remover o animal remove também os interesses dele
    animal_id              UUID NOT NULL REFERENCES animal (id) ON DELETE CASCADE,
    CONSTRAINT ck_interesse_status
        CHECK (status_andamento IN ('PENDENTE', 'EM_CONTATO', 'APROVADO', 'DESCONTINUADO')),
    -- RF10: toda descontinuação exige motivo
    CONSTRAINT ck_interesse_motivo_descontinuacao
        CHECK (status_andamento <> 'DESCONTINUADO' OR motivo_descontinuacao IS NOT NULL),
    CONSTRAINT ck_interesse_moradia
        CHECK (moradia IN ('CASA_COM_QUINTAL', 'CASA_SEM_QUINTAL', 'APARTAMENTO_TELADO',
                           'APARTAMENTO_NAO_TELADO', 'PREFIRO_TRATAR_COM_O_PROTETOR')),
    CONSTRAINT ck_interesse_criancas
        CHECK (criancas IN ('SIM', 'NAO', 'PREFIRO_RESPONDER_DIRETAMENTE_AO_PROTETOR')),
    CONSTRAINT ck_interesse_tempo_sozinho
        CHECK (tempo_sozinho IN ('NAO_FICARA_SOZINHO_EM_CASA', 'ATE_2_HORAS', 'ATE_4_HORAS',
                                 'ATE_8_HORAS', 'MAIS_DE_8_HORAS',
                                 'PREFIRO_RESPONDER_DIRETAMENTE_AO_PROTETOR')),
    CONSTRAINT ck_interesse_outros_animais
        CHECK (outros_animais IN ('NAO_TENHO_OUTROS_ANIMAIS_EM_CASA', 'SIM_GATOS', 'SIM_CACHORROS',
                                  'SIM_GATOS_E_CACHORROS', 'SIM_OUTRAS_ESPECIES',
                                  'PREFIRO_RESPONDER_DIRETAMENTE_AO_PROTETOR')),
    CONSTRAINT ck_interesse_programacao_viagem
        CHECK (programacao_viagem IN ('LEVO_O_ANIMAL_COMIGO', 'DEIXO_NOS_CUIDADOS_DE_ALGUEM_DE_CONFIANCA',
                                      'PREFIRO_RESPONDER_DIRETAMENTE_AO_PROTETOR')),
    -- Contato é a única categoria sem opção "prefiro tratar com o Protetor" (RF15)
    CONSTRAINT ck_interesse_momento_contato
        CHECK (momento_contato IN ('MANHA', 'TARDE', 'NOITE', 'QUALQUER_HORARIO'))
);

-- -------------------------------------------------------------
-- Índices para as consultas mais frequentes
-- -------------------------------------------------------------
CREATE INDEX idx_usuario_estado       ON usuario (estado);          -- RF14
CREATE INDEX idx_abrigo_estado        ON abrigo (estado);           -- RF14
CREATE INDEX idx_animal_status        ON animal (status_adocao);    -- RF07
CREATE INDEX idx_animal_usuario       ON animal (usuario_id);
CREATE INDEX idx_animal_abrigo        ON animal (abrigo_id);
CREATE INDEX idx_animal_pictures      ON animal_pictures (animal_id);
CREATE INDEX idx_vacina_animal        ON vacina (animal_id);
CREATE INDEX idx_interesse_animal     ON interesse (animal_id);     -- UC08
CREATE INDEX idx_interesse_usuario    ON interesse (usuario_id);
