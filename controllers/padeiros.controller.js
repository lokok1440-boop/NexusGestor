const bcrypt = require('bcryptjs');
const { Padeiro, Atividade, Meta, Avaliacao, Cronograma, Cliente, Tracking } = require('../data/db-adapter');

exports.listPadeiros = async (req, res) => {
  try {
    let query = { deletado: { $ne: true } };
    if (req.user.role !== 'admin' && req.user.filial && req.user.filial !== 'null') {
      query.filial = Array.isArray(req.user.filial) ? { $in: req.user.filial } : req.user.filial;
    }
    const padeiros = await Padeiro.find(query).select('-passwordHash -firstAccessToken');
    res.json(padeiros);
  } catch (error) {
    console.error('Erro ao listar padeiros:', error);
    res.status(500).json({ error: 'Erro ao carregar lista de padeiros' });
  }
};

exports.getPadeiro = async (req, res) => {
  try {
    const p = await Padeiro.findById(req.params.id).select('-passwordHash -firstAccessToken');
    if (!p) return res.status(404).json({ error: 'Padeiro não encontrado' });
    res.json(p);
  } catch (e) {
    res.status(400).json({ error: 'ID inválido' });
  }
};

exports.createPadeiro = async (req, res) => {
  try {
    const { senha, ...rest } = req.body;
    let filialArray = rest.filial || [];
    if (typeof filialArray === 'string') {
      try {
        filialArray = JSON.parse(filialArray);
      } catch(e) {
        filialArray = [filialArray];
      }
    }
    if (!Array.isArray(filialArray)) filialArray = [filialArray];

    const novo = {
      ...rest,
      filial: filialArray,
      ativo: rest.ativo !== undefined ? (rest.ativo === 'true' || rest.ativo === 'on' || rest.ativo === true || rest.ativo === '1') : true,
      deletado: rest.deletado !== undefined ? (rest.deletado === 'true' || rest.deletado === 'on' || rest.deletado === true || rest.deletado === '1') : false,
      role: req.body.cargo === 'GESTOR' ? 'gestor' : 'padeiro',
      criadoEm: new Date().toISOString(),
      atualizadoEm: new Date().toISOString()
    };

    if (novo.dataContratacao) {
      try {
        novo.dataContratacao = new Date(novo.dataContratacao).toISOString();
      } catch (e) {
        delete novo.dataContratacao;
      }
    } else {
      delete novo.dataContratacao;
    }

    // Auto-generate codTec if not provided
    if (!novo.codTec) {
      let isUnique = false;
      let code;
      let attempts = 0;
      while (!isUnique && attempts < 10) {
        code = Math.floor(100000 + Math.random() * 900000).toString();
        const exists = await Padeiro.findOne({ codTec: code });
        if (!exists) isUnique = true;
        attempts++;
      }
      novo.codTec = code;
    }

    if (senha && senha.trim() !== '') {
      novo.passwordHash = await bcrypt.hash(senha, 10);
      novo.firstAccessToken = null; // Clear if set manually
    }

    // Sanitize to only allowed fields
    const allowedFields = ['nome', 'cpf', 'telefone', 'senha', 'role', 'status', 'fotoPerfil', 'filial', 'foto', 'assinatura', 'ativo', 'deletado', 'dataContratacao', 'criadoEm', 'atualizadoEm', 'cor', 'cargo', 'codTec', 'rg', 'email', 'dataNascimento', 'passwordHash', 'firstAccessToken'];
    const sanitizedNovo = {};
    for (const key of Object.keys(novo)) {
      if (allowedFields.includes(key)) {
        let val = novo[key];
        // Convert empty strings to null for unique fields and optional strings
        if (typeof val === 'string' && val.trim() === '' && ['cpf', 'codTec', 'rg', 'email', 'telefone', 'dataNascimento'].includes(key)) {
          val = null;
        }
        sanitizedNovo[key] = val;
      }
    }

    const padeiro = new Padeiro(sanitizedNovo);
    await padeiro.save();
    
    const pObj = padeiro.toObject();
    delete pObj.passwordHash;
    delete pObj.firstAccessToken;
    res.status(201).json(pObj);
  } catch (error) {
    console.error("Error creating padeiro:", error);
    res.status(500).json({ error: 'Erro ao criar padeiro: ' + error.message });
  }
};

