#!/usr/bin/env node
// Probe a list of controls: real click -> dump popup/dialog -> Escape.
// usage: node probe-ui.js '<selector1>' '<selector2>' ...
const http = require('http');

const PORT = Number(process.env.CDP_PORT || 9333);
const FRAG = process.env.CDP_TARGET || 'doubao-chat/chat';

function list() {
  return new Promise((resolve, reject) => {
    http.get({ host: '127.0.0.1', port: PORT, path: '/json/list' }, (res) => {
      let b = '';
      res.on('data', (c) => (b += c));
      res.on('end', () => { try { resolve(JSON.parse(b)); } catch (e) { reject(e); } });
    }).on('error', reject);
  });
}

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

(async () => {
  const selectors = process.argv.slice(2);
  if (!selectors.length) { console.error('usage: probe-ui.js <selector...>'); process.exit(2); }
  const targets = await list();
  const t = targets.find((x) => (x.url + ' ' + (x.title || '')).includes(FRAG)) || targets.find((x) => x.type === 'page');
  const ws = new WebSocket(t.webSocketDebuggerUrl);
  let id = 0; const pending = new Map();
  ws.addEventListener('message', (ev) => {
    const m = JSON.parse(ev.data);
    if (m.id && pending.has(m.id)) { const p = pending.get(m.id); pending.delete(m.id); m.error ? p.reject(new Error(JSON.stringify(m.error))) : p.resolve(m.result); }
  });
  await new Promise((r) => ws.addEventListener('open', r));
  const send = (method, params = {}) => new Promise((resolve, reject) => {
    const mid = ++id; pending.set(mid, { resolve, reject });
    ws.send(JSON.stringify({ id: mid, method, params }));
  });
  const evalJs = async (expression) => {
    const r = await send('Runtime.evaluate', { expression, returnByValue: true, awaitPromise: true, userGesture: true });
    if (r.exceptionDetails) throw new Error(JSON.stringify(r.exceptionDetails).slice(0, 300));
    return r.result && r.result.value;
  };
  const clickSel = async (sel) => {
    const rect = await evalJs(`(() => { const e = document.querySelector(${JSON.stringify(sel)}); if (!e) return null; e.scrollIntoView({block:'center'}); const r = e.getBoundingClientRect(); return { x: r.x + r.width/2, y: r.y + r.height/2 }; })()`);
    if (!rect) return null;
    for (const type of ['mousePressed', 'mouseReleased']) {
      await send('Input.dispatchMouseEvent', { type, x: rect.x, y: rect.y, button: 'left', clickCount: 1 });
    }
    return rect;
  };
  const dump = () => evalJs(`(() => {
    const v = e => !!(e.offsetWidth || e.offsetHeight);
    const panels = [...document.querySelectorAll('body *')].filter(e => v(e) && ['fixed','absolute'].includes(getComputedStyle(e).position) && +getComputedStyle(e).zIndex >= 60 && (e.innerText||'').trim().length > 2);
    const smallest = panels.filter(p => panels.filter(o => o !== p).every(o => !(o.innerText || '').includes(p.innerText)));
    const dialogs = [...document.querySelectorAll('[role=dialog]')].filter(v).map(e => ({ text: (e.innerText||'').replace(/\\n+/g,' | ').slice(0, 300) }));
    return { panels: smallest.slice(0, 3).map(e => ({ tid: e.getAttribute('data-testid'), text: e.innerText.replace(/\\n+/g,' | ').slice(0, 400) })), dialogs, url: location.href, title: document.title };
  })()`);
  const esc = async () => {
    await send('Input.dispatchKeyEvent', { type: 'keyDown', key: 'Escape', code: 'Escape', windowsVirtualKeyCode: 27 });
    await send('Input.dispatchKeyEvent', { type: 'keyUp', key: 'Escape', code: 'Escape', windowsVirtualKeyCode: 27 });
    await sleep(400);
  };
  const out = {};
  for (const sel of selectors) {
    const rect = await clickSel(sel);
    if (!rect) { out[sel] = 'NOT_FOUND'; continue; }
    await sleep(1000);
    out[sel] = await dump();
    await esc();
    await sleep(500);
  }
  console.log(JSON.stringify(out, null, 2));
  ws.close(); process.exit(0);
})().catch((e) => { console.error('ERR', e.message); process.exit(1); });
