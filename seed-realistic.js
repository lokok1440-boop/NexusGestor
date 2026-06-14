const fs = require('fs');
const path = require('path');

const clientNames = [
  'Padaria Pão de Ouro', 'Empório Cecília', 'Panificadora Nápoles', 'Supermercado Vida', 'Mercado Central',
  'Padaria Doce Sabor', 'Empório São João', 'Conveniência Express', 'Panificadora Pão Quente', 'Doceria Sonho Meu',
  'Mercado Bom Preço', 'Padaria Trigo Fino', 'Empório Gourmet', 'Casa do Pão', 'Panificadora Estrela',
  'Supermercado Nova Era', 'Padaria Pão Nosso', 'Empório da Vila', 'Mercado Popular', 'Delicatessen Sabor',
  'Padaria Bella', 'Café Central', 'Panificadora Aurora', 'Empório Santa Maria', 'Supermercado Dia a Dia',
  'Padaria Pão & Cia', 'Mercado Econômico', 'Confeitaria Real', 'Panificadora União', 'Empório do Trigo'
];

const productNames = [
  'Pão Francês Congelado (Caixa 10kg)', 'Pão de Queijo Tradicional (Caixa 5kg)', 'Massa de Pizza Pré-assada', 'Bolo de Cenoura com Chocolate', 'Torta de Frango com Recheio',
  'Croissant de Manteiga', 'Pão de Hamburguer Brioche', 'Massa de Esfiha Aberta', 'Biscoito Amanteigado 500g', 'Pão Doce com Creme',
  'Bolo de Fubá Cremoso', 'Torta Holandesa Inteira', 'Pão Integral com Grãos', 'Mini Pão de Queijo', 'Quiche de Alho Poró',
  'Bolo Red Velvet', 'Empadão de Palmito', 'Pão Australiano', 'Cookie de Gotas de Chocolate', 'Pudim de Leite Condensado',
  'Pão de Forma Artesanal', 'Rosca Doce com Coco', 'Torta de Morango', 'Massa para Pastel de Forno', 'Bolo de Milho Verde',
  'Salgado Maromba de Frango', 'Pão Ciabatta', 'Pão de Hot Dog', 'Biscoito de Polvilho', 'Torta de Limão',
  'Pão Sírio', 'Bolo de Chocolate Trufado', 'Coxinha de Frango', 'Pão de Mel com Doce de Leite', 'Empada de Camarão',
  'Baguete Tradicional', 'Bolo de Laranja', 'Torta de Maçã Americana', 'Mini Churros', 'Pão de Alho Especial',
  'Sonho Recheado com Creme', 'Quiche Loraine', 'Bolo Formigueiro', 'Pão Caseiro Tradicional', 'Carolina Recheada',
  'Torta de Frutas Vermelhas', 'Biscoito Sequilhos de Coco', 'Massa de Calzone', 'Pão Italiano', 'Bolo Mármore'
];

const clientesPath = path.join(__dirname, 'data', 'clientes.json');
const produtosPath = path.join(__dirname, 'data', 'produtos.json');

const clientes = JSON.parse(fs.readFileSync(clientesPath, 'utf8'));
for (let i = 0; i < clientes.length && i < clientNames.length; i++) {
  clientes[i].nome = clientNames[i];
  clientes[i].razaoSocial = clientNames[i] + ' LTDA';
}
fs.writeFileSync(clientesPath, JSON.stringify(clientes, null, 2));

const produtos = JSON.parse(fs.readFileSync(produtosPath, 'utf8'));
for (let i = 0; i < produtos.length && i < productNames.length; i++) {
  produtos[i].descricao = productNames[i];
}
fs.writeFileSync(produtosPath, JSON.stringify(produtos, null, 2));

console.log('Seed realistic updated!');
