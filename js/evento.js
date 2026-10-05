renderChrome();
const app = document.getElementById('app');
const ev = Store.event(qs('id'));

const selected = new Set();   // lugares marcados: "r-c"
const qty = {};               // ingresso geral: loteId -> quantidade

if (!ev) {
  app.innerHTML = `<main class="container section"><div class="empty">Evento não encontrado. <a href="index.html" style="color:var(--primary)">Voltar para a home</a></div></main>`;
} else {
  document.title = `${ev.titulo} — ${CONFIG.nome}`;
  renderPage();
}

function renderPage() {
  app.innerHTML = `
    <section class="container ev-head">
      <div class="poster-box">${posterHTML(ev)}</div>
      <div>
        <p class="eyebrow">${esc(ev.categoria)}${ev.kicker ? ' · ' + esc(ev.kicker) : ''}</p>
        <h1 class="ev-title">${esc(ev.titulo)}</h1>
        <div class="ev-facts">
          <div class="ev-fact">${dateBox(ev)}<div><b>${esc(fmtRange(ev))}</b><span>Abertura às ${esc(ev.hora)}</span></div></div>
          <div class="ev-fact"><span class="ic">${ICON.pin}</span><div><b>${esc(ev.local)}</b><span>${ev.endereco ? esc(ev.endereco) + ' — ' : ''}${esc(ev.cidade)} - ${esc(ev.uf)}</span></div></div>
          <div class="ev-fact"><span class="ic">${ev.tipo === 'mapa' ? ICON.seat : ICON.ticket}</span><div><b>A partir de ${brl(minPrice(ev))}</b><span>${ev.tipo === 'mapa' ? 'Lugar marcado — escolha sua poltrona abaixo' : 'Ingresso geral'}</span></div></div>
        </div>
      </div>
    </section>
    <main class="container ev-layout">
      <div>
        <div class="ev-block" id="ingressos" style="margin-top:8px"></div>
        <div class="ev-block"><h3>Sobre o evento</h3><p class="ev-desc">${esc(ev.descricao || 'Sem descrição.')}</p></div>
      </div>
      <aside class="summary" id="summary"></aside>
    </main>
    <div class="buybar" id="buybar"></div>`;
  if (ev.tipo === 'mapa') renderSeats(); else renderLotes();
  renderSummary();
}

/* ---------- Lugar marcado ---------- */
function renderSeats() {
  const box = document.getElementById('ingressos');
  const st = Venue.stats(ev.venue, ev.sold);
  box.innerHTML = `<h3>Escolha seus lugares</h3>
    <p class="trecho">Selecione seu lugar em: <b>${esc(ev.local.toUpperCase())}</b> &nbsp;»&nbsp; <b>${esc(ev.cidade.toUpperCase())} - ${esc(ev.uf)}</b></p>
    <p class="trecho">Abertura: <b>${esc(ev.hora)}</b> &nbsp; Lugares disponíveis: <b>${st.capacidade - st.vendidos}</b></p>
    <div class="sector-pills" style="margin-top:12px">${ev.venue.sectors.filter(s => st.per[s.id]?.total).map(s =>
      `<span class="sector-pill"><i style="background:${s.cor}"></i>${esc(s.nome)} · <b>${brl(s.preco)}</b></span>`).join('')}</div>
    <div class="legend">
      <span><i></i>Disponível</span><span><i class="sel"></i>Selecionado</span><span><i class="off">X</i>Ocupado</span>
    </div>
    <p class="swipe-hint">Deslize para os lados para ver o mapa inteiro</p>
    <div id="map"></div>`;
  drawMap();
}
function drawMap() {
  SeatMap.render(document.getElementById('map'), ev.venue, {
    mode: 'buy', sold: ev.sold, selected,
    onToggle: id => {
      if (selected.has(id)) selected.delete(id);
      else if (selected.size >= CONFIG.maxPorCompra) return toast(`Você pode selecionar até ${CONFIG.maxPorCompra} lugares por compra.`);
      else selected.add(id);
      drawMap(); renderSummary();
    },
  });
}

