const { Produto } = require('./data/db-adapter');

async function run() {
  console.log('Deletando produtos existentes...');
  await Produto.deleteMany({});
  
  const produtos = [
    { descricao: 'Pão Francês', codigo: 'PRD-1001', fornecedor: 'Moinho Real', categoria: 'Pães', preco: 15.0, unidade: 'KG', ativo: true },
    { descricao: 'Pão de Queijo Tradicional', codigo: 'PRD-1002', fornecedor: 'Laticínios Minas', categoria: 'Salgados', preco: 25.0, unidade: 'KG', ativo: true },
    { descricao: 'Pão de Queijo Congelado', codigo: 'PRD-1003', fornecedor: 'Congelados Frios', categoria: 'Salgados', preco: 22.0, unidade: 'KG', ativo: true },
    { descricao: 'Rosca Doce', codigo: 'PRD-1004', fornecedor: 'Moinho Real', categoria: 'Doces', preco: 18.0, unidade: 'KG', ativo: true },
    { descricao: 'Pão Doce Simples', codigo: 'PRD-1005', fornecedor: 'Moinho Real', categoria: 'Pães', preco: 16.0, unidade: 'KG', ativo: true },
    { descricao: 'Pão de Forma Tradicional', codigo: 'PRD-1006', fornecedor: 'Moinho Real', categoria: 'Pães', preco: 8.5, unidade: 'UN', ativo: true },
    { descricao: 'Pão de Forma Integral', codigo: 'PRD-1007', fornecedor: 'Moinho Real', categoria: 'Pães', preco: 10.0, unidade: 'UN', ativo: true },
    { descricao: 'Pão de Hambúrguer', codigo: 'PRD-1008', fornecedor: 'Moinho Real', categoria: 'Pães', preco: 12.0, unidade: 'KG', ativo: true },
    { descricao: 'Pão de Hot Dog', codigo: 'PRD-1009', fornecedor: 'Moinho Real', categoria: 'Pães', preco: 12.0, unidade: 'KG', ativo: true },
    { descricao: 'Croissant de Chocolate', codigo: 'PRD-1010', fornecedor: 'Distribuidora Doce', categoria: 'Doces', preco: 35.0, unidade: 'KG', ativo: true },
    { descricao: 'Croissant Tradicional', codigo: 'PRD-1011', fornecedor: 'Moinho Real', categoria: 'Pães', preco: 30.0, unidade: 'KG', ativo: true },
    { descricao: 'Salgado Assado Frango', codigo: 'PRD-1012', fornecedor: 'Aves & Cia', categoria: 'Salgados', preco: 28.0, unidade: 'KG', ativo: true },
    { descricao: 'Salgado Assado Carne', codigo: 'PRD-1013', fornecedor: 'Carnes Bovinas', categoria: 'Salgados', preco: 28.0, unidade: 'KG', ativo: true },
    { descricao: 'Salgado Frito Coxinha', codigo: 'PRD-1014', fornecedor: 'Aves & Cia', categoria: 'Salgados', preco: 25.0, unidade: 'KG', ativo: true },
    { descricao: 'Salgado Frito Risole', codigo: 'PRD-1015', fornecedor: 'Congelados Frios', categoria: 'Salgados', preco: 25.0, unidade: 'KG', ativo: true },
    { descricao: 'Sonho de Creme', codigo: 'PRD-1016', fornecedor: 'Distribuidora Doce', categoria: 'Doces', preco: 32.0, unidade: 'KG', ativo: true },
    { descricao: 'Sonho de Doce de Leite', codigo: 'PRD-1017', fornecedor: 'Laticínios Minas', categoria: 'Doces', preco: 32.0, unidade: 'KG', ativo: true },
    { descricao: 'Bolo de Cenoura c/ Chocolate', codigo: 'PRD-1018', fornecedor: 'Distribuidora Doce', categoria: 'Doces', preco: 22.0, unidade: 'UN', ativo: true },
    { descricao: 'Bolo de Laranja', codigo: 'PRD-1019', fornecedor: 'Quitanda Frescor', categoria: 'Doces', preco: 18.0, unidade: 'UN', ativo: true },
    { descricao: 'Bolo Formigueiro', codigo: 'PRD-1020', fornecedor: 'Distribuidora Doce', categoria: 'Doces', preco: 20.0, unidade: 'UN', ativo: true },
    { descricao: 'Bolo de Chocolate', codigo: 'PRD-1021', fornecedor: 'Distribuidora Doce', categoria: 'Doces', preco: 25.0, unidade: 'UN', ativo: true },
    { descricao: 'Torta de Morango Inteira', codigo: 'PRD-1022', fornecedor: 'Quitanda Frescor', categoria: 'Doces', preco: 65.0, unidade: 'UN', ativo: true },
    { descricao: 'Torta de Limão Inteira', codigo: 'PRD-1023', fornecedor: 'Quitanda Frescor', categoria: 'Doces', preco: 55.0, unidade: 'UN', ativo: true },
    { descricao: 'Pudim de Leite Condensado', codigo: 'PRD-1024', fornecedor: 'Laticínios Minas', categoria: 'Doces', preco: 40.0, unidade: 'UN', ativo: true },
    { descricao: 'Pão Australiano', codigo: 'PRD-1025', fornecedor: 'Moinho Real', categoria: 'Pães', preco: 20.0, unidade: 'KG', ativo: true },
    { descricao: 'Pão de Batata', codigo: 'PRD-1026', fornecedor: 'Moinho Real', categoria: 'Pães', preco: 18.0, unidade: 'KG', ativo: true },
    { descricao: 'Pão de Leite', codigo: 'PRD-1027', fornecedor: 'Moinho Real', categoria: 'Pães', preco: 17.0, unidade: 'KG', ativo: true },
    { descricao: 'Bisnaguinha', codigo: 'PRD-1028', fornecedor: 'Moinho Real', categoria: 'Pães', preco: 14.0, unidade: 'KG', ativo: true },
    { descricao: 'Biscoito de Polvilho', codigo: 'PRD-1029', fornecedor: 'Distribuidora Secos', categoria: 'Secos', preco: 30.0, unidade: 'KG', ativo: true },
    { descricao: 'Bolacha Amanteigada', codigo: 'PRD-1030', fornecedor: 'Distribuidora Secos', categoria: 'Secos', preco: 35.0, unidade: 'KG', ativo: true },
    { descricao: 'Broa de Milho', codigo: 'PRD-1031', fornecedor: 'Moinho Real', categoria: 'Doces', preco: 16.0, unidade: 'KG', ativo: true },
    { descricao: 'Pão Sírio', codigo: 'PRD-1032', fornecedor: 'Moinho Real', categoria: 'Pães', preco: 22.0, unidade: 'KG', ativo: true },
    { descricao: 'Massa de Pizza Fina', codigo: 'PRD-1033', fornecedor: 'Moinho Real', categoria: 'Massas', preco: 15.0, unidade: 'UN', ativo: true },
    { descricao: 'Massa de Pizza Pan', codigo: 'PRD-1034', fornecedor: 'Moinho Real', categoria: 'Massas', preco: 18.0, unidade: 'UN', ativo: true },
    { descricao: 'Esfiha de Carne', codigo: 'PRD-1035', fornecedor: 'Carnes Bovinas', categoria: 'Salgados', preco: 28.0, unidade: 'KG', ativo: true },
    { descricao: 'Empadão de Frango', codigo: 'PRD-1036', fornecedor: 'Aves & Cia', categoria: 'Salgados', preco: 45.0, unidade: 'UN', ativo: true },
    { descricao: 'Baguete Tradicional', codigo: 'PRD-1037', fornecedor: 'Moinho Real', categoria: 'Pães', preco: 18.0, unidade: 'KG', ativo: true },
    { descricao: 'Baguete Recheada', codigo: 'PRD-1038', fornecedor: 'Congelados Frios', categoria: 'Salgados', preco: 25.0, unidade: 'KG', ativo: true },
    { descricao: 'Pão Italiano', codigo: 'PRD-1039', fornecedor: 'Moinho Real', categoria: 'Pães', preco: 24.0, unidade: 'KG', ativo: true },
    { descricao: 'Fatia de Pizza', codigo: 'PRD-1040', fornecedor: 'Moinho Real', categoria: 'Salgados', preco: 8.0, unidade: 'UN', ativo: true },
    { descricao: 'Torta Salgada de Frango', codigo: 'PRD-1041', fornecedor: 'Aves & Cia', categoria: 'Salgados', preco: 50.0, unidade: 'UN', ativo: true },
    { descricao: 'Mini Pizzas Congeladas', codigo: 'PRD-1042', fornecedor: 'Congelados Frios', categoria: 'Salgados', preco: 20.0, unidade: 'KG', ativo: true },
    { descricao: 'Brigadeiro', codigo: 'PRD-1043', fornecedor: 'Distribuidora Doce', categoria: 'Doces', preco: 2.5, unidade: 'UN', ativo: true },
    { descricao: 'Beijinho', codigo: 'PRD-1044', fornecedor: 'Distribuidora Doce', categoria: 'Doces', preco: 2.5, unidade: 'UN', ativo: true },
    { descricao: 'Carolina Recheada', codigo: 'PRD-1045', fornecedor: 'Distribuidora Doce', categoria: 'Doces', preco: 45.0, unidade: 'KG', ativo: true },
    { descricao: 'Bomba de Chocolate', codigo: 'PRD-1046', fornecedor: 'Distribuidora Doce', categoria: 'Doces', preco: 50.0, unidade: 'KG', ativo: true },
    { descricao: 'Pavê de Chocolate', codigo: 'PRD-1047', fornecedor: 'Distribuidora Doce', categoria: 'Doces', preco: 40.0, unidade: 'UN', ativo: true },
    { descricao: 'Pão de Frios', codigo: 'PRD-1048', fornecedor: 'Congelados Frios', categoria: 'Salgados', preco: 30.0, unidade: 'KG', ativo: true },
    { descricao: 'Ciabatta', codigo: 'PRD-1049', fornecedor: 'Moinho Real', categoria: 'Pães', preco: 26.0, unidade: 'KG', ativo: true },
    { descricao: 'Bolo de Festa Encomendado', codigo: 'PRD-1050', fornecedor: 'Distribuidora Doce', categoria: 'Doces', preco: 80.0, unidade: 'UN', ativo: true }
  ];

  await Produto.insertMany(produtos);
  console.log(`✅ Foram inseridos ${produtos.length} produtos novos e corrigidos!`);
}

run().catch(console.error);
