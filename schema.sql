-- ===================================================
-- Esquema de Banco de Dados: Sistema de Gestão Escolar & Diário Eletrônico
-- Ambiente: Vercel Postgres / Neon / PostgreSQL
-- ===================================================

-- 1. TABELA DOCENTE (Adicionado campo senha para login)
CREATE TABLE IF NOT EXISTS docente (
    nif INT PRIMARY KEY,
    nome VARCHAR(150) NOT NULL,
    senha VARCHAR(255) NOT NULL DEFAULT '123456'
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
    status_diario VARCHAR(50) NOT NULL DEFAULT 'Em Andamento',
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
    status_final VARCHAR(50) NOT NULL DEFAULT 'Cursando',
    nota NUMERIC(4,2) DEFAULT NULL,
    presencas INT NOT NULL DEFAULT 0,
    total_aulas INT NOT NULL DEFAULT 20,
    CONSTRAINT fk_aluno_turma_turma FOREIGN KEY (codigo_turma_aluno) 
        REFERENCES turma (codigo) ON DELETE CASCADE,
    CONSTRAINT fk_aluno_turma_aluno FOREIGN KEY (matricula_aluno) 
        REFERENCES aluno (matricula) ON DELETE CASCADE
);

-- 6. TABELA REGISTRO_DIARIO (Aulas, presenças e notas por data do Diário Eletrônico)
CREATE TABLE IF NOT EXISTS registro_diario (
    id INT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    codigo_turma INT NOT NULL,
    matricula_aluno INT NOT NULL,
    nif_docente INT NOT NULL,
    data_aula DATE NOT NULL DEFAULT CURRENT_DATE,
    presente BOOLEAN NOT NULL DEFAULT TRUE,
    nota NUMERIC(4,2) DEFAULT NULL,
    observacao VARCHAR(255),
    CONSTRAINT fk_reg_turma FOREIGN KEY (codigo_turma) REFERENCES turma (codigo) ON DELETE CASCADE,
    CONSTRAINT fk_reg_aluno FOREIGN KEY (matricula_aluno) REFERENCES aluno (matricula) ON DELETE CASCADE,
    CONSTRAINT fk_reg_docente FOREIGN KEY (nif_docente) REFERENCES docente (nif) ON DELETE CASCADE
);

-- Índices para otimização de junções e buscas
CREATE INDEX IF NOT EXISTS idx_prof_turma_cod ON professor_turma (codigo_turma);
CREATE INDEX IF NOT EXISTS idx_prof_turma_nif ON professor_turma (nif_docente);
CREATE INDEX IF NOT EXISTS idx_aluno_turma_cod ON aluno_turma (codigo_turma_aluno);
CREATE INDEX IF NOT EXISTS idx_aluno_turma_mat ON aluno_turma (matricula_aluno);
CREATE INDEX IF NOT EXISTS idx_reg_diario_turma ON registro_diario (codigo_turma);

-- 7. DADOS INICIAIS DE EXEMPLO (Para testes imediatos)
INSERT INTO docente (nif, nome, senha) VALUES 
    (1001, 'Prof. Carlos Eduardo Silva', '123456'),
    (1002, 'Profª. Maria Helena Santos', '123456')
ON CONFLICT (nif) DO NOTHING;

INSERT INTO turma (codigo, nome_curso, quantidade_maxima, empresa, nome_empresa, turno, data_inicio, data_fim) VALUES
    (201, 'Nutrição Clínica Avançada', 35, FALSE, NULL, 'Matutino', '2026-02-10', '2026-06-30'),
    (202, 'Dietética e Saúde Coletiva', 30, TRUE, 'Hospital Central', 'Noturno', '2026-02-15', '2026-07-10')
ON CONFLICT (codigo) DO NOTHING;

INSERT INTO aluno (matricula, nome) VALUES
    (5001, 'Ana Beatriz Lima'),
    (5002, 'Bruno Henrique Souza'),
    (5003, 'Camila Rodrigues'),
    (5004, 'Daniel Alves Pereira'),
    (5005, 'Eduarda Martins')
ON CONFLICT (matricula) DO NOTHING;

INSERT INTO professor_turma (codigo_turma, nif_docente, status_diario) VALUES
    (201, 1001, 'Ativo'),
    (202, 1001, 'Ativo'),
    (202, 1002, 'Ativo')
ON CONFLICT DO NOTHING;

INSERT INTO aluno_turma (codigo_turma_aluno, matricula_aluno, status_final, nota, presencas, total_aulas) VALUES
    (201, 5001, 'Cursando', 8.5, 18, 20),
    (201, 5002, 'Cursando', 7.0, 16, 20),
    (201, 5003, 'Cursando', 9.2, 19, 20),
    (202, 5004, 'Cursando', 6.5, 15, 20),
    (202, 5005, 'Cursando', 8.0, 17, 20)
ON CONFLICT DO NOTHING;
