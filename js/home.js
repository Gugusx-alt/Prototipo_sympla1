renderChrome('home');
const $ = id => document.getElementById(id);
$('ic-search').innerHTML = ICON.search;
$('ic-pin').innerHTML = ICON.pin;
const taxa = Math.round(CONFIG.taxa * 100) + '%';
$('hero-points').innerHTML = `
  <span>${ICON.seat}Escolha a poltrona no mapa</span>
  <span>${ICON.ticket}Ingresso no celular</span>
  <span>${ICON.shield}Taxa de serviço de ${taxa}</span>`;
$('producer-points').innerHTML = [
  'Monte o mapa do seu local com setores, corredores e lugares bloqueados',
  `Defina um preço por setor; a taxa de ${taxa} é paga pelo comprador`,
  'Acompanhe as vendas e a ocupação em tempo real',
].map(t => `<li>${ICON.check}<span>${t}</span></li>`).join('');

const all = [...Store.events()].sort((a, b) => (a.dataIni || '').localeCompare(b.dataIni || ''));
const state = { q: '', city: '', cat: '' };

/* ---------- Busca e filtros ---------- */
const citySel = $('city');
[...new Set(all.map(e => `${e.cidade} - ${e.uf}`))].sort().forEach(c => citySel.add(new Option(c, c)));
citySel.onchange = () => { state.city = citySel.value; renderGrid(); };
$('q').addEventListener('input', e => { state.q = e.target.value.trim().toLowerCase(); renderGrid(); });
$('finder').onsubmit = e => { e.preventDefault(); renderGrid(); $('agenda').scrollIntoView({ behavior: 'smooth' }); };

const chips = $('chips');
const cats = ['', ...CATEGORIAS.filter(c => all.some(e => e.categoria === c))];
chips.innerHTML = cats.map(c => `<button class="chip ${c === '' ? 'on' : ''}" data-c="${c}">${c || 'Tudo'}</button>`).join('');
chips.onclick = e => {
  const b = e.target.closest('.chip'); if (!b) return;
  state.cat = b.dataset.c;
  chips.querySelectorAll('.chip').forEach(x => x.classList.toggle('on', x === b));
  renderGrid();
};

function cardHTML(ev) {
  const cap = capacity(ev);
  const esgotado = cap.total > 0 && cap.vendidos >= cap.total;
  return `<a class="card" href="evento.html?id=${ev.id}">
    <div class="thumb">${posterHTML(ev)}</div>
    <div class="card-body">
      ${dateBox(ev)}
      <div class="card-main">
        <h4>${esc(ev.titulo)}</h4>
        <span class="loc">${esc(ev.local)} · ${esc(ev.cidade)} - ${esc(ev.uf)}</span>
        <span class="loc">${esc(fmtRange(ev))} · ${esc(ev.hora)}</span>
      </div>
    </div>
    <div class="card-foot">
      <span class="tag ${ev.tipo === 'mapa' ? 'blue' : ''}">${ev.tipo === 'mapa' ? 'Lugar marcado' : 'Ingresso geral'}</span>
      <span>${esgotado ? '<b>Esgotado</b>' : `a partir de <b>${brl(minPrice(ev))}</b>`}</span>
    </div></a>`;
}

function renderGrid() {
  const list = all.filter(e =>
    (!state.city || `${e.cidade} - ${e.uf}` === state.city) &&
    (!state.cat || e.categoria === state.cat) &&
    (!state.q || `${e.titulo} ${e.local} ${e.cidade} ${e.categoria}`.toLowerCase().includes(state.q)));
  $('list-title').textContent = state.q || state.city ? `${list.length} resultado(s)` : 'Agenda';
  $('grid').innerHTML = list.length ? list.map(cardHTML).join('')
    : `<div class="empty" style="grid-column:1/-1">Nenhum evento encontrado. Tente outra busca.</div>`;
}

/* ---------- Destaque (um evento por vez) ---------- */
const featured = all.slice(0, 6);
let cur = 0, timer;
function spot(i) {
  cur = (i + featured.length) % featured.length;
  const ev = featured[cur];
  $('spotlight').innerHTML = `
    <a class="spot-media" href="evento.html?id=${ev.id}">${posterHTML(ev)}</a>
    <div class="spot-body">
      ${dateBox(ev)}
      <div style="min-width:0"><p class="eyebrow">Em destaque</p><h3>${esc(ev.titulo)}</h3><p>${esc(ev.local)} · ${esc(ev.cidade)}</p></div>
      <div class="spot-nav"><button id="sp-prev" aria-label="Anterior">${ICON.left}</button>
        <span>${cur + 1}/${featured.length}</span>
        <button id="sp-next" aria-label="Próximo">${ICON.right}</button></div>
    </div>`;
  $('sp-prev').onclick = () => spot(cur - 1);
  $('sp-next').onclick = () => spot(cur + 1);
  clearInterval(timer);
  timer = setInterval(() => spot(cur + 1), 7000);
}

/* Trilho deslizável de destaques (versão celular) */
$('rail').innerHTML = featured.map(ev => `<a class="rail-item" href="evento.html?id=${ev.id}">
  <div class="rail-media">${posterHTML(ev)}</div>
  <b>${esc(ev.titulo)}</b><span>${esc(fmtShort(ev))} · ${esc(ev.cidade)}</span></a>`).join('');

/* ---------- Ilustração do mapa na seção de produtores ---------- */
const demo = Venue.template('teatro');
const sold = {};
const r = rng(7);
demo.cells.forEach((row, ri) => row.forEach((c, ci) => { if (c.t === 'seat' && r() < .3) sold[`${ri}-${ci}`] = true; }));
SeatMap.render($('producer-map'), demo, { mode: 'view', sold });

spot(0);
renderGrid();
