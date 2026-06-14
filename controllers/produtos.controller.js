const { Produto } = require('../data/db-adapter');

exports.listProdutos = async (req, res) => {
  try {
    const produtos = await Produto.find();
    
    // Check if the FTP catalog is loaded/available
    let catalog = {};
    if (typeof global.getFtpCatalog === 'function') {
      try {
        catalog = await global.getFtpCatalog();
      } catch (err) {
        console.warn('Erro ao obter catálogo FTP no controller:', err);
      }
    }
    
    // Map products to include the temFoto flag
    const result = produtos.map(p => {
      const pObj = p.toObject ? p.toObject() : p;
      return {
        ...pObj,
        temFoto: !!(p.codigo && catalog[p.codigo])
      };
    });
    
    res.json(result);
  } catch (error) {
    console.error('Erro ao listar produtos:', error);
    res.status(500).json({ error: 'Erro ao listar produtos' });
  }
};

exports.createProduto = async (req, res) => {
  try {
    const novo = { ...req.body, criadoEm: new Date().toISOString() };
    if (novo.ativo !== undefined) {
      novo.ativo = (novo.ativo === 'true' || novo.ativo === 'on' || novo.ativo === true || novo.ativo === '1');
    } else {
      novo.ativo = true;
    }
    if (novo.preco !== undefined) {
      novo.preco = parseFloat(novo.preco);
    }
    const produto = await Produto.create(novo);
    res.status(201).json(produto);
  } catch (error) {
    console.error('Erro ao criar produto:', error);
    res.status(500).json({ error: 'Erro ao criar produto' });
  }
};

exports.updateProduto = async (req, res) => {
  try {
    const updateData = { ...req.body };
    if (updateData.ativo !== undefined) {
      updateData.ativo = (updateData.ativo === 'true' || updateData.ativo === 'on' || updateData.ativo === true || updateData.ativo === '1');
    }
    if (updateData.preco !== undefined) {
      updateData.preco = parseFloat(updateData.preco);
    }
    const produto = await Produto.findByIdAndUpdate(req.params.id, updateData, { new: true });
    if (!produto) return res.status(404).json({ error: 'Não encontrado' });
    res.json(produto);
  } catch (e) {
    res.status(400).json({ error: 'ID inválido' });
  }
};

exports.deleteProduto = async (req, res) => {
  try {
    await Produto.findByIdAndDelete(req.params.id);
    res.json({ success: true });
  } catch (e) {
    res.status(400).json({ error: 'ID inválido' });
  }
};
