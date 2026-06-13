const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function run() {
  const padeiros = await prisma.padeiro.findMany();
  const cargos = ['Padeiro Chefe', 'Padeiro Sênior', 'Padeiro Júnior', 'Confeiteiro', 'Padeiro'];
  for (let p of padeiros) {
    const cargo = cargos[Math.floor(Math.random() * cargos.length)];
    await prisma.$executeRawUnsafe(`UPDATE "Padeiro" SET cargo = '${cargo}' WHERE id = '${p.id}'`);
  }
  console.log('Cargos adicionados a todos os padeiros com sucesso!');
}

run().catch(console.error).finally(() => prisma.$disconnect());
