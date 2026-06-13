const fs = require('fs');
const path = require('path');
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

const produtos = [];
const categorias = ['Pão', 'Bolo', 'Torta', 'Biscoito', 'Salgado', 'Doce'];
for (let i = 1; i <= 50; i++) {
  produtos.push({
    id: `prod_${i}`,
    codigo: (10000 + i).toString(),
    descricao: `${categorias[i % categorias.length]} Artesanal ${i} Especial`,
    fornecedor: 'Padaria Interna',
    fotoPath: '',
    ativo: true,
    criadoEm: new Date().toISOString()
  });
}
fs.writeFileSync(path.join(__dirname, 'data', 'produtos.json'), JSON.stringify(produtos, null, 2));

const clientes = [];
const bairros = ['Centro', 'Jardins', 'Vila Nova', 'Copacabana', 'Botafogo'];
for (let i = 1; i <= 30; i++) {
  clientes.push({
    id: `cli_${i}`,
    nome: `Cliente Premium ${i}`,
    email: `cliente${i}@email.com`,
    telefone: `(11) 99999-${(1000 + i).toString().padStart(4, '0')}`,
    endereco: `Rua das Flores, ${i * 10}, ${bairros[i % bairros.length]}`,
    ativo: true,
    criadoEm: new Date().toISOString()
  });
}
fs.writeFileSync(path.join(__dirname, 'data', 'clientes.json'), JSON.stringify(clientes, null, 2));

const colors = [
  '#FF3B30', '#FF9500', '#FFCC00', '#4CD964', '#5AC8FA', 
  '#007AFF', '#5856D6', '#FF2D55', '#E5E5EA', '#8E8E93'
];
const cargos = ['Mestre Padeiro', 'Padeiro Treinee', 'Confeiteiro', 'Ajudante', 'Auxiliar', 'Supervisor'];

async function seedPadeiros() {
  const padeiros = await prisma.padeiro.findMany();
  for (let i = 0; i < padeiros.length; i++) {
    const color = colors[i % colors.length];
    const cargo = cargos[i % cargos.length];
    await prisma.padeiro.update({
      where: { id: padeiros[i].id },
      data: { 
        cor: color,
        cargo: cargo
      }
    });
  }
  console.log(`Updated ${padeiros.length} padeiros with colors and cargos.`);
}

seedPadeiros().then(() => {
  console.log('Seed completed successfully!');
  prisma.$disconnect();
}).catch(e => {
  console.error(e);
  prisma.$disconnect();
});
