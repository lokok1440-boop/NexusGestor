const { Padeiro, Meta, Atividade } = require('./data/db-adapter');

async function testSeed() {
  try {
    const cargo = 'PADEIRO PLENO';
    const filial = 'NexusGestor Brasília';

    const randomId = Math.floor(Math.random() * 10000);
    const novo = {
      nome: `Padeiro Fictício ${randomId}`,
      cargo,
      filial: [filial],
      role: 'padeiro',
      status: 'ativo',
      ativo: true,
      cpf: `${Math.floor(100+Math.random()*899)}.${Math.floor(100+Math.random()*899)}.${Math.floor(100+Math.random()*899)}-${Math.floor(10+Math.random()*89)}`,
      email: `padeiro${randomId}@nexusgestor.com`,
      telefone: `619${Math.floor(10000000+Math.random()*89999999)}`,
      dataContratacao: new Date().toISOString(),
      criadoEm: new Date().toISOString()
    };
    
    console.log("Saving padeiro...");
    const padeiro = new Padeiro(novo);
    await padeiro.save();
    console.log("Saved padeiro with ID:", padeiro.id);

    console.log("Creating meta...");
    await Meta.create({
      padeiroId: padeiro.id,
      metaPaoSal: 1000,
      metaPaoDoce: 500,
      metaPaoForma: 200,
      metaRosca: 100,
      metaSalgado: 300,
      metaPaoQueijo: 400,
      metaIntegral: 150
    });
    console.log("Created meta");

    // Gerar atividades dos últimos 30 dias
    const atividades = [];
    const hoje = new Date();
    for (let i = 0; i < 30; i++) {
      const d = new Date(hoje);
      d.setDate(d.getDate() - i);
      const dataStr = d.toISOString().split('T')[0];
      const mesStr = dataStr.substring(0, 7);
      const year = d.getFullYear();
      
      const firstDayOfYear = new Date(year, 0, 1);
      const pastDaysOfYear = (d - firstDayOfYear) / 86400000;
      const weekNum = Math.ceil((pastDaysOfYear + firstDayOfYear.getDay() + 1) / 7);
      const semanaStr = `${year}-W${weekNum.toString().padStart(2, '0')}`;
      
      atividades.push({
        padeiroId: padeiro.id,
        data: dataStr,
        mes: mesStr,
        semana: semanaStr,
        status: 'concluido',
        notaPadeiroCliente: Math.floor(Math.random() * 2) + 4, // 4 or 5
        prodPaoSal: Math.floor(Math.random() * 300) + 800,
        prodPaoDoce: Math.floor(Math.random() * 200) + 300,
        prodPaoForma: Math.floor(Math.random() * 100) + 100,
        prodRosca: Math.floor(Math.random() * 50) + 50,
        prodSalgado: Math.floor(Math.random() * 100) + 200,
        prodPaoQueijo: Math.floor(Math.random() * 150) + 200,
        prodIntegral: Math.floor(Math.random() * 80) + 70,
      });
    }
    
    console.log("Creating atividades...");
    for (const a of atividades) {
      await Atividade.create(a);
    }
    console.log("Success");
  } catch(e) {
    console.error("ERROR", e);
  }
}

testSeed();