/* ---------- Ingresso geral ---------- */
function renderLotes() {
  const box = document.getElementById('ingressos');
  box.innerHTML = `<h3>Ingressos</h3>` + ev.lotes.map(l => {
    const rest = l.qtd - (l.vendidos || 0);
    const q = qty[l.id] || 0;
    return `<div class="lote">
      <div><h4>${esc(l.nome)}</h4><div><b>${brl(l.preco)}</b> <span class="muted">+ ${brl(l.preco * CONFIG.taxa)} taxa</span></div>
        <small class="muted">${rest > 0 ? `${rest} disponíveis` : 'Esgotado'}</small></div>
      ${rest > 0 ? `<div class="stepper">
        <button data-l="${l.id}" data-d="-1" ${q === 0 ? 'disabled' : ''}>−</button><span>${q}</span>
        <button data-l="${l.id}" data-d="1" ${q >= rest || totalQty() >= CONFIG.maxPorCompra ? 'disabled' : ''}>+</button></div>`
        : '<span class="tag">Esgotado</span>'}
    </div>`;
  }).join('');
  box.onclick = e => {
    const b = e.target.closest('button[data-l]'); if (!b) return;
    qty[b.dataset.l] = Math.max(0, (qty[b.dataset.l] || 0) + Number(b.dataset.d));
    renderLotes(); renderSummary();
  };
}
const totalQty = () => Object.values(qty).reduce((a, b) => a + b, 0);

/* ---------- Resumo / carrinho ---------- */
function cartItems() {
  if (ev.tipo === 'mapa') {
    const L = Venue.labels(ev.venue);
    return [...selected].map(id => {
      const [r, c] = id.split('-').map(Number);
      const s = Venue.sector(ev.venue, ev.venue.cells[r][c].s);
      return { id, nome: `Lugar ${L.full(id)}`, setor: s.nome, cor: s.cor, preco: Number(s.preco), un: 1 };
    });
  }
  return ev.lotes.filter(l => qty[l.id]).map(l => ({ id: l.id, nome: l.nome, setor: '', cor: '#0a7cff', preco: Number(l.preco), un: qty[l.id] }));
}
function totals(items) {
  const sub = items.reduce((a, i) => a + i.preco * i.un, 0);
  const taxa = Math.round(sub * CONFIG.taxa * 100) / 100;
  return { sub, taxa, total: sub + taxa, qtd: items.reduce((a, i) => a + i.un, 0) };
}

function renderSummary() {
  const box = document.getElementById('summary');
  const items = cartItems();
  const t = totals(items);
  box.innerHTML = `<h3>Resumo do pedido</h3>
    ${items.length ? `<div class="sum-list">${items.map(i => `
      <div class="sum-item"><span><i class="dot" style="background:${i.cor}"></i><b>${esc(i.nome)}</b>${i.un > 1 ? ` × ${i.un}` : ''}
        ${i.setor ? `<br><small class="muted" style="margin-left:16px">${esc(i.setor)}</small>` : ''}</span>
        <span>${brl(i.preco * i.un)} ${ev.tipo === 'mapa' ? `<button data-rm="${i.id}" title="Remover">×</button>` : ''}</span></div>`).join('')}</div>`
      : `<p class="muted">${ev.tipo === 'mapa' ? 'Clique nos lugares do mapa para selecioná-los.' : 'Escolha a quantidade de ingressos.'}</p>`}
    <div class="sum-rows">
      <div><span>Subtotal (${t.qtd})</span><span>${brl(t.sub)}</span></div>
      <div><span>Taxa de serviço (${Math.round(CONFIG.taxa * 100)}%)</span><span>${brl(t.taxa)}</span></div>
      <div class="total"><span>Total</span><span>${brl(t.total)}</span></div>
    </div>
    <button class="btn btn-block" id="buy" ${items.length ? '' : 'disabled'}>Comprar ingressos</button>
    <div class="fee-note">${ICON.shield} Compra segura · taxa menor que a média do mercado</div>`;
  box.querySelectorAll('[data-rm]').forEach(b => b.onclick = () => { selected.delete(b.dataset.rm); drawMap(); renderSummary(); });
  box.querySelector('#buy').onclick = checkout;
  renderBuybar(items, t);
}

