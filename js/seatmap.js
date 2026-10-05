/* =========================================================
   Mapa de lugares
   mode: 'buy'  -> comprador seleciona lugares (estilo Embarca Aí)
         'view' -> organizador vê a ocupação
         'edit' -> organizador desenha o local
   ========================================================= */
const SeatMap = {
  render(el, venue, opts = {}) {
    const mode = opts.mode || 'buy';
    const sold = opts.sold || {};
    const sel = opts.selected || new Set();
    const L = Venue.labels(venue);
    const cols = venue.cells[0]?.length || 0;

    let h = `<div class="sm sm-${mode}"><div class="sm-scroll"><div class="sm-inner"><div class="sm-frame">
      <div class="sm-stage"><span>${esc(venue.stage || 'Palco')}</span></div>
      <div class="sm-grid" style="grid-template-columns: var(--lbl) repeat(${cols}, var(--seat-w)) var(--lbl)">`;
    venue.cells.forEach((row, r) => {
      const letter = L.rows[r] || '';
      h += `<div class="sm-lbl">${letter}</div>`;
      row.forEach((cell, c) => { h += this.cellHTML(venue, cell, r, c, mode, sold, sel, L); });
      h += `<div class="sm-lbl">${letter}</div>`;
    });
    h += `</div></div></div></div></div>`;
    el.innerHTML = h;

    if (mode === 'buy' && !el._buyBound) {
      el._buyBound = true;
      el.addEventListener('click', e => {
        const b = e.target.closest('.seat[data-id]');
        if (b && !b.disabled) el._onToggle?.(b.dataset.id);
      });
    }
    el._onToggle = opts.onToggle;
  },

  cellHTML(venue, cell, r, c, mode, sold, sel, L) {
    const id = `${r}-${c}`;
    if (mode === 'edit') {
      if (cell.t === 'aisle') return `<div class="cell aisle" data-r="${r}" data-c="${c}"></div>`;
      if (cell.t === 'blocked') return `<div class="cell blocked" data-r="${r}" data-c="${c}" title="Bloqueado (não vendido)">×</div>`;
      const s = Venue.sector(venue, cell.s);
      return `<div class="cell seat-e" style="--sc:${s.cor}" data-r="${r}" data-c="${c}" title="${esc(s.nome)}">${L?.num[id] ?? ''}</div>`;
    }
    if (cell.t === 'aisle') return `<div class="sm-gap"></div>`;
    const label = L.full(id);
    if (cell.t === 'blocked' || sold[id]) {
      return `<button class="seat off" disabled title="${label} — indisponível">X</button>`;
    }
    const s = Venue.sector(venue, cell.s);
    const on = sel.has(id) ? ' sel' : '';
    return `<button class="seat${on}" data-id="${id}" style="--sc:${s.cor}" ${mode === 'view' ? 'tabindex="-1"' : ''}
      title="Fileira ${L.rows[r]}, assento ${L.num[id]} — ${esc(s.nome)} — ${brl(s.preco)}"><b>${label}</b><small>${brlShort(s.preco)}</small></button>`;
  },

  /** Pintura por clique/arraste no editor (mouse e toque) */
  attachPainter(el, venue, getTool, onEnd) {
    let painting = false;
    const apply = target => {
      const cellEl = target?.closest?.('.cell[data-r]');
      if (!cellEl || !el.contains(cellEl)) return;
      const r = +cellEl.dataset.r, c = +cellEl.dataset.c;
      const tool = getTool();
      const cur = venue.cells[r][c];
      if (cur.t === tool.t && cur.s === tool.s) return;
      venue.cells[r][c] = tool.t === 'aisle' ? { t: 'aisle' } : { t: tool.t, s: tool.s || cur.s || venue.sectors[0].id };
      cellEl.outerHTML = this.cellHTML(venue, venue.cells[r][c], r, c, 'edit', {}, null, null);
    };
    el.addEventListener('pointerdown', e => {
      if (!e.target.closest('.cell[data-r]') || getTool().t === 'pan') return;
      e.preventDefault();
      painting = true;
      apply(e.target);
    });
    el.addEventListener('pointermove', e => {
      if (painting) apply(document.elementFromPoint(e.clientX, e.clientY));
    });
    const stop = () => { if (painting) { painting = false; onEnd(); } };
    window.addEventListener('pointerup', stop);
    window.addEventListener('pointercancel', stop);
  },
};
