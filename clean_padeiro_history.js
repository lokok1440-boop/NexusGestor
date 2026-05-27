const readline = require('readline');
const { Padeiro, HistoricoLocalizacao, Localizacao } = require('./data/db-adapter');

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

async function main() {
  try {
    console.log('🔍 Buscando padeiros cadastrados...');
    const padeiros = await Padeiro.find({ deletado: { $ne: true } });

    if (padeiros.length === 0) {
      console.log('❌ Nenhum padeiro encontrado.');
      process.exit(0);
    }

    console.log('\n=== LISTA DE PADEIROS ===');
    padeiros.forEach((p, idx) => {
      console.log(`${idx + 1}. Nome: ${p.nome} | ID: ${p.id} | Filial: ${p.filial}`);
    });

    rl.question('\nDigite o número do padeiro para limpar o histórico de hoje: ', async (num) => {
      const idx = parseInt(num) - 1;
      if (isNaN(idx) || idx < 0 || idx >= padeiros.length) {
        console.log('❌ Seleção inválida.');
        rl.close();
        process.exit(1);
      }

      const selected = padeiros[idx];
      console.log(`\nVocê selecionou: ${selected.nome} (ID: ${selected.id})`);

      // Calculate today range in ISO format using local date boundary
      const todayDate = new Date();
      const yyyy = todayDate.getFullYear();
      const mm = String(todayDate.getMonth() + 1).padStart(2, '0');
      const dd = String(todayDate.getDate()).padStart(2, '0');
      const dateStr = `${yyyy}-${mm}-${dd}`;

      const startOfDay = `${dateStr}T00:00:00.000Z`;
      const endOfDay = `${dateStr}T23:59:59.999Z`;

      // Count entries
      const count = await HistoricoLocalizacao.countDocuments({
        userId: selected.id,
        timestamp: { $gte: startOfDay, $lte: endOfDay }
      });

      console.log(`Foram encontrados ${count} registros de localização hoje para este padeiro.`);

      if (count === 0) {
        console.log('ℹ️ Nenhum registro de localização hoje para limpar.');
        rl.close();
        process.exit(0);
      }

      rl.question(`Deseja realmente apagar estes ${count} registros de hoje? (S/N): `, async (conf) => {
        if (conf.toUpperCase() !== 'S') {
          console.log('❌ Operação cancelada.');
          rl.close();
          process.exit(0);
        }

        console.log('\n🧹 Limpando histórico de localização...');
        await HistoricoLocalizacao.deleteMany({
          userId: selected.id,
          timestamp: { $gte: startOfDay, $lte: endOfDay }
        });

        console.log('📍 Resetando localização atual ativa...');
        await Localizacao.deleteMany({ userId: selected.id });

        console.log('✅ Histórico de hoje limpo com sucesso!');
        console.log('👉 Peça para o padeiro real abrir o aplicativo no celular dele para reiniciar o envio da localização correta.');

        rl.close();
        process.exit(0);
      });
    });
  } catch (error) {
    console.error('❌ Erro durante a limpeza:', error);
    rl.close();
    process.exit(1);
  }
}

main();