exports.updatePadeiro = async (req, res) => {
  try {
    const { senha, ...rest } = req.body;
    let filialArray = rest.filial;
    if (filialArray !== undefined) {
      if (typeof filialArray === 'string') {
        try {
          filialArray = JSON.parse(filialArray);
        } catch(e) {
          filialArray = [filialArray];
        }
      }
      if (!Array.isArray(filialArray)) filialArray = [filialArray];
      rest.filial = filialArray;
    }

    const updateData = { ...rest, atualizadoEm: new Date().toISOString() };
    if (req.body.cargo) updateData.role = req.body.cargo === 'GESTOR' ? 'gestor' : 'padeiro';
    
    if (senha && senha.trim() !== '') {
      updateData.passwordHash = await bcrypt.hash(senha, 10);
      updateData.firstAccessToken = null;
    }

    // Protect firstAccessToken from general updates unless explicitly clearing it above
    if (!senha) delete updateData.firstAccessToken;

    const allowedFields = ['nome', 'cpf', 'telefone', 'senha', 'role', 'status', 'fotoPerfil', 'filial', 'foto', 'assinatura', 'ativo', 'deletado', 'dataContratacao', 'criadoEm', 'atualizadoEm', 'cor', 'cargo', 'codTec', 'rg', 'email', 'dataNascimento', 'passwordHash', 'firstAccessToken'];
    const sanitizedUpdate = {};
    for (const key of Object.keys(updateData)) {
      if (allowedFields.includes(key)) {
        let val = updateData[key];
        
        // Handle Booleans
        if (key === 'ativo' || key === 'deletado') {
          val = (val === 'true' || val === 'on' || val === true || val === '1');
        }
        
        // Handle Dates
        if (key === 'dataContratacao' || key === 'criadoEm' || key === 'atualizadoEm') {
          if (!val) continue;
          try {
            val = new Date(val).toISOString();
          } catch(e) {
            continue;
          }
        }
        
        // Convert empty strings to null for unique fields and optional strings
        if (typeof val === 'string' && val.trim() === '' && ['cpf', 'codTec', 'rg', 'email', 'telefone', 'dataNascimento'].includes(key)) {
          val = null;
        }
        
        sanitizedUpdate[key] = val;
      }
    }

    const p = await Padeiro.findByIdAndUpdate(req.params.id, sanitizedUpdate, { new: true });
    if (!p) return res.status(404).json({ error: 'Não encontrado' });
    res.json(p);
  } catch (e) {
    console.error("Error updating padeiro:", e);
    res.status(400).json({ error: 'ID inválido ou erro na atualização' });
  }
};

exports.deletePadeiro = async (req, res) => {
  try {
    const padeiroId = req.params.id;
    
    // Perform cascade deletion
    await Promise.all([
      Padeiro.findByIdAndDelete(padeiroId),
      Atividade.deleteMany({ padeiroId }),
      Meta.deleteMany({ padeiroId }),
      Avaliacao.deleteMany({ padeiroId }),
      Cronograma.deleteMany({ padeiroId })
    ]);

    res.json({ success: true, message: 'Padeiro e todos os seus registros associados foram excluídos com sucesso.' });
  } catch (e) {
    console.error("Erro na exclusão em cascata:", e);
    res.status(400).json({ error: 'Erro ao excluir padeiro e seus registros' });
  }
};

