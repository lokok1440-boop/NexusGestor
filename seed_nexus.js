const mysql = require('mysql2/promise');
const bcrypt = require('bcryptjs');
const fs = require('fs');
require('dotenv').config();

async function run() {
  try {
    // 1. Create the new database using a direct connection (without specifying a database)
    const connection = await mysql.createConnection({
      host: process.env.MYSQL_HOST || 'localhost',
      user: process.env.MYSQL_USER || 'root',
      password: process.env.MYSQL_PASSWORD || ''
    });
    
    console.log('Creating database nexus_gestor...');
    await connection.query('CREATE DATABASE IF NOT EXISTS nexus_gestor');
    await connection.end();
    
    // 2. Set environment variable dynamically for the current process
    process.env.MYSQL_DATABASE = 'nexus_gestor';
    
    // Create/append to .env file for future server restarts
    let envContent = '';
    if (fs.existsSync('.env')) {
      envContent = fs.readFileSync('.env', 'utf-8');
      if (envContent.includes('MYSQL_DATABASE=')) {
        envContent = envContent.replace(/MYSQL_DATABASE=.*/, 'MYSQL_DATABASE=nexus_gestor');
      } else {
        envContent += '\nMYSQL_DATABASE=nexus_gestor\n';
      }
    } else {
      envContent = 'MYSQL_DATABASE=nexus_gestor\n';
    }
    fs.writeFileSync('.env', envContent);

    // 3. Initialize tables
    console.log('Initializing tables in nexus_gestor...');
    const { initTables } = require('./data/init-mysql');
    await initTables();

    // 4. Seed data
    const { Padeiro, Admin, TimelineEvent, Localizacao } = require('./data/db-adapter');
    
    console.log('Creating admin...');
    await Admin.deleteMany({});
    await Admin.create({
      id: 'admin_nexus',
      nome: 'Nexus Admin',
      email: 'admin@nexusgestor.com',
      passwordHash: await bcrypt.hash('admin123', 10),
      role: 'admin',
      filial: 'Nexus Principal',
      ativo: true
    });

    console.log('Clearing old test data...');
    await Padeiro.deleteMany({});
    await Localizacao.deleteMany({});
    await TimelineEvent.deleteMany({});

    console.log('Creating 25 demonstration padeiros...');
    for (let i = 1; i <= 25; i++) {
      const padId = `pad_${i}`;
      const cpf = `111.111.111-${String(i).padStart(2, '0')}`;
      const padNome = `Padeiro Demo ${i}`;

      await Padeiro.create({
        id: padId,
        nome: padNome,
        cpf: cpf,
        passwordHash: await bcrypt.hash('123456', 10),
        filial: 'Nexus Principal',
        cargo: 'Padeiro',
        ativo: true
      });
      
      // Add fake location to rastreamento
      const lat = -15.7942 + (Math.random() - 0.5) * 0.1;
      const lng = -47.8822 + (Math.random() - 0.5) * 0.1;
      
      await Localizacao.create({
        id: `loc_${i}`,
        userId: padId,
        userName: padNome,
        filial: 'Nexus Principal',
        lat,
        lng,
        lastUpdate: new Date().toISOString()
      });
      
      await TimelineEvent.create({
        id: `ev_${i}_1`,
        padeiroId: padId,
        padeiroNome: padNome,
        action: 'online',
        lat,
        lng,
        timestamp: new Date().toISOString()
      });
    }

    console.log('Seed completed successfully!');
    process.exit(0);

  } catch (err) {
    console.error('Error in seed:', err);
    process.exit(1);
  }
}

run();