/* Barra de compra fixa (celular): resume a seleção e leva ao checkout */
function renderBuybar(items, t) {
  const bar = document.getElementById('buybar');
  const what = !items.length
    ? (ev.tipo === 'mapa' ? 'Toque nos lugares para escolher' : 'Escolha a quantidade')
    : ev.tipo === 'mapa' ? items.map(i => i.nome.replace('Lugar ', '')).join(', ') : `${t.qtd} ingresso(s)`;
  bar.innerHTML = `<div class="bb-info"><small>${esc(what)}</small><b>${items.length ? brl(t.total) : `a partir de ${brl(minPrice(ev))}`}</b></div>
    <button class="btn" ${items.length ? '' : 'disabled'}>Comprar</button>`;
  bar.querySelector('button').onclick = checkout;
}

/* ---------- Checkout simulado ---------- */
function checkout() {
  const items = cartItems();
  const t = totals(items);
  let pay = 'pix';
  const m = openModal(`
    <h3>Finalizar compra</h3>
    <p class="muted" style="margin:0 0 18px">${esc(ev.titulo)} · ${t.qtd} ingresso(s)</p>
    <form id="co" class="form-grid">
      <div class="field full"><label>Nome completo</label><input name="nome" required placeholder="Como no documento"></div>
      <div class="field"><label>E-mail</label><input name="email" type="email" required placeholder="voce@email.com"></div>
      <div class="field"><label>CPF</label><input name="cpf" required placeholder="000.000.000-00" inputmode="numeric"></div>
      <div class="field full"><label>Pagamento</label>
        <div class="pay-opts"><button type="button" class="pay-opt on" data-p="pix">${ICON.pix} Pix</button><button type="button" class="pay-opt" data-p="cartao">${ICON.card} Cartão</button></div></div>
      <div class="full sum-rows" style="margin:0">
        <div><span>Subtotal</span><span>${brl(t.sub)}</span></div>
        <div><span>Taxa de serviço</span><span>${brl(t.taxa)}</span></div>
        <div class="total"><span>Total</span><span>${brl(t.total)}</span></div>
      </div>
      <div class="full" style="display:flex;gap:10px;justify-content:flex-end">
        <button type="button" class="btn btn-ghost" id="cancel">Cancelar</button>
        <button class="btn">Pagar ${brl(t.total)}</button>
      </div>
    </form>`);
  m.el.querySelector('#cancel').onclick = m.close;
  m.el.querySelectorAll('.pay-opt').forEach(b => b.onclick = () => {
    pay = b.dataset.p;
    m.el.querySelectorAll('.pay-opt').forEach(x => x.classList.toggle('on', x === b));
  });
  m.el.querySelector('#co').onsubmit = e => {
    e.preventDefault();
    const f = Object.fromEntries(new FormData(e.target));
    const tickets = [];
    const now = Date.now();
    items.forEach(i => {
      for (let k = 0; k < i.un; k++) {
        tickets.push({
          code: ('PLC-' + uid() + uid()).toUpperCase().slice(0, 14), evId: ev.id, titulo: ev.titulo,
          lugar: ev.tipo === 'mapa' ? i.nome.replace('Lugar ', '') : null, setor: ev.tipo === 'mapa' ? i.setor : i.nome,
          preco: i.preco, taxa: Math.round(i.preco * CONFIG.taxa * 100) / 100, nome: f.nome, email: f.email, pagamento: pay, compradoEm: now,
        });
      }
      if (ev.tipo === 'mapa') ev.sold[i.id] = true;
      else { const l = ev.lotes.find(x => x.id === i.id); l.vendidos = (l.vendidos || 0) + i.un; }
    });
    Store.upsert(ev);
    Store.addTickets(tickets);
    selected.clear(); Object.keys(qty).forEach(k => delete qty[k]);
    renderPage();
    m.el.innerHTML = `<div class="success">
      <div class="ok">${ICON.check}</div>
      <h3>Pagamento aprovado!</h3>
      <p class="muted">Enviamos ${tickets.length} ingresso(s) para <b>${esc(f.email)}</b>.</p>
      <div style="display:flex;gap:10px;justify-content:center;margin-top:18px;flex-wrap:wrap">
        <button class="btn btn-ghost" id="stay">Continuar no evento</button>
        <a class="btn" href="meus-ingressos.html">Ver meus ingressos</a>
      </div></div>`;
    m.el.querySelector('#stay').onclick = m.close;
  };
}
