/* =========================================================
   Configuração, utilitários, modelo do mapa e armazenamento
   ========================================================= */
const CONFIG = {
  nome: 'Palco',          // nome provisório da plataforma
  taxa: 0.05,             // taxa de serviço cobrada do comprador (5%)
  maxPorCompra: 8,        // limite de ingressos por compra
};

const MESES = ['Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun', 'Jul', 'Ago', 'Set', 'Out', 'Nov', 'Dez'];
const SEMANA = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'];
const CATEGORIAS = ['Show', 'Festa', 'Teatro', 'Stand-up', 'Palestra', 'Esporte', 'Infantil'];
const UFS = ['AC','AL','AP','AM','BA','CE','DF','ES','GO','MA','MT','MS','MG','PA','PB','PR','PE','PI','RJ','RN','RS','RO','RR','SC','SP','SE','TO'];
const CORES_SETOR = ['#6d5a8c', '#4f7a8a', '#b5865a', '#6f8f6a', '#a8665a', '#5d6f8f', '#8c7a5b', '#7c6a7a'];

const esc = s => String(s ?? '').replace(/[&<>"']/g, m => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[m]));
const brl = v => (Number(v) || 0).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
const brlShort = v => Number.isInteger(Number(v)) ? `R$ ${v}` : brl(v);
const uid = () => Math.random().toString(36).slice(2, 9);
const qs = k => new URLSearchParams(location.search).get(k);
const parseDate = s => { const [y, m, d] = s.split('-').map(Number); return new Date(y, m - 1, d); };
const pad = n => String(n).padStart(2, '0');

function fmtRange(ev) {
  if (!ev.dataIni) return 'Data a definir';
  const a = parseDate(ev.dataIni);
  const b = ev.dataFim ? parseDate(ev.dataFim) : a;
  const f = d => `${pad(d.getDate())} de ${MESES[d.getMonth()]}`;
  return +a === +b ? `${SEMANA[a.getDay()]}, ${f(a)}` : `${f(a)} a ${f(b)}`;
}
function fmtShort(ev) {
  if (!ev.dataIni) return '';
  const a = parseDate(ev.dataIni), b = ev.dataFim ? parseDate(ev.dataFim) : a;
  if (+a === +b) return `${pad(a.getDate())} ${MESES[a.getMonth()].toUpperCase()}`;
  if (a.getMonth() === b.getMonth()) return `${a.getDate()}-${b.getDate()} ${MESES[a.getMonth()].toUpperCase()}`;
  return `${a.getDate()} ${MESES[a.getMonth()].toUpperCase()} - ${b.getDate()} ${MESES[b.getMonth()].toUpperCase()}`;
}

function rowLetter(i) {
  let s = ''; i++;
  while (i > 0) { const m = (i - 1) % 26; s = String.fromCharCode(65 + m) + s; i = Math.floor((i - 1) / 26); }
  return s;
}

function rng(seed) {
  let s = seed >>> 0;
  return () => { s = (s * 1664525 + 1013904223) >>> 0; return s / 4294967296; };
}
function hash(str) {
  let h = 2166136261;
  for (const ch of str) { h ^= ch.charCodeAt(0); h = Math.imul(h, 16777619); }
  return h >>> 0;
}

/* ---------- Arte gerada para eventos sem banner (tons foscos) ---------- */
function artBg(art) {
  const { a, b, c, p } = art;
  const pat = {
    arcs: `repeating-radial-gradient(circle at 100% 100%, ${c}26 0 1px, transparent 1px 22px)`,
    lines: `repeating-linear-gradient(90deg, ${c}1f 0 1px, transparent 1px 16px)`,
    sun: `radial-gradient(circle at 78% 52%, ${c}d9 0 12%, transparent 12.3%), radial-gradient(circle at 78% 52%, ${c}2e 0 24%, transparent 24.3%)`,
    grid: `linear-gradient(${c}1c 1px, transparent 1px) 0 0 / 26px 26px, linear-gradient(90deg, ${c}1c 1px, transparent 1px) 0 0 / 26px 26px`,
    dots: `radial-gradient(${c}40 1.2px, transparent 1.7px) 0 0 / 14px 14px`,
  };
  return `${pat[p] || pat.arcs}, linear-gradient(160deg, ${a}, ${b})`;
}
const PALETAS = [
  { a: '#2f4b4a', b: '#55746e', c: '#ece2cc', p: 'arcs' },
  { a: '#4d4153', b: '#7e6c7c', c: '#efe3d3', p: 'lines' },
  { a: '#6e5038', b: '#a5825e', c: '#f3e9d8', p: 'sun' },
  { a: '#36414f', b: '#66778a', c: '#e6e1d6', p: 'grid' },
  { a: '#4f5c3f', b: '#83916b', c: '#f1ead9', p: 'dots' },
  { a: '#7a4a3f', b: '#a9705f', c: '#f4e6d8', p: 'arcs' },
  { a: '#2b3540', b: '#4f5b64', c: '#d9c6a5', p: 'sun' },
  { a: '#5e5246', b: '#8f8170', c: '#efe7da', p: 'lines' },
];
const randomArt = () => ({ ...PALETAS[Math.floor(Math.random() * PALETAS.length)] });

function posterHTML(ev) {
  if (ev.banner) return `<div class="poster"><img src="${ev.banner}" alt="${esc(ev.titulo)}"></div>`;
  const art = ev.art || PALETAS[0];
  const t = ev.titulo || 'Seu evento';
  const size = t.length > 26 ? 7.5 : t.length > 16 ? 9 : 11;
  return `<div class="poster" style="background:${artBg(art)};--pc:${art.c}">
    <div class="poster-in">
      <div class="p-top"><span>${esc(ev.kicker || ev.categoria || '')}</span><span>${esc(fmtShort(ev) || 'DATA')}</span></div>
      <span class="pt" style="font-size:${size}cqw">${esc(t)}</span>
      <span class="pc">${esc(ev.local || '')}${ev.local && ev.cidade ? ' · ' : ''}${esc(ev.cidade || '')}</span>
    </div></div>`;
}

/** Bloco de data estilo calendário */
function dateBox(ev) {
  if (!ev.dataIni) return '';
  const d = parseDate(ev.dataIni);
  return `<div class="datebox"><small>${MESES[d.getMonth()]}</small><b>${d.getDate()}</b><span>${SEMANA[d.getDay()]}</span></div>`;
}

/* =========================================================
   Modelo do local (mapa de lugares)
   cell = { t: 'seat', s: setorId } | { t: 'aisle' } | { t: 'blocked', s }
   ========================================================= */
const Venue = {
  template(tipo) {
    const mk = (rows, cols, fn, sectors, stage) => ({
      stage, sectors,
      cells: Array.from({ length: rows }, (_, r) => Array.from({ length: cols }, (_, c) => fn(r, c))),
    });
    if (tipo === 'auditorio') {
      const sectors = [
        { id: 'cen', nome: 'Central', cor: '#4f7a8a', preco: 90 },
        { id: 'lat', nome: 'Lateral', cor: '#6f8f6a', preco: 60 },
      ];
      return mk(10, 18, (r, c) => {
        if (c === 4 || c === 13) return { t: 'aisle' };
        return { t: 'seat', s: c > 4 && c < 13 ? 'cen' : 'lat' };
      }, sectors, 'Palco');
    }
    if (tipo === 'vazio') {
      return mk(8, 14, () => ({ t: 'seat', s: 'ger' }), [{ id: 'ger', nome: 'Geral', cor: '#4f7a8a', preco: 50 }], 'Palco');
    }
    // teatro
    const sectors = [
      { id: 'vip', nome: 'Plateia VIP', cor: '#6d5a8c', preco: 180 },
      { id: 'pla', nome: 'Plateia', cor: '#4f7a8a', preco: 120 },
      { id: 'fun', nome: 'Plateia Fundo', cor: '#b5865a', preco: 80 },
    ];
    return mk(12, 17, (r, c) => {
      if (c === 8) return { t: 'aisle' };
      if (r < 2 && (c < 2 || c > 14)) return { t: 'aisle' };
      return { t: 'seat', s: r < 3 ? 'vip' : r < 9 ? 'pla' : 'fun' };
    }, sectors, 'Palco');
  },

  /** Letras das fileiras e números dos assentos (contados da esquerda p/ direita) */
  labels(v) {
    const rows = {}, num = {};
    let letter = 0;
    v.cells.forEach((row, r) => {
      if (!row.some(c => c.t !== 'aisle')) return;
      rows[r] = rowLetter(letter++);
      let n = 0;
      row.forEach((cell, c) => { if (cell.t !== 'aisle') num[`${r}-${c}`] = ++n; });
    });
    return { rows, num, full: id => { const r = id.split('-')[0]; return `${rows[r]}${num[id]}`; } };
  },

  sector(v, id) { return v.sectors.find(s => s.id === id) || v.sectors[0]; },

  stats(v, sold = {}) {
    const per = Object.fromEntries(v.sectors.map(s => [s.id, { total: 0, vendidos: 0 }]));
    let bloqueados = 0;
    v.cells.forEach((row, r) => row.forEach((cell, c) => {
      if (cell.t === 'blocked') bloqueados++;
      if (cell.t !== 'seat') return;
      const p = per[cell.s] || (per[cell.s] = { total: 0, vendidos: 0 });
      p.total++;
      if (sold[`${r}-${c}`]) p.vendidos++;
    }));
    const capacidade = Object.values(per).reduce((a, p) => a + p.total, 0);
    const vendidos = Object.values(per).reduce((a, p) => a + p.vendidos, 0);
    const potencial = v.sectors.reduce((a, s) => a + (per[s.id]?.total || 0) * (Number(s.preco) || 0), 0);
    return { per, capacidade, vendidos, bloqueados, potencial };
  },
};

function minPrice(ev) {
  if (ev.tipo === 'mapa') {
    const st = Venue.stats(ev.venue);
    const ps = ev.venue.sectors.filter(s => st.per[s.id]?.total).map(s => Number(s.preco));
    return ps.length ? Math.min(...ps) : 0;
  }
  const ps = (ev.lotes || []).map(l => Number(l.preco));
  return ps.length ? Math.min(...ps) : 0;
}
function capacity(ev) {
  if (ev.tipo === 'mapa') { const s = Venue.stats(ev.venue, ev.sold); return { total: s.capacidade, vendidos: s.vendidos }; }
  return (ev.lotes || []).reduce((a, l) => ({ total: a.total + Number(l.qtd), vendidos: a.vendidos + Number(l.vendidos || 0) }), { total: 0, vendidos: 0 });
}

/* =========================================================
   Armazenamento (localStorage — só para o protótipo)
   ========================================================= */
const Store = {
  KEY: 'palco_prototipo_v2',
  _d: null,
  get data() {
    if (!this._d) {
      try { this._d = JSON.parse(localStorage.getItem(this.KEY)); } catch (e) { this._d = null; }
      if (!this._d) { this._d = { events: seedEvents(), tickets: [] }; this.save(); }
    }
    return this._d;
  },
  save() {
    try { localStorage.setItem(this.KEY, JSON.stringify(this._d)); return true; }
    catch (e) { alert('Não foi possível salvar: o armazenamento do navegador está cheio. Tente uma imagem de banner menor.'); return false; }
  },
  events() { return this.data.events; },
  event(id) { return this.data.events.find(e => e.id === id); },
  upsert(ev) {
    const i = this.data.events.findIndex(e => e.id === ev.id);
    if (i >= 0) this.data.events[i] = ev; else this.data.events.unshift(ev);
    return this.save();
  },
  remove(id) {
    this.data.events = this.data.events.filter(e => e.id !== id);
    this.data.tickets = this.data.tickets.filter(t => t.evId !== id);
    this.save();
  },
  tickets() { return this.data.tickets; },
  addTickets(list) { this.data.tickets.unshift(...list); this.save(); },
  reset() { localStorage.removeItem(this.KEY); this._d = null; },
};

function seedEvents() {
  const ev = (o) => ({ id: uid(), own: false, banner: null, sold: {}, lotes: [], venue: null, criadoEm: Date.now(), ...o });
  const withSold = (e, ratio) => {
    const r = rng(hash(e.titulo));
    e.venue.cells.forEach((row, ri) => row.forEach((c, ci) => { if (c.t === 'seat' && r() < ratio) e.sold[`${ri}-${ci}`] = true; }));
    return e;
  };
  const lotes = (arr) => arr.map(([nome, preco, qtd, vendidos]) => ({ id: uid(), nome, preco, qtd, vendidos }));

  const list = [
    ev({
      titulo: 'Ladeira Folia 2027', kicker: 'Olinda apresenta', categoria: 'Festa', cidade: 'Olinda', uf: 'PE',
      local: 'Largo do Amparo', endereco: 'Centro Histórico', dataIni: '2027-02-06', dataFim: '2027-02-10', hora: '16:00',
      descricao: 'Cinco dias de frevo, maracatu e muita festa nas ladeiras de Olinda.\nOpen bar nos camarotes e área de descanso climatizada.',
      art: PALETAS[0], tipo: 'geral',
      lotes: lotes([['Pista — 1º lote', 120, 800, 800], ['Pista — 2º lote', 150, 1200, 410], ['Camarote Open Bar', 390, 300, 122]]),
    }),
    withSold(ev({
      titulo: 'Sinfônica: Noite de Cinema', kicker: 'Orquestra convida', categoria: 'Show', cidade: 'Curitiba', uf: 'PR',
      local: 'Teatro Guaíra', endereco: 'R. Conselheiro Laurindo, 175', dataIni: '2026-11-21', dataFim: '2026-11-21', hora: '20:00',
      descricao: 'Trilhas sonoras clássicas do cinema executadas ao vivo por uma orquestra de 60 músicos.',
      art: PALETAS[1], tipo: 'mapa', venue: Venue.template('teatro'),
    }), .35),
    withSold(ev({
      titulo: 'Rindo à Toa — Stand-up', kicker: 'Comédia', categoria: 'Stand-up', cidade: 'Cascavel', uf: 'PR',
      local: 'Teatro Municipal Sefrin Filho', endereco: 'R. Duque de Caxias, 379', dataIni: '2026-10-30', dataFim: '2026-10-30', hora: '21:00',
      descricao: 'Quatro comediantes, uma noite. Classificação 16 anos.',
      art: PALETAS[2], tipo: 'mapa', venue: Venue.template('auditorio'),
    }), .5),
    ev({
      titulo: 'Festival Sertanejo do Oeste', kicker: '3ª edição', categoria: 'Show', cidade: 'Cascavel', uf: 'PR',
      local: 'Parque de Exposições', endereco: 'BR-277', dataIni: '2026-12-12', dataFim: '2026-12-13', hora: '18:00',
      descricao: 'Dois dias de festival com os maiores nomes do sertanejo do Paraná.',
      art: PALETAS[5], tipo: 'geral',
      lotes: lotes([['Pista', 90, 3000, 1240], ['Área VIP', 220, 600, 310], ['Camarote', 480, 150, 47]]),
    }),
    withSold(ev({
      titulo: 'O Auto da Compadecida', kicker: 'Teatro', categoria: 'Teatro', cidade: 'Foz do Iguaçu', uf: 'PR',
      local: 'Teatro Barracão', endereco: 'Av. Jorge Schimmelpfeng', dataIni: '2026-11-07', dataFim: '2026-11-07', hora: '19:30',
      descricao: 'Montagem regional do clássico de Ariano Suassuna.',
      art: PALETAS[7], tipo: 'mapa', venue: Venue.template('teatro'),
    }), .2),
    withSold(ev({
      titulo: 'Tech Summit Oeste', kicker: 'Tecnologia & inovação', categoria: 'Palestra', cidade: 'Medianeira', uf: 'PR',
      local: 'Auditório UTFPR', endereco: 'Av. Brasil, 4232', dataIni: '2026-11-14', dataFim: '2026-11-14', hora: '08:30',
      descricao: 'Palestras sobre IA, desenvolvimento web e empreendedorismo.',
      art: PALETAS[3], tipo: 'mapa', venue: Venue.template('auditorio'),
    }), .15),
    ev({
      titulo: 'Sunset Eletrônico', kicker: 'Open air', categoria: 'Festa', cidade: 'Florianópolis', uf: 'SC',
      local: 'Praia Mole', endereco: 'SC-406', dataIni: '2027-01-09', dataFim: '2027-01-09', hora: '15:00',
      descricao: 'Música eletrônica do pôr do sol ao amanhecer.',
      art: PALETAS[6], tipo: 'geral',
      lotes: lotes([['Pista', 140, 1500, 600], ['Backstage', 320, 200, 88]]),
    }),
    ev({
      titulo: 'Circo Encantado', kicker: 'Para toda a família', categoria: 'Infantil', cidade: 'Curitiba', uf: 'PR',
      local: 'Ópera de Arame', endereco: 'R. João Gava, 920', dataIni: '2026-10-25', dataFim: '2026-10-25', hora: '15:00',
      descricao: 'Acrobacias, palhaços e mágica para crianças de todas as idades.',
      art: PALETAS[4], tipo: 'geral',
      lotes: lotes([['Inteira', 60, 500, 120], ['Meia-entrada', 30, 300, 95]]),
    }),
  ];
  // um evento já pertence ao "organizador" logado, para a tela Meus eventos não começar vazia
  list[2].own = true;
  return list;
}
