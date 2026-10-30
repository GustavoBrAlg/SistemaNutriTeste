const { query } = require('../lib/db');

module.exports = async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  const { nif } = req.query;

  if (!nif) {
    return res.status(400).json({ error: 'NIF do docente é obrigatório.' });
  }

  const nifNum = parseInt(nif, 10);
  if (isNaN(nifNum)) {
    return res.status(400).json({ error: 'NIF inválido.' });
  }

  try {
    const sql = `
      SELECT 
        t.codigo,
        t.nome_curso,
        t.quantidade_maxima,
        t.empresa,
        t.nome_empresa,
        t.turno,
        TO_CHAR(t.data_inicio, 'YYYY-MM-DD') as data_inicio,
        TO_CHAR(t.data_fim, 'YYYY-MM-DD') as data_fim,
        pt.status_diario,
        (SELECT COUNT(*) FROM aluno_turma at WHERE at.codigo_turma_aluno = t.codigo) as total_alunos
      FROM turma t
      INNER JOIN professor_turma pt ON pt.codigo_turma = t.codigo
      WHERE pt.nif_docente = $1
      ORDER BY t.codigo ASC
    `;

    const turmas = await query(sql, [nifNum]);
    return res.status(200).json({ success: true, turmas });
  } catch (error) {
    console.error('Erro ao listar turmas:', error);
    return res.status(500).json({ error: 'Erro ao listar turmas: ' + error.message });
  }
};
