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
      const [metas, atividades, avaliacoes] = await Promise.all([
        API.get('/api/metas'),
        API.get('/api/atividades'),
        API.get('/api/avaliacoes')
      ]);
      document.getElementById('system-stats-dev').innerHTML = `
        <ul style="list-style:none; padding:0; display:flex; flex-direction:column; gap:8px;">
          <li>• Total de Metas: <strong>${metas.length}</strong></li>
          <li>• Total de Atividades: <strong>${atividades.length}</strong></li>
          <li>• Total de Avaliações: <strong>${avaliacoes.length}</strong></li>
        </ul>
      `;
    } catch(e) {
      document.getElementById('system-stats-dev').innerHTML = 'Erro ao carregar estatísticas: ' + e.message;
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
  }
};
