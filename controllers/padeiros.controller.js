const bcrypt = require('bcryptjs');
const { Padeiro, Atividade, Meta, Avaliacao, Cronograma } = require('../data/db-adapter');

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
        sanitizedNovo[key] = novo[key];
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
