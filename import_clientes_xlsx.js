const XLSX = require('xlsx');
const path = require('path');
const { pool, Cliente } = require('./data/mysqlDB');

async function importClientes() {
  console.log('🍞 Iniciando importação de clientes...');
  const filePath = path.join(__dirname, 'CLIENTES COMPLETOS.xlsx');
  
  try {
    const workbook = XLSX.readFile(filePath);
    const sheetName = workbook.SheetNames[0];
    const sheet = workbook.Sheets[sheetName];
    const data = XLSX.utils.sheet_to_json(sheet, { defval: '' });
    
    console.log(`Planilha lida com sucesso: ${data.length} registros encontrados.`);

    // Deletar todos os clientes existentes
    console.log('Apagando clientes antigos...');
    const [delResult] = await pool.query('DELETE FROM clientes');
    console.log(`Clientes antigos removidos: ${delResult.affectedRows}`);

    // Preparar dados para inserção
    const clientes = data.map(row => {
      // Gerar um ID único simples
      const id = Math.random().toString(36).substr(2, 9) + Date.now().toString(36);
      
      return {
        id: id,
        codigo: String(row['CÓDIGO'] || ''),
        nome: String(row['DESCRIÇÃO'] || ''),
        nomeFantasia: String(row['NOME FANTASIA'] || ''),
        inscricaoEstadual: String(row['INSCRIÇÃO ESTADUAL'] || ''),
        cnpj: String(row['CNPJ/CPF'] || ''),
        endereco: String(row['ENDEREÇO'] || ''),
        bairro: String(row['BAIRO'] || ''),
        estado: String(row['UF'] || ''),
        ativo: true,
        criadoEm: new Date().toISOString()
      };
    });

    // Inserir novos clientes
    console.log('Importando novos clientes...');
    let inseridos = 0;
    for (const cliente of clientes) {
      if (!cliente.nome) continue; // Pular linhas vazias se houver
      await Cliente.create(cliente);
      inseridos++;
    }

    console.log(`✅ Importação finalizada! Clientes importados: ${inseridos}`);
    process.exit(0);

  } catch (error) {
    console.error('❌ Erro durante a importação:', error);
    process.exit(1);
  }
}

importClientes();