exports.deleteAllPadeiros = async (req, res) => {
  try {
    await Promise.all([
      Padeiro.deleteMany({}),
      Atividade.deleteMany({}),
      Meta.deleteMany({}),
      Avaliacao.deleteMany({}),
      Cronograma.deleteMany({})
    ]);
    res.json({ success: true, message: 'Todos os padeiros foram excluídos.' });
  } catch (e) {
    console.error("Erro na exclusão de todos os padeiros:", e);
    res.status(500).json({ error: 'Erro ao excluir padeiros' });
  }
};

exports.seedPadeiro = async (req, res) => {
  try {
    const { cargo, filial } = req.body;
    if (!cargo || !filial) return res.status(400).json({ error: 'Cargo e filial são obrigatórios' });
    
    const nomes = ["Carlos", "João", "José", "Marcos", "Paulo", "Antônio", "Luiz", "Fernando", "Rafael", "Pedro", "Felipe", "Lucas", "Gabriel", "Mateus", "Bruno", "Eduardo"];
    const sobrenomes = ["Silva", "Santos", "Oliveira", "Souza", "Rodrigues", "Ferreira", "Alves", "Pereira", "Lima", "Gomes", "Costa", "Ribeiro", "Martins", "Carvalho", "Almeida"];
    
    const nomeReal = `${nomes[Math.floor(Math.random() * nomes.length)]} ${sobrenomes[Math.floor(Math.random() * sobrenomes.length)]}`;
    
    const randomId = Math.floor(Math.random() * 10000);
    const codTec = `TEC${Math.floor(1000 + Math.random() * 9000)}`;

    const novo = {
      nome: nomeReal,
      cargo,
      filial: [filial],
      codTec,
      role: cargo === 'GESTOR' ? 'gestor' : 'padeiro',
      status: 'ativo',
      ativo: true,
      cpf: `${Math.floor(100+Math.random()*899)}.${Math.floor(100+Math.random()*899)}.${Math.floor(100+Math.random()*899)}-${Math.floor(10+Math.random()*89)}`,
      email: `${nomeReal.split(' ')[0].toLowerCase()}${randomId}@nexusgestor.com`,
      telefone: `619${Math.floor(10000000+Math.random()*89999999)}`,
      dataContratacao: new Date().toISOString(),
      criadoEm: new Date().toISOString()
    };
    
    const padeiro = new Padeiro(novo);
    await padeiro.save();
    
    // Gerar Metas
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
        nota: Math.floor(Math.random() * 2) + 4, // 4 or 5
        prodPaoSal: Math.floor(Math.random() * 300) + 800,
        prodPaoDoce: Math.floor(Math.random() * 200) + 300,
        prodPaoForma: Math.floor(Math.random() * 100) + 100,
        prodRosca: Math.floor(Math.random() * 50) + 50,
        prodSalgado: Math.floor(Math.random() * 100) + 200,
        prodPaoQueijo: Math.floor(Math.random() * 150) + 200,
        prodIntegral: Math.floor(Math.random() * 80) + 70,
      });
    }
    
    for (const a of atividades) {
      await Atividade.create(a);
    }
    
    res.json({ success: true, padeiro });
  } catch (e) {
    console.error("Erro no seed padeiro:", e);
    res.status(500).json({ error: 'Erro ao gerar padeiro fictício' });
  }
};

