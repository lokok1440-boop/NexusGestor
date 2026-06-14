const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
async function main() {
  const padeiros = await prisma.padeiro.findMany({ where: { codTec: "" } });
  console.log("Padeiros with codTec='':", padeiros.length);
  await prisma.$disconnect();
}
main();
