const { Padeiro } = require('./data/db-adapter');

async function check() {
  const padeiros = await Padeiro.find({});
  console.log("Padeiros:");
  padeiros.forEach(p => {
    console.log(`- Nome: ${p.nome}, codTec: ${p.codTec}, codigoExterno: ${p.codigoExterno}`);
  });
  process.exit(0);
}
check();
