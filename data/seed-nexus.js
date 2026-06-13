const path = require('path');
const fs = require('fs');

// Set DATA_DIR before importing jsonDB
process.env.NODE_ENV = 'development';

const db = require('./jsonDB');

// Helper to generate random string
function randomStr(length) {
  let result = '';
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
  for (let i = 0; i < length; i++) result += chars.charAt(Math.floor(Math.random() * chars.length));
  return result;
}

// Helper to generate CPF
function generateCpf() {
  const n = () => Math.floor(Math.random() * 9);
  return `${n()}${n()}${n()}.${n()}${n()}${n()}.${n()}${n()}${n()}-${n()}${n()}`;
}

// Helper to generate phone
function generatePhone() {
  return `(11) 9${Math.floor(Math.random() * 9000) + 1000}-${Math.floor(Math.random() * 9000) + 1000}`;
}

const firstNames = ['João', 'Pedro', 'Lucas', 'Mateus', 'Marcos', 'Paulo', 'José', 'Carlos', 'Eduardo', 'Rafael', 'Bruno', 'Thiago', 'Felipe', 'Gabriel', 'Rodrigo', 'Fernando', 'Ricardo', 'Alexandre', 'Leonardo', 'Marcelo', 'Daniel', 'André', 'Roberto', 'Luiz', 'Antônio'];
const lastNames = ['Silva', 'Santos', 'Oliveira', 'Souza', 'Rodrigues', 'Ferreira', 'Alves', 'Pereira', 'Lima', 'Gomes', 'Costa', 'Ribeiro', 'Martins', 'Carvalho', 'Almeida', 'Lopes', 'Soares', 'Fernandes', 'Vieira', 'Barbosa', 'Rocha', 'Dias', 'Nascimento', 'Andrade', 'Moreira'];

const filiais = ['NexusGestor Brasília', 'NexusGestor Goiania', 'NexusGestor Palmas', 'NexusGestor Campo Grande'];

async function runSeed() {
  console.log('🌱 Iniciando limpeza do banco de dados (JSON local)...');

  // Clear existing collections
  await db.Padeiro.deleteMany({});
  await db.Meta.deleteMany({});
  await db.Localizacao.deleteMany({});
  await db.HistoricoLocalizacao.deleteMany({});
  await db.TimelineEvent.deleteMany({});
  await db.Atividade.deleteMany({});
  await db.Avaliacao.deleteMany({});
  await db.Cronograma.deleteMany({});
  
  console.log('✅ Banco de dados limpo. Inserindo dados NexusGestor...');

  const padeiros = [];
  const metas = [];
  const localizacoes = [];
  const timelineEvents = [];

  // Ponto base (Brasília)
  const baseLat = -15.7942;
  const baseLng = -47.8822;

  for (let i = 0; i < 25; i++) {
    const nome = `${firstNames[i]} ${lastNames[i]}`;
    const filial = filiais[i % filiais.length];
    
    // Padeiro
    const padeiro = await db.Padeiro.create({
      nome: nome,
      cpf: generateCpf(),
      telefone: generatePhone(),
      filial: [filial],
      senha: '123', // Padrão
      role: 'padeiro',
      status: 'ativo',
      fotoPerfil: '/assets/default-avatar.png'
    });
    
    padeiros.push(padeiro);

    // Meta
    const objMeta = await db.Meta.create({
      padeiroId: padeiro.id,
      padeiroNome: padeiro.nome,
      filial: filial,
      mes: new Date().toISOString().slice(0, 7), // YYYY-MM
      metaVisitas: 30 + Math.floor(Math.random() * 20),
      metaProducao: 500 + Math.floor(Math.random() * 500),
      visitasRealizadas: Math.floor(Math.random() * 30),
      producaoRealizada: Math.floor(Math.random() * 500)
    });
    
    metas.push(objMeta);

    // Localização atual mock
    const lat = baseLat + (Math.random() * 0.1 - 0.05);
    const lng = baseLng + (Math.random() * 0.1 - 0.05);
    
    const loc = await db.Localizacao.create({
      padeiroId: padeiro.id,
      nome: padeiro.nome,
      lat: lat,
      lng: lng,
      timestamp: new Date().toISOString(),
      precisao: Math.floor(Math.random() * 20) + 5,
      bateria: Math.floor(Math.random() * 60) + 40,
      isOnline: Math.random() > 0.2
    });

    localizacoes.push(loc);

    // Eventos de Timeline recentes
    const numEvents = Math.floor(Math.random() * 4) + 1;
    for (let e = 0; e < numEvents; e++) {
      const pastDate = new Date();
      pastDate.setHours(pastDate.getHours() - e);
      
      const actions = ['checkin', 'checkout', 'foto_fornada', 'pausa'];
      const action = actions[Math.floor(Math.random() * actions.length)];
      
      let titulo = '';
      let descricao = '';
      
      switch(action) {
        case 'checkin': titulo = 'Check-in Realizado'; descricao = 'Iniciou as atividades no cliente.'; break;
        case 'checkout': titulo = 'Check-out Finalizado'; descricao = 'Finalizou atendimento e saiu.'; break;
        case 'foto_fornada': titulo = 'Nova Fornada'; descricao = 'Registrou 120 pães assados.'; break;
        case 'pausa': titulo = 'Pausa / Descanso'; descricao = 'Parada para almoço.'; break;
      }

      await db.TimelineEvent.create({
        padeiroId: padeiro.id,
        nomePadeiro: padeiro.nome,
        acao: action,
        titulo: titulo,
        descricao: descricao,
        lat: lat + (Math.random() * 0.01 - 0.005),
        lng: lng + (Math.random() * 0.01 - 0.005),
        timestamp: pastDate.toISOString()
      });
    }
  }

  // Admin user
  await db.Admin.deleteMany({});
  await db.Admin.create({
    nome: 'Admin NexusGestor',
    email: 'admin@nexusgestor.com',
    senha: 'admin', // In real life should be hashed
    role: 'master',
    status: 'ativo'
  });

  console.log(`✅ Seed finalizado!`);
  console.log(`🧍‍♂️ ${padeiros.length} Padeiros inseridos.`);
  console.log(`🎯 ${metas.length} Metas inseridas.`);
  console.log(`📍 ${localizacoes.length} Localizações ativas criadas.`);
  console.log(`👑 Admin master criado: admin@nexusgestor.com / senha: admin`);
}

runSeed().catch(err => console.error(err));
