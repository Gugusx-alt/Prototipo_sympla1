renderChrome('criar');

const draft = {
  id: uid(), own: true, criadoEm: Date.now(),
  titulo: '', kicker: '', categoria: 'Show', descricao: '', banner: null, art: randomArt(),
  dataIni: '', dataFim: '', hora: '20:00', local: '', endereco: '', cidade: '', uf: 'PR',
  tipo: 'mapa', venue: Venue.template('teatro'), sold: {},
  lotes: [{ id: uid(), nome: '1º Lote', preco: 50, qtd: 200, vendidos: 0 }],
};
const STEPS = ['Informações', 'Data e local', 'Ingressos e lugares', 'Revisão'];
let step = 0;
let tool = { t: 'seat', s: draft.venue.sectors[0].id };

const $ = id => document.getElementById(id);
const body = $('body');

/* Inputs com data-k atualizam o rascunho automaticamente */
body.addEventListener('input', e => {
  const k = e.target.dataset.k;
  if (k) draft[k] = e.target.value;
  if (k === 'dataIni' && (!draft.dataFim || draft.dataFim < draft.dataIni)) {
    draft.dataFim = draft.dataIni;
    const f = body.querySelector('[data-k=dataFim]'); if (f) f.value = draft.dataFim;
  }
  if (['titulo', 'kicker', 'cidade', 'dataIni', 'dataFim'].includes(k)) refreshPreview();
});
const val = k => esc(draft[k] ?? '');

function render() {
  $('steps').innerHTML = STEPS.map((s, i) =>
    `<button class="step ${i === step ? 'on' : i < step ? 'done' : ''}" data-i="${i}"><i>${i < step ? '✓' : i + 1}</i>${s}</button>`).join('');
  $('back').style.visibility = step ? 'visible' : 'hidden';
  $('next').textContent = step === STEPS.length - 1 ? 'Publicar evento' : 'Continuar';
  $('err').textContent = '';
  [stepInfo, stepData, stepIngressos, stepReview][step]();
  window.scrollTo({ top: 0, behavior: 'smooth' });
}
$('steps').onclick = e => {
  const b = e.target.closest('.step'); if (!b) return;
  const i = +b.dataset.i;
  if (i < step || validate()) { step = Math.min(i, step + 1); render(); }
};
$('back').onclick = () => { step--; render(); };
$('next').onclick = () => {
  if (!validate()) return;
  if (step < STEPS.length - 1) { step++; render(); } else publish();
};

function validate() {
  const fail = m => { $('err').textContent = m; return false; };
  if (step === 0 && !draft.titulo.trim()) return fail('Dê um nome ao evento.');
  if (step === 1) {
    if (!draft.dataIni) return fail('Informe a data do evento.');
    if (!draft.local.trim() || !draft.cidade.trim()) return fail('Informe o local e a cidade.');
  }
  if (step === 2) {
    if (draft.tipo === 'mapa') {
      const st = Venue.stats(draft.venue);
      if (!st.capacidade) return fail('O mapa precisa ter pelo menos um lugar à venda.');
      if (draft.venue.sectors.some(s => st.per[s.id]?.total && !(Number(s.preco) >= 0 && s.nome.trim()))) return fail('Confira o nome e o preço dos setores.');
    } else {
      if (!draft.lotes.length) return fail('Adicione pelo menos um tipo de ingresso.');
      if (draft.lotes.some(l => !l.nome.trim() || !(Number(l.qtd) > 0))) return fail('Confira o nome e a quantidade de cada ingresso.');
    }
  }
  return true;
}

