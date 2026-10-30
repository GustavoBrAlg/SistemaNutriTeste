-- ===================================================
-- Esquema de Banco de Dados: Sistema de Gestão Escolar
-- Ambiente: Vercel Postgres / PostgreSQL
-- ===================================================

-- 1. TABELA DOCENTE
CREATE TABLE IF NOT EXISTS docente (
    nif INT PRIMARY KEY,
    nome VARCHAR(150) NOT NULL
);

-- 2. TABELA ALUNO
CREATE TABLE IF NOT EXISTS aluno (
    matricula INT PRIMARY KEY,
    nome VARCHAR(150) NOT NULL
);

-- 3. TABELA TURMA
CREATE TABLE IF NOT EXISTS turma (
    codigo INT PRIMARY KEY,
    nome_curso VARCHAR(150) NOT NULL,
    quantidade_maxima INT NOT NULL,
    empresa BOOLEAN NOT NULL DEFAULT FALSE,
    nome_empresa VARCHAR(150),
    turno VARCHAR(20) NOT NULL,
    data_inicio DATE NOT NULL,
    data_fim DATE NOT NULL
);

-- 4. TABELA PROFESSOR_TURMA (Relacionamento N-N: Docente <-> Turma)
CREATE TABLE IF NOT EXISTS professor_turma (
    id INT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    codigo_turma INT NOT NULL,
    nif_docente INT NOT NULL,
    status_diario VARCHAR(50) NOT NULL,
    CONSTRAINT fk_professor_turma_turma FOREIGN KEY (codigo_turma) 
        REFERENCES turma (codigo) ON DELETE CASCADE,
    CONSTRAINT fk_professor_turma_docente FOREIGN KEY (nif_docente) 
        REFERENCES docente (nif) ON DELETE CASCADE
);

-- 5. TABELA ALUNO_TURMA (Relacionamento N-N: Aluno <-> Turma)
CREATE TABLE IF NOT EXISTS aluno_turma (
    id INT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    codigo_turma_aluno INT NOT NULL,
    matricula_aluno INT NOT NULL,
    status_final VARCHAR(50) NOT NULL,
    CONSTRAINT fk_aluno_turma_turma FOREIGN KEY (codigo_turma_aluno) 
        REFERENCES turma (codigo) ON DELETE CASCADE,
    CONSTRAINT fk_aluno_turma_aluno FOREIGN KEY (matricula_aluno) 
        REFERENCES aluno (matricula) ON DELETE CASCADE
);

-- Índices para otimização de junções e buscas
CREATE INDEX IF NOT EXISTS idx_prof_turma_cod ON professor_turma (codigo_turma);
CREATE INDEX IF NOT EXISTS idx_prof_turma_nif ON professor_turma (nif_docente);
CREATE INDEX IF NOT EXISTS idx_aluno_turma_cod ON aluno_turma (codigo_turma_aluno);
CREATE INDEX IF NOT EXISTS idx_aluno_turma_mat ON aluno_turma (matricula_aluno);
