/**
 * Dev Module - System Testing Tools
 * NexusGestor Sistema Padeiro
 */
const Dev = {
  async render() {
    const user = API.getUser();
    if (!user || user.role !== 'admin') {
      const c = document.getElementById('page-container');
      c.innerHTML = Components.empty('lock', 'Acesso negado. Esta página é restrita a administradores.');
      return;
    }

    const c = document.getElementById('page-container');
    c.innerHTML = `
    <div class="fade-in">
      <div class="card mb-6">
        <div class="flex items-center gap-3 mb-4">
          <div class="kpi-icon text-primary"><i data-lucide="terminal"></i></div>
          <h3 style="margin:0;">Ferramentas de Teste</h3>
        </div>
        <p class="text-secondary mb-6">Utilize as ferramentas abaixo para resetar dados do sistema durante a fase de desenvolvimento e testes. <strong>Atenção: Estas ações são irreversíveis.</strong></p>
        
        <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
          <!-- Reset Padeiros -->
          <div class="card" style="background:#fff5f5; border-color:#feb2b2;">
            <div class="flex items-center gap-3 mb-3">
              <i data-lucide="users" class="text-danger"></i>
              <strong style="color:var(--danger)">Resetar Padeiros</strong>
            </div>
            <p class="text-secondary" style="font-size:13px; margin-bottom:16px;">Remove todos os padeiros e TODOS os registros associados a eles (metas, atividades, etc).</p>
            <button class="btn btn-primary bg-danger border-none w-full" onclick="Dev.resetPadeiros()">
              <i data-lucide="trash-2"></i> Resetar Todos os Padeiros
            </button>
          </div>

          <!-- Reset Metas -->
          <div class="card" style="background:#fff5f5; border-color:#feb2b2;">
            <div class="flex items-center gap-3 mb-3">
              <i data-lucide="target" class="text-danger"></i>
              <strong style="color:var(--danger)">Resetar Metas</strong>
            </div>
            <p class="text-secondary style="font-size:13px; margin-bottom:16px;">Remove todas as metas de produção cadastradas para todos os padeiros e períodos.</p>
            <button class="btn btn-primary bg-danger border-none w-full" onclick="Dev.resetMetas()">
              <i data-lucide="trash-2"></i> Resetar Todas as Metas
            </button>
          </div>

          <!-- Reset Produções -->
          <div class="card" style="background:#fff5f5; border-color:#feb2b2;">
            <div class="flex items-center gap-3 mb-3">
              <i data-lucide="package" class="text-danger"></i>
              <strong style="color:var(--danger)">Resetar Atividades</strong>
            </div>
            <p class="text-secondary" style="font-size:13px; margin-bottom:16px;">Remove todos os registros de atividades (produção, fotos, avaliações de cliente e assinaturas).</p>
            <button class="btn btn-primary bg-danger border-none w-full" onclick="Dev.resetAtividades()">
              <i data-lucide="trash-2"></i> Resetar Todas as Atividades
            </button>
          </div>

          <!-- Reset Avaliações Gestor -->
          <div class="card" style="background:#fff5f5; border-color:#feb2b2;">
            <div class="flex items-center gap-3 mb-3">
              <i data-lucide="star" class="text-danger"></i>
              <strong style="color:var(--danger)">Resetar Avaliações</strong>
            </div>
            <p class="text-secondary" style="font-size:13px; margin-bottom:16px;">Remove todas as avaliações feitas por gestores e clientes (da coleção Avaliacao).</p>
            <button class="btn btn-primary bg-danger border-none w-full" onclick="Dev.resetAvaliacoes()">
              <i data-lucide="trash-2"></i> Resetar Todas as Avaliações
            </button>
          </div>

          <!-- Reset Rastreamento -->
          <div class="card" style="background:#fff5f5; border-color:#feb2b2;">
            <div class="flex items-center gap-3 mb-3">
              <i data-lucide="map-pin" class="text-danger"></i>
              <strong style="color:var(--danger)">Resetar Rastreamento</strong>
            </div>
            <p class="text-secondary" style="font-size:13px; margin-bottom:16px;">Remove todo o histórico de trajeto registrado de todos os padeiros e limpa a localização em tempo real.</p>
            <button class="btn btn-primary bg-danger border-none w-full" onclick="Dev.resetRastreamento()">
              <i data-lucide="trash-2"></i> Resetar Todo o Rastreamento
            </button>
          </div>
        </div>
      </div>

      <div class="card mb-6">
        <div class="flex items-center gap-3 mb-4">
          <div class="kpi-icon text-primary"><i data-lucide="user-plus"></i></div>
          <h3 style="margin:0;">Gerar Padeiro Fictício</h3>
        </div>
        <p class="text-secondary mb-6">Gere um padeiro com dados completos, incluindo metas e 30 dias de atividades concluídas para testes.</p>
        
        <div class="flex gap-4 mb-4">
          <div class="form-group w-full">
            <label>Cargo</label>
            <select id="seed-cargo" class="input-control">
              <option>PADEIRO TREINEE</option>
              <option>PADEIRO JUNIOR</option>
              <option>PADEIRO PLENO</option>
              <option>PADEIRO SENIOR</option>
              <option>GESTOR</option>
              <option>PROMOTOR</option>
              <option>ASSISTENTE DE PANIFICAÇÃO</option>
            </select>
          </div>
          <div class="form-group w-full">
            <label>Filial</label>
            <select id="seed-filial" class="input-control">
              <option>NexusGestor Brasília</option>
              <option>NexusGestor Goiania</option>
              <option>NexusGestor Palmas</option>
              <option>NexusGestor Campo Grande</option>
            </select>
          </div>
        </div>
        <button class="btn btn-primary w-full" onclick="Dev.seedPadeiro()">
          <i data-lucide="zap"></i> Gerar Padeiro
        </button>
      </div>

      <div class="card mb-6">
        <div class="flex items-center gap-3 mb-4">
          <div class="kpi-icon text-primary"><i data-lucide="database"></i></div>
          <h3 style="margin:0;">Gerar Dados Fictícios em Massa</h3>
        </div>
        <p class="text-secondary mb-6">Gera e sobrescreve metas, atividades, rastreamento e o cronograma semanal para TODOS os padeiros atuais. Útil para preencher todos os dashboards simultaneamente.</p>
        
        <button class="btn btn-primary w-full" onclick="Dev.seedAllData()" style="background: var(--primary);">
          <i data-lucide="layers"></i> Gerar Todos os Dados
        </button>
      </div>

      <div class="card">
        <div class="flex items-center gap-3 mb-4">
          <i data-lucide="info" class="text-blue"></i>
          <h3 style="margin:0; font-size:16px;">Status do Sistema</h3>
        </div>
        <div id="system-stats-dev" class="text-secondary" style="font-size:14px;">
          Carregando informações...
        </div>
      </div>
    </div>`;
    
    this.loadStats();
    Components.renderIcons();
  },

  async loadStats() {
    try {
      const [padeiros, metas, atividades, avaliacoes] = await Promise.all([
        API.get('/api/padeiros'),
        API.get('/api/metas'),
        API.get('/api/atividades'),
        API.get('/api/avaliacoes')
      ]);
      const el = document.getElementById('system-stats-dev');
      if (el) {
        el.innerHTML = `
          <ul style="list-style:none; padding:0; display:flex; flex-direction:column; gap:8px;">
            <li>• Total de Padeiros: <strong>${padeiros.length}</strong></li>
            <li>• Total de Metas: <strong>${metas.length}</strong></li>
            <li>• Total de Atividades: <strong>${atividades.length}</strong></li>
            <li>• Total de Avaliações: <strong>${avaliacoes.length}</strong></li>
          </ul>
        `;
      }
    } catch(e) {
      const el = document.getElementById('system-stats-dev');
      if (el) el.innerHTML = 'Erro ao carregar estatísticas: ' + e.message;
    }
  },

  async resetMetas() {
    if (confirm('Deseja realmente apagar TODAS as metas?')) {
      try {
        await API.delete('/api/metas/reset/all');
        Components.toast('Metas resetadas!', 'success');
        this.render();
      } catch(e) { Components.toast(e.message, 'error'); }
    }
  },

  async resetAtividades() {
    if (confirm('Deseja realmente apagar TODAS as atividades? Isso removerá o histórico de produção.')) {
      try {
        await API.delete('/api/atividades/reset/all');
        Components.toast('Atividades resetadas!', 'success');
        this.render();
      } catch(e) { Components.toast(e.message, 'error'); }
    }
  },

  async resetAvaliacoes() {
    if (confirm('Deseja realmente apagar TODAS as avaliações?')) {
      try {
        await API.delete('/api/avaliacoes/reset/all');
        Components.toast('Avaliações resetadas!', 'success');
        this.render();
      } catch(e) { Components.toast(e.message, 'error'); }
    }
  },

  async resetRastreamento() {
    if (confirm('Deseja realmente apagar TODO o histórico de rastreamento?')) {
      if (confirm('Atenção: Esta ação é irreversível e apagará todas as coordenadas e trajetos. Confirmar exclusão?')) {
        try {
          await API.delete('/api/tracking/reset/all');
          Components.toast('Rastreamento resetado!', 'success');
          this.render();
        } catch(e) { Components.toast(e.message, 'error'); }
      }
    }
  },

  async resetPadeiros() {
    if (confirm('Deseja realmente apagar TODOS os padeiros e seus dados?')) {
      if (confirm('Atenção: Ação irreversível! Apagará padeiros, atividades, avaliações, metas. Continuar?')) {
        try {
          await API.delete('/api/padeiros/reset/all');
          Components.toast('Padeiros resetados!', 'success');
          this.render();
        } catch(e) { Components.toast(e.message, 'error'); }
      }
    }
  },

  async seedPadeiro() {
    const cargo = document.getElementById('seed-cargo').value;
    const filial = document.getElementById('seed-filial').value;
    
    try {
      Components.toast('Gerando padeiro fictício...', 'info');
      await API.post('/api/padeiros/seed', { cargo, filial });
      Components.toast('Padeiro gerado com sucesso!', 'success');
      this.render();
    } catch(e) {
      Components.toast(e.message || 'Erro ao gerar padeiro', 'error');
    }
  },

  async seedAllData() {
    if (confirm('Deseja gerar dados em massa para todos os padeiros? Isso apagará o cronograma e rastreamentos atuais.')) {
      try {
        Components.toast('Gerando dados em massa, aguarde...', 'info');
        await API.post('/api/padeiros/seed-all');
        Components.toast('Dados gerados com sucesso!', 'success');
        this.render();
      } catch(e) {
        Components.toast(e.message || 'Erro ao gerar dados', 'error');
      }
    }
  }
};
