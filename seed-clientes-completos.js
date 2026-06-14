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
  
  let counter = 1000;
  for (const cliente of clientes) {
    const nomeLimpo = cliente.nome.toLowerCase().replace(/ /g, '').normalize('NFD').replace(/[\u0300-\u036f]/g, '');
    
    await prisma.$executeRawUnsafe(`
      UPDATE "Cliente" 
      SET 
        codigo = $1,
        "nomeFantasia" = $2,
        cnpj = $3, 
        "inscricaoEstadual" = $4, 
        email = $5, 
        telefone = $6, 
        celular = $7, 
        cep = $8, 
        endereco = $9, 
        numero = $10, 
        bairro = $11, 
        cidade = $12, 
        estado = $13
      WHERE id = $14
    `,
      cliente.codigo || `CLI-${counter++}`,
      cliente.nomeFantasia || cliente.nome,
      cliente.cnpj || generateCNPJ(),
      cliente.inscricaoEstadual || generateIE(),
      cliente.email || `contato@${nomeLimpo}.com.br`,
      cliente.telefone || generateTelefone(),
      cliente.celular || generateCelular(),
      cliente.cep || `01${Math.floor(Math.random() * 900 + 100)}-${Math.floor(Math.random() * 900 + 100)}`,
      cliente.endereco || ruas[Math.floor(Math.random() * ruas.length)],
      cliente.numero || Math.floor(Math.random() * 1000 + 1).toString(),
      cliente.bairro || bairros[Math.floor(Math.random() * bairros.length)],
      cliente.cidade || 'São Paulo',
      cliente.estado || 'SP',
      cliente.id
    );
  }
  console.log(`Foram atualizados ${clientes.length} clientes com dados completos (nomes corretos)!`);
}

updateClientes()
  .catch(e => console.error(e))
  .finally(() => prisma.$disconnect());
