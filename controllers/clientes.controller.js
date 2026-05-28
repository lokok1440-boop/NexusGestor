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
  const novo = { ...req.body, ativo: true, criadoEm: new Date().toISOString() };
  const cliente = await Cliente.create(novo);
  res.status(201).json(cliente);
};

exports.updateCliente = async (req, res) => {
  try {
    const cliente = await Cliente.findByIdAndUpdate(req.params.id, req.body, { new: true });
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

exports.importClientesFromXLSX = async (req, res) => {
  if (!req.file) {
    return res.status(400).json({ error: 'Nenhum arquivo enviado.' });
  }

  const filePath = req.file.path;
  const fs = require('fs');

  try {
    const XLSX = require('xlsx');
    const workbook = XLSX.readFile(filePath);
    const sheetName = workbook.SheetNames[0];
    const sheet = workbook.Sheets[sheetName];
    const data = XLSX.utils.sheet_to_json(sheet, { defval: '' });
    
    console.log(`[IMPORT API] Lidos ${data.length} registros da planilha.`);

    const db = require('../data/mysqlDB');
    const pool = db.pool;
    const ClienteModel = db.Cliente;

    // Deletar todos os clientes existentes
    await pool.query('DELETE FROM clientes');

    // Preparar e inserir dados
    let inseridos = 0;
    for (const row of data) {
      const nome = String(row['DESCRIÇÃO'] || '');
      if (!nome) continue;

      const id = Math.random().toString(36).substr(2, 9) + Date.now().toString(36);
      await ClienteModel.create({
        id: id,
        codigo: String(row['CÓDIGO'] || ''),
        nome: nome,
        nomeFantasia: String(row['NOME FANTASIA'] || ''),
        inscricaoEstadual: String(row['INSCRIÇÃO ESTADUAL'] || ''),
        cnpj: String(row['CNPJ/CPF'] || ''),
        endereco: String(row['ENDEREÇO'] || ''),
        bairro: String(row['BAIRO'] || ''),
        estado: String(row['UF'] || ''),
        ativo: true,
        criadoEm: new Date().toISOString()
      });
      inseridos++;
    }

    // Apaga o arquivo temporário
    fs.unlink(filePath, (err) => {
      if (err) console.error('Erro ao apagar planilha temporária:', err.message);
    });

    res.json({ success: true, count: inseridos });
  } catch (error) {
    console.error('Erro ao importar clientes:', error);
    
    // Apaga o arquivo temporário em caso de erro
    if (fs.existsSync(filePath)) {
      try { fs.unlinkSync(filePath); } catch (e) {}
    }
    
    res.status(500).json({ error: 'Erro interno ao importar planilha de clientes.' });
  }
};
