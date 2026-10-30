const { query } = require('../lib/db');

module.exports = async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,PUT,POST,OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  // GET /api/alunos?codigoTurma=201
  if (req.method === 'GET') {
    const { codigoTurma } = req.query;

    if (!codigoTurma) {
      return res.status(400).json({ error: 'Código da turma é obrigatório.' });
    }

    const codNum = parseInt(codigoTurma, 10);
    if (isNaN(codNum)) {
      return res.status(400).json({ error: 'Código da turma inválido.' });
    }

    try {
      // Obter detalhes da turma
      const turmaRows = await query(
        `SELECT codigo, nome_curso, turno, quantidade_maxima, empresa, nome_empresa, 
                TO_CHAR(data_inicio, 'DD/MM/YYYY') as data_inicio, 
                TO_CHAR(data_fim, 'DD/MM/YYYY') as data_fim
         FROM turma WHERE codigo = $1`,
        [codNum]
      );

      const turma = turmaRows && turmaRows[0] ? turmaRows[0] : null;

      // Obter alunos vinculados na turma
      const sqlAlunos = `
        SELECT 
          at.id,
          at.codigo_turma_aluno,
          at.matricula_aluno,
          a.nome,
          at.status_final,
          at.nota,
          COALESCE(at.presencas, 0) as presencas,
          COALESCE(at.total_aulas, 20) as total_aulas
        FROM aluno_turma at
        INNER JOIN aluno a ON a.matricula = at.matricula_aluno
        WHERE at.codigo_turma_aluno = $1
        ORDER BY a.nome ASC
      `;

      const alunos = await query(sqlAlunos, [codNum]);

      return res.status(200).json({
        success: true,
        turma,
        alunos
      });
    } catch (error) {
      console.error('Erro ao buscar alunos da turma:', error);
      return res.status(500).json({ error: 'Erro ao buscar alunos da turma: ' + error.message });
    }
  }

  // PUT /api/alunos - Atualização de nota e presença de um aluno
  if (req.method === 'PUT' || req.method === 'POST') {
    try {
      let body = req.body;
      if (typeof body === 'string') {
        try {
          body = JSON.parse(body);
        } catch (e) {
          body = {};
        }
      }
      const { codigoTurma, matricula, nota, presencas, statusFinal, nifDocente } = body || {};

      if (!codigoTurma || !matricula) {
        return res.status(400).json({ error: 'codigoTurma e matricula são obrigatórios.' });
      }

      const codNum = parseInt(codigoTurma, 10);
      const matNum = parseInt(matricula, 10);
      const presNum = parseInt(presencas !== undefined ? presencas : 0, 10);
      const notaNum = nota !== '' && nota !== null && nota !== undefined ? parseFloat(nota) : null;

      // Define status sugerido com base na nota e frequência
      let novoStatus = statusFinal;
      if (!novoStatus) {
        if (notaNum !== null && notaNum >= 7.0) {
          novoStatus = 'Aprovado';
        } else if (notaNum !== null && notaNum < 7.0) {
          novoStatus = 'Em Recuperação';
        } else {
          novoStatus = 'Cursando';
        }
      }

      const updateSql = `
        UPDATE aluno_turma
        SET nota = $1, presencas = $2, status_final = $3
        WHERE codigo_turma_aluno = $4 AND matricula_aluno = $5
        RETURNING *
      `;

      await query(updateSql, [notaNum, presNum, novoStatus, codNum, matNum]);

      // Opcional: registrar no histórico de registro_diario se fornecido docente
      if (nifDocente) {
        const histSql = `
          INSERT INTO registro_diario (codigo_turma, matricula_aluno, nif_docente, presente, nota)
          VALUES ($1, $2, $3, $4, $5)
        `;
        await query(histSql, [codNum, matNum, parseInt(nifDocente, 10), presNum > 0, notaNum]);
      }

      return res.status(200).json({
        success: true,
        message: 'Registro de presença e nota atualizado com sucesso!',
        dados: {
          codigoTurma: codNum,
          matricula: matNum,
          nota: notaNum,
          presencas: presNum,
          statusFinal: novoStatus
        }
      });
    } catch (error) {
      console.error('Erro ao atualizar aluno:', error);
      return res.status(500).json({ error: 'Erro ao atualizar: ' + error.message });
    }
  }

  return res.status(405).json({ error: 'Método não permitido' });
};
