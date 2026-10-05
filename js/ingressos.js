renderChrome('ingressos');
const tickets = Store.tickets();
document.getElementById('sub').textContent = tickets.length
  ? `${tickets.length} ingresso(s). Apresente o QR code na entrada do evento.`
  : 'Os ingressos que você comprar aparecem aqui.';

document.getElementById('list').innerHTML = tickets.length ? tickets.map(t => {
  const ev = Store.event(t.evId) || { titulo: t.titulo, art: PALETAS[0] };
  return `<div class="ticket">
    <a class="thumb" href="evento.html?id=${t.evId}">${posterHTML(ev)}</a>
    <div class="ticket-body">
      <h4>${esc(t.titulo)}</h4>
      <span class="muted">${esc(fmtRange(ev))}${ev.local ? ` · ${esc(ev.local)}, ${esc(ev.cidade)}` : ''}</span>
      ${t.lugar ? `<span class="ticket-seat">Lugar ${esc(t.lugar)}</span>` : ''}
      <span><b>${esc(t.setor)}</b> · ${brl(t.preco)}</span>
      <span class="muted" style="font-size:13px">Titular: ${esc(t.nome)} · Pago via ${t.pagamento === 'pix' ? 'Pix' : 'cartão'}</span>
    </div>
    <div class="ticket-qr">${qrSVG(t.code)}<span>${esc(t.code)}</span></div>
  </div>`;
}).join('') : `<div class="empty">Você ainda não tem ingressos.<br><br><a class="btn" href="index.html">Explorar eventos</a></div>`;
