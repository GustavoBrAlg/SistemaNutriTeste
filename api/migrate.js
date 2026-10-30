const fs = require('fs');
const path = require('path');
const { query } = require('../lib/db');

module.exports = async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,POST,OPTIONS');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  try {
    const schemaPath = path.join(process.cwd(), 'schema.sql');
    let schemaSql = '';

    if (fs.existsSync(schemaPath)) {
      schemaSql = fs.readFileSync(schemaPath, 'utf8');
    }

    if (schemaSql) {
      await query(schemaSql);
    }

    return res.status(200).json({
      success: true,
      message: 'Esquema de banco de dados executado e sincronizado com sucesso!'
    });
  } catch (error) {
    console.error('Erro na migração:', error);
    return res.status(500).json({
      success: false,
      error: error.message
    });
  }
};