/* ---------- Passo 1: informações ---------- */
function stepInfo() {
  body.innerHTML = `<div class="form-grid">
    <div class="field full"><label>Nome do evento *</label><input data-k="titulo" value="${val('titulo')}" placeholder="Ex.: Festival de Verão 2027" maxlength="60"></div>
    <div class="field"><label>Categoria</label><select data-k="categoria">${CATEGORIAS.map(c => `<option ${c === draft.categoria ? 'selected' : ''}>${c}</option>`).join('')}</select></div>
    <div class="field"><label>Chamada curta</label><input data-k="kicker" value="${val('kicker')}" placeholder="Ex.: 3ª edição" maxlength="30"><small>Aparece acima do título no banner gerado.</small></div>
    <div class="field full"><label>Descrição</label><textarea data-k="descricao" placeholder="Conte sobre o evento, atrações, classificação etária...">${val('descricao')}</textarea></div>
    <div class="field full"><label>Banner</label>
      <div class="upload">
        <div class="prev" id="prev">${posterHTML(draft)}</div>
        <div>
          <p style="margin:0 0 10px">Envie uma imagem (recomendado 1600×900) ou use a arte gerada automaticamente.</p>
          <div style="display:flex;gap:8px;flex-wrap:wrap">
            <label class="btn btn-soft btn-sm" style="cursor:pointer">${ICON.image} Enviar imagem<input type="file" accept="image/*" id="file" hidden></label>
            <button class="btn btn-ghost btn-sm" id="shuffle">Gerar outra arte</button>
            ${draft.banner ? `<button class="btn btn-danger btn-sm" id="rmimg">Remover imagem</button>` : ''}
          </div>
        </div>
      </div></div>
  </div>`;
  $('shuffle').onclick = () => { draft.banner = null; draft.art = randomArt(); stepInfo(); };
  if ($('rmimg')) $('rmimg').onclick = () => { draft.banner = null; stepInfo(); };
  $('file').onchange = e => {
    const f = e.target.files[0]; if (!f) return;
    const img = new Image();
    img.onload = () => {
      const w = Math.min(1280, img.width), h = Math.round(img.height * w / img.width);
      const cv = Object.assign(document.createElement('canvas'), { width: w, height: h });
      cv.getContext('2d').drawImage(img, 0, 0, w, h);
      draft.banner = cv.toDataURL('image/jpeg', .8);
      URL.revokeObjectURL(img.src);
      stepInfo();
    };
    img.src = URL.createObjectURL(f);
  };
}
function refreshPreview() { const p = $('prev'); if (p) p.innerHTML = posterHTML(draft); }

/* ---------- Passo 2: data e local ---------- */
function stepData() {
  body.innerHTML = `<div class="form-grid">
    <div class="field"><label>Data de início *</label><input type="date" data-k="dataIni" value="${val('dataIni')}"></div>
    <div class="field"><label>Data de término</label><input type="date" data-k="dataFim" value="${val('dataFim')}"></div>
    <div class="field"><label>Horário de abertura</label><input type="time" data-k="hora" value="${val('hora')}"></div>
    <div class="field"><label>Nome do local *</label><input data-k="local" value="${val('local')}" placeholder="Ex.: Teatro Municipal"></div>
    <div class="field full"><label>Endereço</label><input data-k="endereco" value="${val('endereco')}" placeholder="Rua, número, bairro"></div>
    <div class="field"><label>Cidade *</label><input data-k="cidade" value="${val('cidade')}" placeholder="Ex.: Cascavel"></div>
    <div class="field"><label>Estado</label><select data-k="uf">${UFS.map(u => `<option ${u === draft.uf ? 'selected' : ''}>${u}</option>`).join('')}</select></div>
  </div>`;
}

/* ---------- Passo 3: ingressos / mapa de lugares ---------- */
function stepIngressos() {
  body.innerHTML = `<div class="tipo-cards">
      <button class="tipo-card ${draft.tipo === 'mapa' ? 'on' : ''}" data-tipo="mapa">${ICON.seat}<div><b>Lugar marcado</b><span>Desenhe o mapa do local; o comprador escolhe a poltrona, como na compra de passagem de ônibus.</span></div></button>
      <button class="tipo-card ${draft.tipo === 'geral' ? 'on' : ''}" data-tipo="geral">${ICON.users}<div><b>Ingresso geral</b><span>Pista, camarote, lotes... sem lugar marcado, apenas quantidade.</span></div></button>
    </div><div id="tipo-body"></div>`;
  body.querySelectorAll('[data-tipo]').forEach(b => b.onclick = () => { draft.tipo = b.dataset.tipo; stepIngressos(); });
  draft.tipo === 'mapa' ? renderEditor() : renderLotesEdit();
}

