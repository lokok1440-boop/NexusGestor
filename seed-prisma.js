const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
const fs = require('fs');
const path = require('path');

async function seed() {
  const produtosPath = path.join(__dirname, 'data', 'produtos.json');
  const clientesPath = path.join(__dirname, 'data', 'clientes.json');
  
  if (fs.existsSync(produtosPath)) {
    const produtos = JSON.parse(fs.readFileSync(produtosPath, 'utf8'));
    console.log(`Inserindo ${produtos.length} produtos...`);
    for (const p of produtos) {
      const pSave = {
        descricao: p.descricao || '',
        codigo: p.codigo || null,
        fornecedor: p.fornecedor || null,
        categoria: p.categoria || null,
        preco: parseFloat(p.preco) || null,
        unidade: p.unidade || null,
        ativo: p.ativo !== undefined ? p.ativo : true
      };
      await prisma.produto.create({ data: pSave });
    }
  }

  if (fs.existsSync(clientesPath)) {
    const clientes = JSON.parse(fs.readFileSync(clientesPath, 'utf8'));
    console.log(`Inserindo ${clientes.length} clientes...`);
    for (const c of clientes) {
      const cSave = {
        nome: c.nome || '',
        razaoSocial: c.razaoSocial || (c.nome + ' LTDA'),
        cnpj: c.cnpj || null,
        email: c.email || null,
        telefone: c.telefone || null,
        celular: c.celular || null,
        cep: c.cep || null,
        endereco: c.endereco || null,
        numero: c.numero || null,
        bairro: c.bairro || null,
        cidade: c.cidade || null,
        uf: c.uf || null,
        ativo: c.ativo !== undefined ? c.ativo : true
      };
      await prisma.cliente.create({ data: cSave });
    }
  }
  
  console.log('Seed do Prisma concluído!');
  process.exit(0);
}

seed().catch(e => {
  console.error(e);
  process.exit(1);
});
