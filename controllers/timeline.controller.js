const { TimelineEvent, Atividade } = require('../data/db-adapter');

exports.getTimelineEvents = async (req, res, next) => {
  try {
    const { padeiroId } = req.params;
    const { date } = req.query; // optional date filter (YYYY-MM-DD)
    
    // Pegamos todos os eventos deste padeiro
    let events = await TimelineEvent.find({ padeiroId });
    
    if (date) {
      events = events.filter(e => e.timestamp && e.timestamp.startsWith(date));
    }
    
    // Sort chronologically
    events.sort((a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime());

    // Se há eventos sem clienteNome, tenta preencher cruzando com atividades do dia
    const needsClient = events.some(e => !e.clienteNome);
    if (needsClient && date) {
      try {
        const atividades = await Atividade.find({ padeiroId });
        const atividadesDoDia = atividades.filter(a => a.data === date);
        
        if (atividadesDoDia.length > 0) {
          // Ordena atividades por inicioEm para poder associar eventos ao cliente correto
          atividadesDoDia.sort((a, b) => {
            const tA = a.inicioEm ? new Date(a.inicioEm).getTime() : 0;
            const tB = b.inicioEm ? new Date(b.inicioEm).getTime() : 0;
            return tA - tB;
          });

          events.forEach(ev => {
            if (!ev.clienteNome) {
              // Tenta associar pelo timestamp: encontra a atividade cuja janela engloba o evento
              const evTime = new Date(ev.timestamp).getTime();
              let matched = null;

              for (let i = 0; i < atividadesDoDia.length; i++) {
                const atv = atividadesDoDia[i];
                const inicio = atv.inicioEm ? new Date(atv.inicioEm).getTime() : 0;
                const fim = atv.fimEm ? new Date(atv.fimEm).getTime() : 
                            atv.terminadoEm ? new Date(atv.terminadoEm).getTime() : Infinity;
                
                if (evTime >= inicio && evTime <= fim) {
                  matched = atv;
                  break;
                }
              }

              // Se não achou pela janela, pega a mais próxima
              if (!matched) {
                let minDist = Infinity;
                for (const atv of atividadesDoDia) {
                  const inicio = atv.inicioEm ? new Date(atv.inicioEm).getTime() : 0;
                  const dist = Math.abs(evTime - inicio);
                  if (dist < minDist) {
                    minDist = dist;
                    matched = atv;
                  }
                }
              }

              if (matched && matched.clienteNome) {
                ev.clienteNome = matched.clienteNome;
                ev.clienteId = matched.clienteId;
              }
            }
          });
        }
      } catch (e) {
        console.warn('Não foi possível cruzar atividades com timeline:', e.message);
      }
    }
    
    res.json(events);
  } catch (err) {
    next(err);
  }
};
