const { pool, Cliente } = require('./data/mysqlDB');

function formatIE(v) {
  if (!v) return v;
  let num = String(v).replace(/\D/g, '');
  if (num.length >= 9) {
    return num.substring(0, 2) + '.' + num.substring(2, 5) + '.' + num.substring(5, 8) + '-' + num.substring(8);
  }
  return v;
}

async function run() {
  const [rows] = await pool.query('SELECT id, inscricaoEstadual FROM clientes WHERE inscricaoEstadual IS NOT NULL AND inscricaoEstadual != ""');
  let count = 0;
  for (const row of rows) {
    const formatted = formatIE(row.inscricaoEstadual);
    if (formatted !== row.inscricaoEstadual) {
      await pool.query('UPDATE clientes SET inscricaoEstadual = ? WHERE id = ?', [formatted, row.id]);
      count++;
    }
  }
  console.log(`Formatou ${count} IEs.`);
  process.exit(0);
}

run().catch(console.error);
