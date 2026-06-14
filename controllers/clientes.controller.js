const { Cliente, Atividade } = require('../data/db-adapter');

exports.listClientes = async (req, res) => {
  try {
    const [clientes, atividades] = await Promise.all([
      Cliente.find(),
      Atividade.find()
    ]);

    const notesByClient = {};
    atividades.forEach(a => {
      const key = a.clienteId;
      if (!key) return;
      if (!notesByClient[key]) notesByClient[key] = [];
      const score = a.notaPadeiroCliente !== undefined && a.notaPadeiroCliente !== null ? a.notaPadeiroCliente : a.notaCliente;
      if (score) notesByClient[key].push(score);
    });

    const enrichedClientes = clientes.map(c => {
      const cJson = typeof c.toJSON === 'function' ? c.toJSON() : c;
      const notes = notesByClient[c.id] || [];
      const notaMedia = notes.length > 0 
        ? notes.reduce((sum, n) => sum + parseFloat(n), 0) / notes.length 
        : null;
      return {
        ...cJson,
        notaMedia: notaMedia !== null ? Math.round(notaMedia * 10) / 10 : null
      };
    });

    res.json(enrichedClientes);
  } catch (error) {
    console.error('Erro ao listar clientes:', error);
    res.status(500).json({ error: 'Erro interno ao listar clientes' });
  }
};

exports.createCliente = async (req, res) => {
  try {
    const novo = { ...req.body, criadoEm: new Date().toISOString() };
    if (novo.ativo !== undefined) {
      novo.ativo = (novo.ativo === 'true' || novo.ativo === 'on' || novo.ativo === true || novo.ativo === '1');
    } else {
      novo.ativo = true;
    }
    
    // Convert empty strings to null
    for (const key of Object.keys(novo)) {
      if (typeof novo[key] === 'string' && novo[key].trim() === '') {
        novo[key] = null;
      }
    }
    const cliente = await Cliente.create(novo);
    res.status(201).json(cliente);
  } catch (error) {
    console.error('Erro ao criar cliente:', error);
    res.status(500).json({ error: 'Erro ao criar cliente' });
  }
};

exports.updateCliente = async (req, res) => {
  try {
    const updateData = { ...req.body };
    if (updateData.ativo !== undefined) {
      updateData.ativo = (updateData.ativo === 'true' || updateData.ativo === 'on' || updateData.ativo === true || updateData.ativo === '1');
    }
    
    // Convert empty strings to null
    for (const key of Object.keys(updateData)) {
      if (typeof updateData[key] === 'string' && updateData[key].trim() === '') {
        updateData[key] = null;
      }
    }
    const cliente = await Cliente.findByIdAndUpdate(req.params.id, updateData, { new: true });
    if (!cliente) return res.status(404).json({ error: 'Não encontrado' });
    res.json(cliente);
  } catch (e) {
    res.status(400).json({ error: 'ID inválido' });
  }
};

exports.deleteCliente = async (req, res) => {
  try {
    await Cliente.findByIdAndDelete(req.params.id);
    res.json({ success: true });
  } catch (e) {
    res.status(400).json({ error: 'ID inválido' });
  }
};