function renderEditor() {
  const v = draft.venue;
  $('tipo-body').innerHTML = `<div class="editor">
    <div class="ed-side">
      <div><h4>Começar de um modelo</h4>
        <div class="tpl-btns"><button data-tpl="teatro">Teatro</button><button data-tpl="auditorio">Auditório</button><button data-tpl="vazio">Em branco</button></div></div>
      <div><h4>Tamanho</h4>
        <div class="size-row"><span>Fileiras</span><span class="stepper"><button data-sz="r-1">−</button><span>${v.cells.length}</span><button data-sz="r1">+</button></span></div>
        <div class="size-row"><span>Colunas</span><span class="stepper"><button data-sz="c-1">−</button><span>${v.cells[0].length}</span><button data-sz="c1">+</button></span></div></div>
      <div><h4>Ferramenta (pincel)</h4><div class="tools" id="tools"></div></div>
      <div><h4>Setores e preços</h4><div id="sectors"></div>
        <button class="btn btn-soft btn-sm" id="add-sector">+ Novo setor</button></div>
      <div class="field"><label>Texto do palco</label><input id="stage" value="${esc(v.stage)}" maxlength="20" placeholder="Palco, Tela, Ringue..."></div>
    </div>
    <div class="ed-main">
      <div class="hint"><b>Como usar:</b> escolha um pincel e clique ou arraste sobre o mapa (no celular, use <b>Mover mapa</b> para rolar sem pintar). Use <b>Corredor</b> para abrir espaços e <b>Bloquear</b> para lugares que não serão vendidos (aparecem com X para o comprador).</div>
      <div id="sm-edit"></div>
      <div class="stats" id="stats"></div>
      <div style="margin-top:14px;display:flex;justify-content:flex-end">
        <button class="btn btn-ghost btn-sm" id="preview-buy">Ver como o comprador verá</button></div>
    </div></div>`;

  body.querySelectorAll('[data-tpl]').forEach(b => b.onclick = () => {
    if (!confirm('Substituir o mapa atual pelo modelo selecionado?')) return;
    draft.venue = Venue.template(b.dataset.tpl);
    tool = { t: 'seat', s: draft.venue.sectors[0].id };
    renderEditor();
  });
  body.querySelectorAll('[data-sz]').forEach(b => b.onclick = () => resize(b.dataset.sz));
  $('stage').oninput = e => { v.stage = e.target.value; drawEditMap(); };
  $('add-sector').onclick = () => {
    const used = v.sectors.map(s => s.cor);
    const cor = CORES_SETOR.find(c => !used.includes(c)) || CORES_SETOR[v.sectors.length % CORES_SETOR.length];
    const s = { id: uid(), nome: `Setor ${v.sectors.length + 1}`, cor, preco: 50 };
    v.sectors.push(s);
    tool = { t: 'seat', s: s.id };
    renderEditor();
  };
  $('preview-buy').onclick = () => {
    const m = openModal(`<h3>Prévia do comprador</h3><p class="muted" style="margin:0 0 14px">É assim que o mapa aparece na página do evento.</p><div id="pv"></div>
      <div style="text-align:right;margin-top:14px"><button class="btn" id="ok">Fechar</button></div>`);
    m.el.style.width = 'min(1100px, 100%)';
    SeatMap.render(m.el.querySelector('#pv'), v, { mode: 'view' });
    m.el.querySelector('#ok').onclick = m.close;
  };

  renderSectors();
  renderTools();
  const mapEl = $('sm-edit');
  SeatMap.attachPainter(mapEl, v, () => tool, () => { drawEditMap(); renderStats(); });
  drawEditMap();
  renderStats();
}

function drawEditMap() { SeatMap.render($('sm-edit'), draft.venue, { mode: 'edit' }); }

