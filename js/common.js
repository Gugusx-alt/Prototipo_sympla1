/* =========================================================
   Componentes compartilhados: ícones, topo, rodapé, modal, QR
   ========================================================= */
const svg = (d, extra = '') => `<svg class="icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" ${extra}>${d}</svg>`;
const ICON = {
  plus: svg('<circle cx="12" cy="12" r="9"/><path d="M12 8v8M8 12h8"/>'),
  cal: svg('<rect x="3" y="5" width="18" height="16" rx="2"/><path d="M16 3v4M8 3v4M3 10h18"/>'),
  ticket: svg('<path d="M3 8a2 2 0 0 0 2-2h14a2 2 0 0 0 2 2v2a2 2 0 0 0 0 4v2a2 2 0 0 0-2 2H5a2 2 0 0 0-2-2v-2a2 2 0 0 0 0-4z"/><path d="M13 6v12" stroke-dasharray="2 2"/>'),
  menu: svg('<path d="M4 7h16M4 12h16M4 17h16"/>'),
  search: svg('<circle cx="11" cy="11" r="7"/><path d="m20 20-3.5-3.5"/>'),
  pin: svg('<path d="M12 21s-7-6.2-7-12a7 7 0 0 1 14 0c0 5.8-7 12-7 12z"/><circle cx="12" cy="9" r="2.5"/>'),
  chevDown: svg('<path d="m6 9 6 6 6-6"/>', 'style="width:16px;height:16px"'),
  left: svg('<path d="m15 6-6 6 6 6"/>'),
  right: svg('<path d="m9 6 6 6-6 6"/>'),
  clock: svg('<circle cx="12" cy="12" r="9"/><path d="M12 7v5l3 2"/>'),
  check: svg('<path d="m5 12 5 5 9-10"/>'),
  seat: svg('<path d="M6 11V6a2 2 0 0 1 2-2h8a2 2 0 0 1 2 2v5"/><rect x="4" y="11" width="16" height="6" rx="2"/><path d="M6 17v3M18 17v3"/>'),
  users: svg('<circle cx="9" cy="8" r="3.5"/><path d="M2.5 20a6.5 6.5 0 0 1 13 0"/><circle cx="17" cy="9" r="2.5"/><path d="M16 14.5a5 5 0 0 1 5.5 5.5"/>'),
  shield: svg('<path d="M12 3 4 6v6c0 5 3.5 8 8 9 4.5-1 8-4 8-9V6z"/><path d="m9 12 2 2 4-4"/>'),
  pix: svg('<path d="m12 3 9 9-9 9-9-9z"/><path d="m8 12 4-4 4 4-4 4z"/>'),
  card: svg('<rect x="3" y="5" width="18" height="14" rx="2"/><path d="M3 10h18M7 15h4"/>'),
  image: svg('<rect x="3" y="4" width="18" height="16" rx="2"/><circle cx="9" cy="10" r="2"/><path d="m21 16-5-5-9 9"/>'),
};

function renderChrome(active) {
  const top = document.getElementById('topbar');
  if (top) {
    const link = (href, ic, txt, key, cls = '') => `<a href="${href}" class="${cls} ${active === key ? 'active' : ''}">${ic}<span>${txt}</span></a>`;
    top.className = 'topbar';
    top.innerHTML = `<div class="container topbar-in">
      <a class="logo" href="index.html"><i class="logo-mark"></i>${CONFIG.nome}</a>
      <nav class="nav">
        ${link('meus-ingressos.html', ICON.ticket, 'Meus ingressos', 'ingressos')}
        ${link('meus-eventos.html', ICON.cal, 'Meus eventos', 'eventos')}
        ${link('criar-evento.html', ICON.plus, 'Criar evento', 'criar', 'nav-cta')}
        <span class="avatar" title="Conta (protótipo)">EU</span>
      </nav></div>`;
  }
  const foot = document.getElementById('foot');
  if (foot) {
    foot.className = 'foot';
    foot.innerHTML = `<div class="container">
      <span>© ${new Date().getFullYear()} ${CONFIG.nome} — protótipo navegável. Taxa de serviço de ${Math.round(CONFIG.taxa * 100)}%.</span>
      <button id="reset-demo">Restaurar dados de demonstração</button></div>`;
    foot.querySelector('#reset-demo').onclick = () => {
      if (confirm('Apagar eventos criados e ingressos comprados, voltando aos dados de exemplo?')) { Store.reset(); location.href = 'index.html'; }
    };
  }
}

function openModal(html) {
  const bg = document.createElement('div');
  bg.className = 'modal-bg';
  bg.innerHTML = `<div class="modal">${html}</div>`;
  bg.addEventListener('click', e => { if (e.target === bg) close(); });
  const onKey = e => { if (e.key === 'Escape') close(); };
  document.addEventListener('keydown', onKey);
  document.body.appendChild(bg);
  function close() { bg.remove(); document.removeEventListener('keydown', onKey); }
  return { el: bg.querySelector('.modal'), close };
}

/** QR "de mentira" (visual) gerado a partir do código do ingresso */
function qrSVG(text) {
  const N = 25, r = rng(hash(text));
  const finder = (x, y) => {
    const inF = (fx, fy) => x >= fx && x < fx + 7 && y >= fy && y < fy + 7;
    for (const [fx, fy] of [[0, 0], [N - 7, 0], [0, N - 7]]) {
      if (inF(fx, fy)) {
        const dx = x - fx, dy = y - fy;
        return dx === 0 || dy === 0 || dx === 6 || dy === 6 || (dx >= 2 && dx <= 4 && dy >= 2 && dy <= 4) ? 1 : 0;
      }
    }
    if ((x < 8 && y < 8) || (x > N - 9 && y < 8) || (x < 8 && y > N - 9)) return 0;
    return -1;
  };
  let rects = '';
  for (let y = 0; y < N; y++) for (let x = 0; x < N; x++) {
    const f = finder(x, y);
    if (f === 1 || (f === -1 && r() < .5)) rects += `<rect x="${x}" y="${y}" width="1" height="1"/>`;
  }
  return `<svg viewBox="-1 -1 ${N + 2} ${N + 2}" shape-rendering="crispEdges"><rect x="-1" y="-1" width="${N + 2}" height="${N + 2}" fill="#fff"/><g fill="#111">${rects}</g></svg>`;
}
