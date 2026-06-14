const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

const generateCNPJ = () => {
  const n = () => Math.floor(Math.random() * 9);
  return `${n()}${n()}.${n()}${n()}${n()}.${n()}${n()}${n()}/0001-${n()}${n()}`;
};

const generateIE = () => {
  const n = () => Math.floor(Math.random() * 9);
  return `${n()}${n()}${n()}.${n()}${n()}${n()}.${n()}${n()}${n()}.${n()}${n()}${n()}`;
};

const generateTelefone = () => {
  return `(11) 3${Math.floor(Math.random() * 900 + 100)}-${Math.floor(Math.random() * 9000 + 1000)}`;
};

const generateCelular = () => {
  return `(11) 9${Math.floor(Math.random() * 9000 + 1000)}-${Math.floor(Math.random() * 9000 + 1000)}`;
};

const ruas = ['Rua das Flores', 'Av. Paulista', 'Rua Augusta', 'Av. Brasil', 'Rua da Consolação', 'Rua Oscar Freire', 'Av. Faria Lima', 'Rua Treze de Maio'];
const bairros = ['Jardins', 'Pinheiros', 'Itaim Bibi', 'Moema', 'Vila Madalena', 'Centro', 'Bela Vista', 'Liberdade'];

async function updateClientes() {
  const clientes = await prisma.cliente.findMany();
  
  for (const cliente of clientes) {
    const nomeLimpo = cliente.nome.toLowerCase().replace(/ /g, '').normalize('NFD').replace(/[\u0300-\u036f]/g, '');
    
    await prisma.$executeRawUnsafe(`
      UPDATE "Cliente" 
      SET 
        cnpj = $1, 
        ie = $2, 
        email = $3, 
        telefone = $4, 
        celular = $5, 
        cep = $6, 
        endereco = $7, 
        numero = $8, 
        bairro = $9, 
        cidade = $10, 
        uf = $11
      WHERE id = $12
    `,
      cliente.cnpj || generateCNPJ(),
      cliente.ie || generateIE(),
      cliente.email || `contato@${nomeLimpo}.com.br`,
      cliente.telefone || generateTelefone(),
      cliente.celular || generateCelular(),
      cliente.cep || `01${Math.floor(Math.random() * 900 + 100)}-${Math.floor(Math.random() * 900 + 100)}`,
      cliente.endereco || ruas[Math.floor(Math.random() * ruas.length)],
      cliente.numero || Math.floor(Math.random() * 1000 + 1).toString(),
      cliente.bairro || bairros[Math.floor(Math.random() * bairros.length)],
      cliente.cidade || 'São Paulo',
      cliente.uf || 'SP',
      cliente.id
    );
  }
  console.log(`Foram atualizados ${clientes.length} clientes com dados completos!`);
}

updateClientes()
  .catch(e => console.error(e))
  .finally(() => prisma.$disconnect());
