const { sql } = require('@vercel/postgres');
const fs = require('fs');
const path = require('path');

export default async function handler(request, response) {
  try {
    const schemaPath = path.join(process.cwd(), 'schema.sql');
    const schemaSql = fs.readFileSync(schemaPath, 'utf8');

    // Executa as instruções SQL no Vercel Postgres
    await sql.query(schemaSql);

    return response.status(200).json({
      success: true,
      message: 'Esquema de banco de dados executado e atualizado com sucesso no Vercel Postgres!'
    });
  } catch (error) {
    console.error('Erro ao executar migração:', error);
    return response.status(500).json({
      success: false,
      error: error.message
    });
  }
}