exports.seedAllData = async (req, res) => {
  try {
    const padeiros = await Padeiro.find({ deletado: { $ne: true } });
    const clientes = await Cliente.find();
    
    // Clear existing Cronograma as requested
    await Cronograma.deleteMany({});
    
    if (padeiros.length === 0) return res.status(400).json({ error: "Nenhum padeiro encontrado. Gere um padeiro primeiro." });

    const today = new Date();
    today.setHours(0,0,0,0);
    const todayStr = today.toISOString().split("T")[0];

    const weekDates = [];
    const dayOfWeek = today.getDay();
    const diff = today.getDate() - dayOfWeek + (dayOfWeek === 0 ? -6 : 1);
    const startOfWeek = new Date(today);
    startOfWeek.setDate(diff);
    
    for (let i = 0; i < 7; i++) {
      const d = new Date(startOfWeek);
      d.setDate(startOfWeek.getDate() + i);
      weekDates.push(d.toISOString().split("T")[0]);
    }

    const mockLat = -15.793889;
    const mockLng = -47.882778;

    const atividadesToCreate = [];
    const metasToCreate = [];
    const cronogramaToCreate = [];
    const trackingToCreate = [];

    // Delete existing tracking, metas, atividades to avoid duplicating infinitely
    await Atividade.deleteMany({});
    await Meta.deleteMany({});
    await Tracking.deleteMany({});

    for (const p of padeiros) {
      // 1. Meta
      metasToCreate.push({
        padeiroId: p.id,
        metaPaoSal: 1000 + Math.floor(Math.random() * 500),
        metaPaoDoce: 500 + Math.floor(Math.random() * 200),
        metaPaoForma: 200 + Math.floor(Math.random() * 100),
        metaRosca: 100 + Math.floor(Math.random() * 50),
        metaSalgado: 300 + Math.floor(Math.random() * 100),
        metaPaoQueijo: 400 + Math.floor(Math.random() * 150),
        metaIntegral: 150 + Math.floor(Math.random() * 100)
      });

      // 2. Tracking
      trackingToCreate.push({
        padeiroId: p.id,
        timestamp: new Date().toISOString(),
        latitude: mockLat + (Math.random() * 0.01 - 0.005),
        longitude: mockLng + (Math.random() * 0.01 - 0.005),
        accuracy: 10 + Math.random() * 10,
        provider: "mock_seed"
      });

      // 3. Atividades (Last 30 days)
      for (let i = 0; i < 30; i++) {
        const d = new Date();
        d.setDate(d.getDate() - i);
        if (d.getDay() === 0) continue;

        const c = clientes.length > 0 ? clientes[Math.floor(Math.random() * clientes.length)] : { id: "mock-cliente", nomeFantasia: "Cliente Fictício" };
        
        atividadesToCreate.push({
          padeiroId: p.id,
          clienteId: c.id,
          tipo: "Produção",
          data: d.toISOString(),
          produtos: {
            paoSal: Math.floor(Math.random() * 1000),
            paoDoce: Math.floor(Math.random() * 500),
            paoForma: Math.floor(Math.random() * 200)
          },
          status: "Concluída",
          observacao: "Gerado automaticamente"
        });
      }

      // 4. Cronograma (This Week)
      for (const dStr of weekDates) {
        if (new Date(dStr).getDay() === 0) continue;
        const c = clientes.length > 0 ? clientes[Math.floor(Math.random() * clientes.length)] : { id: "mock-cliente", nomeFantasia: "Cliente Fictício" };
        
        cronogramaToCreate.push({
          padeiroId: p.id,
          padeiroNome: p.nome,
          codTec: p.codTec,
          clienteId: c.id,
          clienteNome: c.nomeFantasia || c.razaoSocial || "Cliente Fictício",
          data: dStr,
          horario: "08:00",
          turno: "Manhã",
          status: "pendente",
          observacao: "Gerado pelo Seed em Massa",
          criadoPor: "sistema"
        });
      }
    }

    if (metasToCreate.length > 0) {
      for (const m of metasToCreate) await Meta.create(m);
    }
    if (atividadesToCreate.length > 0) {
      for (const a of atividadesToCreate) await Atividade.create(a);
    }
    if (cronogramaToCreate.length > 0) {
      for (const c of cronogramaToCreate) await Cronograma.create(c);
    }
    if (trackingToCreate.length > 0) {
      for (const t of trackingToCreate) await Tracking.create(t);
    }

    res.json({ success: true, message: "Dados fictícios gerados para todos os padeiros." });
  } catch (e) {
    console.error("Erro no seed-all:", e);
    res.status(500).json({ error: "Erro ao gerar dados fictícios." });
  }
};