function renderTools() {
  const v = draft.venue;
  const is = (t, s) => tool.t === t && (s === undefined || tool.s === s);
  $('tools').innerHTML = v.sectors.map(s =>
    `<button class="tool ${is('seat', s.id) ? 'on' : ''}" data-t="seat" data-s="${s.id}"><i style="background:${s.cor}"></i>${esc(s.nome)}</button>`).join('') +
    `<button class="tool ${is('aisle') ? 'on' : ''}" data-t="aisle"><i style="border:1px dashed #999"></i>Corredor</button>
     <button class="tool ${is('blocked') ? 'on' : ''}" data-t="blocked"><i style="background:#b3b3b3"></i>Bloquear</button>
     <button class="tool tool-pan ${is('pan') ? 'on' : ''}" data-t="pan">${ICON.hand}Mover mapa</button>`;
  $('sm-edit').classList.toggle('panning', tool.t === 'pan');
  $('tools').querySelectorAll('.tool').forEach(b => b.onclick = () => {
    tool = { t: b.dataset.t, s: b.dataset.s };
    renderTools();
  });
}

function renderSectors() {
  const v = draft.venue;
  $('sectors').innerHTML = v.sectors.map(s => `<div class="sector-row" data-id="${s.id}">
      <input type="color" value="${s.cor}" data-f="cor" title="Cor">
      <input class="input" value="${esc(s.nome)}" data-f="nome" placeholder="Nome do setor">
      <input class="input" type="number" min="0" step="0.01" value="${s.preco}" data-f="preco" title="Preço (R$)">
      <button class="rm" data-rm title="Remover setor" ${v.sectors.length < 2 ? 'disabled' : ''}>×</button>
    </div>`).join('');
  $('sectors').oninput = e => {
    const row = e.target.closest('.sector-row'); const f = e.target.dataset.f;
    if (!row || !f) return;
    const s = v.sectors.find(x => x.id === row.dataset.id);
    s[f] = f === 'preco' ? Number(e.target.value) : e.target.value;
    renderTools(); drawEditMap(); renderStats();
  };
  $('sectors').querySelectorAll('[data-rm]').forEach(b => b.onclick = () => {
    const id = b.closest('.sector-row').dataset.id;
    v.sectors = v.sectors.filter(s => s.id !== id);
    const fallback = v.sectors[0].id;
    v.cells.forEach(row => row.forEach(c => { if (c.s === id) c.s = fallback; }));
    if (tool.s === id) tool = { t: 'seat', s: fallback };
    renderEditor();
  });
}

function renderStats() {
  const st = Venue.stats(draft.venue);
  $('stats').innerHTML = `
    <div class="stat"><small>Lugares à venda</small><b>${st.capacidade}</b></div>
    <div class="stat"><small>Bloqueados</small><b>${st.bloqueados}</b></div>
    ${draft.venue.sectors.map(s => `<div class="stat" style="border-left:4px solid ${s.cor}"><small>${esc(s.nome)} · ${brl(s.preco)}</small><b>${st.per[s.id]?.total || 0}</b></div>`).join('')}
    <div class="stat"><small>Receita se esgotar</small><b>${brl(st.potencial)}</b></div>`;
}

function resize(op) {
  const v = draft.venue;
  const def = () => ({ t: 'seat', s: tool.t === 'seat' ? tool.s : v.sectors[0].id });
  if (op === 'r1' && v.cells.length < 40) v.cells.push(v.cells[v.cells.length - 1].map(c => (c.t === 'aisle' ? { t: 'aisle' } : def())));
  if (op === 'r-1' && v.cells.length > 1) v.cells.pop();
  if (op === 'c1' && v.cells[0].length < 40) v.cells.forEach(row => row.push(def()));
  if (op === 'c-1' && v.cells[0].length > 1) v.cells.forEach(row => row.pop());
  renderEditor();
}

