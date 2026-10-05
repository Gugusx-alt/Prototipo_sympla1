renderChrome('eventos');
const list = document.getElementById('list');
document.getElementById('sub').textContent = 'Acompanhe as vendas e a ocupação dos eventos que você produz.';

function render() {
  const mine = Store.events().filter(e => e.own);
  if (!mine.length) {
    list.innerHTML = `<div class="empty">Você ainda não criou eventos.<br><br><a class="btn" href="criar-evento.html">Criar meu primeiro evento</a></div>`;
    return;
  }
  list.innerHTML = mine.map(ev => {
    const cap = capacity(ev);
    const receita = revenue(ev);
    const pct = cap.total ? Math.round(cap.vendidos / cap.total * 100) : 0;
    return `<div class="org-card" data-id="${ev.id}">
      <div class="org-top">
        <div class="thumb">${posterHTML(ev)}</div>
        <div class="org-info">
          <h3 style="font-size:19px;font-weight:900">${esc(ev.titulo)}</h3>
          <span class="muted">${esc(fmtRange(ev))} · ${esc(ev.local)}, ${esc(ev.cidade)} - ${esc(ev.uf)}</span>
          <div class="stats" style="margin-top:4px">
            <div class="stat"><small>Vendidos</small><b>${cap.vendidos} / ${cap.total}</b></div>
            <div class="stat"><small>Receita (você recebe)</small><b>${brl(receita)}</b></div>
            <div class="stat"><small>Tipo</small><b style="font-size:15px">${ev.tipo === 'mapa' ? 'Lugar marcado' : 'Ingresso geral'}</b></div>
          </div>
          <div class="bar" title="${pct}% vendido"><i style="width:${pct}%"></i></div>
          <div class="org-actions">
            <a class="btn btn-sm" href="evento.html?id=${ev.id}">Ver página do evento</a>
            ${ev.tipo === 'mapa' ? `<button class="btn btn-soft btn-sm" data-map>Mapa de ocupação</button>` : ''}
            <button class="btn btn-danger btn-sm" data-del>Excluir</button>
          </div>
        </div>
      </div>
      <div class="org-map hidden"></div>
    </div>`;
  }).join('');

  list.querySelectorAll('[data-map]').forEach(b => b.onclick = () => {
    const card = b.closest('.org-card');
    const box = card.querySelector('.org-map');
    const ev = Store.event(card.dataset.id);
    box.classList.toggle('hidden');
    if (!box.classList.contains('hidden')) {
      const st = Venue.stats(ev.venue, ev.sold);
      box.innerHTML = `<div class="sector-pills">${ev.venue.sectors.filter(s => st.per[s.id]?.total).map(s =>
        `<span class="sector-pill"><i style="background:${s.cor}"></i>${esc(s.nome)}: <b>${st.per[s.id].vendidos}/${st.per[s.id].total}</b></span>`).join('')}</div>
        <div class="legend"><span><i></i>Disponível</span><span><i class="off">X</i>Vendido / bloqueado</span></div><div class="m"></div>`;
      SeatMap.render(box.querySelector('.m'), ev.venue, { mode: 'view', sold: ev.sold });
    }
  });
  list.querySelectorAll('[data-del]').forEach(b => b.onclick = () => {
    const id = b.closest('.org-card').dataset.id;
    if (confirm('Excluir este evento? Os ingressos vendidos dele também serão removidos.')) { Store.remove(id); render(); }
  });
}

/** Receita do organizador a partir do que foi vendido (sem a taxa, que fica com a plataforma) */
function revenue(ev) {
  if (ev.tipo === 'mapa') {
    return Object.keys(ev.sold).reduce((a, id) => {
      const [r, c] = id.split('-').map(Number);
      return a + Number(Venue.sector(ev.venue, ev.venue.cells[r][c].s).preco);
    }, 0);
  }
  return ev.lotes.reduce((a, l) => a + l.preco * (l.vendidos || 0), 0);
}

render();
