const fs = require('fs');
const bcrypt = require('bcryptjs');

async function run() {
  let sql = `-- Criando o novo banco de dados NexusGestor\n`;
  sql += `CREATE DATABASE IF NOT EXISTS nexus_gestor CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;\n`;
  sql += `USE nexus_gestor;\n\n`;

  // Pegar schemas do init-mysql.js
  const initMysql = fs.readFileSync('./data/init-mysql.js', 'utf8');
  const schemaMatches = initMysql.match(/CREATE TABLE IF NOT EXISTS [\s\S]*?\)/g);
  
  if (schemaMatches) {
    sql += `-- Criando tabelas\n`;
    schemaMatches.forEach(match => {
      sql += `${match};\n\n`;
    });
  }

  sql += `-- Adicionando colunas de migrações que possam faltar no CREATE TABLE original\n`;
  sql += `ALTER TABLE avaliacoes ADD COLUMN IF NOT EXISTS clienteId VARCHAR(50);\n`;
  sql += `ALTER TABLE avaliacoes ADD COLUMN IF NOT EXISTS clienteNome VARCHAR(255);\n`;
  sql += `ALTER TABLE avaliacoes ADD COLUMN IF NOT EXISTS atividadeId VARCHAR(50);\n`;
  sql += `ALTER TABLE metas ADD COLUMN IF NOT EXISTS observacao TEXT;\n`;
  sql += `ALTER TABLE admins ADD COLUMN IF NOT EXISTS filial VARCHAR(255);\n`;
  sql += `ALTER TABLE admins ADD COLUMN IF NOT EXISTS deletado BOOLEAN DEFAULT FALSE;\n`;
  sql += `ALTER TABLE admins ADD COLUMN IF NOT EXISTS atualizadoEm VARCHAR(100);\n`;
  sql += `ALTER TABLE padeiros ADD COLUMN IF NOT EXISTS deletado BOOLEAN DEFAULT FALSE;\n`;
  sql += `ALTER TABLE timeline_events ADD COLUMN IF NOT EXISTS clienteId VARCHAR(50);\n`;
  sql += `ALTER TABLE timeline_events ADD COLUMN IF NOT EXISTS clienteNome VARCHAR(255);\n\n`;

  sql += `-- Inserindo Admin Principal\n`;
  const adminPass = await bcrypt.hash('admin123', 10);
  sql += `INSERT INTO admins (id, nome, email, passwordHash, role, filial, ativo, deletado) VALUES ('admin_nexus', 'Nexus Admin', 'admin@nexusgestor.com', '${adminPass}', 'admin', 'Nexus Principal', 1, 0);\n\n`;

  sql += `-- Inserindo 25 Padeiros de Demonstração e Rastreamento\n`;
  const padPass = await bcrypt.hash('123456', 10);
  
  for (let i = 1; i <= 25; i++) {
    const padId = `pad_${i}`;
    const nome = `Padeiro Demo ${i}`;
    const cpf = `111.111.111-${String(i).padStart(2, '0')}`;
    const now = new Date().toISOString();
    
    // Padeiro
    sql += `INSERT INTO padeiros (id, nome, cpf, passwordHash, filial, cargo, ativo, deletado) VALUES ('${padId}', '${nome}', '${cpf}', '${padPass}', 'Nexus Principal', 'Padeiro', 1, 0);\n`;
    
    // Rastreamento (Localizacao)
    const lat = (-15.7942 + (Math.random() - 0.5) * 0.1).toFixed(6);
    const lng = (-47.8822 + (Math.random() - 0.5) * 0.1).toFixed(6);
    
    sql += `INSERT INTO localizacoes (id, userId, userName, filial, lat, lng, lastUpdate) VALUES ('loc_${i}', '${padId}', '${nome}', 'Nexus Principal', ${lat}, ${lng}, '${now}');\n`;
    
    // Timeline event
    sql += `INSERT INTO timeline_events (id, padeiroId, padeiroNome, action, lat, lng, timestamp) VALUES ('ev_${i}_1', '${padId}', '${nome}', 'online', ${lat}, ${lng}, '${now}');\n`;
  }

  fs.writeFileSync('nexus_seed.sql', sql);
  console.log('Arquivo nexus_seed.sql gerado com sucesso!');
}

run().catch(console.error);