/* Ingresso geral (lotes) */
function renderLotesEdit() {
  $('tipo-body').innerHTML = `<div id="lotes">${draft.lotes.map(l => `<div class="lote-edit" data-id="${l.id}">
      <div class="field"><label>Nome do ingresso</label><input data-f="nome" value="${esc(l.nome)}" placeholder="Ex.: Pista — 1º lote"></div>
      <div class="field"><label>Preço (R$)</label><input data-f="preco" type="number" min="0" step="0.01" value="${l.preco}"></div>
      <div class="field"><label>Quantidade</label><input data-f="qtd" type="number" min="1" value="${l.qtd}"></div>
      <button class="btn btn-danger btn-sm" data-rm title="Remover" style="height:44px">×</button>
    </div>`).join('')}</div>
    <button class="btn btn-soft btn-sm" id="add-lote">+ Adicionar ingresso</button>`;
  $('lotes').oninput = e => {
    const row = e.target.closest('.lote-edit'); const f = e.target.dataset.f; if (!row || !f) return;
    const l = draft.lotes.find(x => x.id === row.dataset.id);
    l[f] = f === 'nome' ? e.target.value : Number(e.target.value);
  };
  $('lotes').querySelectorAll('[data-rm]').forEach(b => b.onclick = () => {
    draft.lotes = draft.lotes.filter(l => l.id !== b.closest('.lote-edit').dataset.id); renderLotesEdit();
  });
  $('add-lote').onclick = () => {
    draft.lotes.push({ id: uid(), nome: `${draft.lotes.length + 1}º Lote`, preco: 60, qtd: 200, vendidos: 0 }); renderLotesEdit();
  };
}

/* ---------- Passo 4: revisão ---------- */
function stepReview() {
  const ex = minPrice(draft) || 100;
  const cap = capacity(draft);
  const pot = draft.tipo === 'mapa' ? Venue.stats(draft.venue).potencial : draft.lotes.reduce((a, l) => a + l.preco * l.qtd, 0);
  const pct = Math.round(CONFIG.taxa * 100);
  body.innerHTML = `<div class="review">
    <div>
      <div class="poster-box">${posterHTML(draft)}</div>
      <h2 style="margin:16px 0 6px;font-size:24px;font-weight:900">${esc(draft.titulo)}</h2>
      <div class="ev-meta" style="margin:0">
        <span>${ICON.cal}${esc(fmtRange(draft))}</span><span>${ICON.clock}${esc(draft.hora)}</span>
        <span>${ICON.pin}${esc(draft.local)} — ${esc(draft.cidade)} - ${esc(draft.uf)}</span></div>
      ${draft.tipo === 'mapa' ? '<div id="rv-map" style="margin-top:16px"></div>' : ''}
    </div>
    <div>
      <div class="stats" style="margin-top:0">
        <div class="stat"><small>Tipo</small><b style="font-size:16px">${draft.tipo === 'mapa' ? 'Lugar marcado' : 'Ingresso geral'}</b></div>
        <div class="stat"><small>Capacidade</small><b>${cap.total}</b></div>
        <div class="stat"><small>Receita se esgotar</small><b>${brl(pot)}</b></div>
      </div>
      <div class="fee-box">
        <h4>${ICON.shield} Simulação de taxa — ingresso de ${brl(ex)}</h4>
        <div><span>Comprador paga</span><b>${brl(ex * (1 + CONFIG.taxa))}</b></div>
        <div><span>Taxa de serviço da plataforma (${pct}%)</span><span>${brl(ex * CONFIG.taxa)}</span></div>
        <div><span>Você recebe por ingresso</span><b>${brl(ex)}</b></div>
        <p class="muted" style="margin:10px 0 0;font-size:12.5px">A taxa é paga pelo comprador e é configurável em <code>js/data.js</code> (CONFIG.taxa).</p>
      </div>
    </div></div>`;
  if (draft.tipo === 'mapa') {
    const el = $('rv-map');
    SeatMap.render(el, draft.venue, { mode: 'view' });
    el.querySelector('.sm').style.cssText = '--seat-w:34px;--seat-h:30px;--gap:4px';
    el.querySelectorAll('.seat small').forEach(s => s.remove());
    el.querySelectorAll('.seat b').forEach(b => b.style.fontSize = '10px');
  }
}

function publish() {
  const ev = JSON.parse(JSON.stringify(draft));
  if (!ev.dataFim) ev.dataFim = ev.dataIni;
  if (ev.tipo === 'mapa') ev.lotes = []; else ev.venue = null;
  if (Store.upsert(ev)) location.href = `evento.html?id=${ev.id}`;
}

render();
