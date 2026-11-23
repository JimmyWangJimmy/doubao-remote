#!/usr/bin/env node
// Minimal CDP evaluator: node cdp-eval.js [matchFragment] <expression> [--await]
const http = require('http');

function list(port) {
  return new Promise((resolve, reject) => {
    http.get({ host: '127.0.0.1', port, path: '/json/list' }, (res) => {
      let b = '';
      res.on('data', (c) => (b += c));
      res.on('end', () => { try { resolve(JSON.parse(b)); } catch (e) { reject(e); } });
    }).on('error', reject);
  });
}

(async () => {
  const args = process.argv.slice(2);
  const port = Number(process.env.CDP_PORT || 9333);
  let frag = 'doubao-chat/chat';
  if (args[0] && !args[0].startsWith('(') && !args[0].startsWith('document') && !args[0].startsWith('JSON') && args[0].includes('/')) {
    frag = args.shift();
  }
  const expr = args.shift();
  if (!expr) { console.error('usage: cdp-eval.js [fragment] <expr>'); process.exit(2); }
  const targets = await list(port);
  const t = targets.find((x) => (x.url + ' ' + (x.title || '')).includes(frag)) || targets.find((x) => x.type === 'page');
  if (!t) { console.error('no target'); process.exit(3); }
  const ws = new WebSocket(t.webSocketDebuggerUrl);
  let id = 0;
  const pending = new Map();
  const send = (method, params) => new Promise((resolve, reject) => {
    const mid = ++id;
    pending.set(mid, { resolve, reject });
    ws.send(JSON.stringify({ id: mid, method, params: params || {} }));
  });
  ws.addEventListener('message', (ev) => {
    const msg = JSON.parse(ev.data);
    if (msg.id && pending.has(msg.id)) {
      const p = pending.get(msg.id); pending.delete(msg.id);
      if (msg.error) p.reject(new Error(JSON.stringify(msg.error)));
      else p.resolve(msg.result);
    }
  });
  await new Promise((r) => ws.addEventListener('open', r));
  const res = await send('Runtime.evaluate', {
    expression: expr, returnByValue: true, awaitPromise: true, userGesture: true,
  });
  console.log(JSON.stringify(res.result ? res.result.value : res, null, 2));
  ws.close();
  process.exit(0);
})().catch((e) => { console.error('ERR', e.message); process.exit(1); });
