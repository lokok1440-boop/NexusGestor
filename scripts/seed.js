const { Padeiro, Atividade, Cronograma } = require('../data/prismaDB');

// Helper to generate random CPF
function generateCPF() {
  const n = () => Math.floor(Math.random() * 9);
  return `${n()}${n()}${n()}.${n()}${n()}${n()}.${n()}${n()}${n()}-${n()}${n()}`;
}

// Helper to generate random Phone
function generatePhone() {
  const ddd = Math.floor(Math.random() * 89) + 11;
  const n = () => Math.floor(Math.random() * 9);
  return `(${ddd}) 9${n()}${n()}${n()}${n()}-${n()}${n()}${n()}${n()}`;
}

const nomes = [
  "João Silva", "Pedro Santos", "Marcos Oliveira", "Lucas Ferreira", "Mateus Costa", 
  "José Pereira", "Carlos Rodrigues", "Paulo Almeida", "Ricardo Nascimento", "Roberto Lima", 
  "Fernando Araújo", "Antônio Ribeiro", "Francisco Alves", "Luiz Carvalho", "André Moreira", 
  "Marcelo Fernandes", "Thiago Sousa", "Bruno Pinto", "Eduardo Gomes", "Rodrigo Martins", 
  "Gabriel Barbosa", "Rafael Castro", "Felipe Melo", "Diego Barros", "Gustavo Dias"
];

async function seed() {
  console.log("🌱 Iniciando migração/seed de dados de demonstração no Supabase...");
  
  try {
    // Apagar padeiros antigos caso existam
    await Padeiro.deleteMany({});
    await Cronograma.deleteMany({});
    
    console.log("✅ Banco limpo. Inserindo 25 padeiros...");

    // Criar 25 padeiros
    const padeiros = [];
    for (let i = 0; i < 25; i++) {
      const doc = await Padeiro.create({
        nome: nomes[i] || `Padeiro Demo ${i+1}`,
        telefone: generatePhone(),
        cpf: generateCPF(),
        senha: "123",
        role: "padeiro",
        status: "ativo",
        filial: ["NexusGestor Matriz"],
        fotoPerfil: "/assets/default-avatar.png",
        assinatura: ""
      });
      padeiros.push(doc);
    }
    console.log("✅ 25 Padeiros inseridos!");

    console.log("✅ Criando dados de demonstração na aba de rastreamento (Cronograma/Atividades)...");
    
    // Pegar uns 3 padeiros para dar atividades
    for (let i = 0; i < 3; i++) {
      const padeiro = padeiros[i];
      const hoje = new Date().toISOString().split('T')[0];
      
      await Cronograma.create({
        padeiroId: padeiro.id,
        data: hoje,
        turno: "Manhã",
        status: "Em Andamento",
        tarefas: JSON.stringify([
          { nome: "Preparo da Massa Base", concluida: true, hora: "05:00" },
          { nome: "Fermentação", concluida: true, hora: "06:00" },
          { nome: "Modelagem de Pães", concluida: false, hora: "07:30" },
          { nome: "Fornada Pão Francês", concluida: false, hora: "08:30" }
        ])
      });
    }

    console.log("🎉 Seed concluído com sucesso no Supabase!");
    process.exit(0);
  } catch (err) {
    console.error("❌ Erro ao rodar seed:", err);
    process.exit(1);
  }
}

seed();
