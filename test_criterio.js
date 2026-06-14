const { Criterio } = require('./data/db-adapter');

async function test() {
  try {
    const res = await Criterio.find();
    console.log(res);
  } catch(e) {
    console.error("Erro", e);
  }
}
test();
