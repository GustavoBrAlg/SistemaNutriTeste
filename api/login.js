const { query } = require('../lib/db');

module.exports = async function handler(req, res) {
  // CORS
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,POST,OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Método não permitido' });
  }

  try {
    const { nif, senha } = req.body || {};

    if (!nif || !senha) {
      return res.status(400).json({ error: 'NIF e Senha são obrigatórios.' });
    }

    const nifNum = parseInt(nif, 10);
    if (isNaN(nifNum)) {
      return res.status(400).json({ error: 'NIF deve ser um número inteiro válido.' });
    }

    const rows = await query(
      'SELECT nif, nome FROM docente WHERE nif = $1 AND senha = $2',
      [nifNum, String(senha).trim()]
    );

    if (!rows || rows.length === 0) {
      return res.status(401).json({ error: 'NIF ou senha incorretos.' });
    }

    const docente = rows[0];
    return res.status(200).json({
      success: true,
      docente: {
        nif: docente.nif,
        nome: docente.nome
      }
    });
  } catch (error) {
    console.error('Erro no login:', error);
    return res.status(500).json({ error: 'Erro interno ao realizar login: ' + error.message });
  }
};
