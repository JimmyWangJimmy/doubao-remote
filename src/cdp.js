'use strict';
/** Minimal CDP client for the Doubao desktop webview (Node >= 21, no deps). */
const http = require('http');

const DEFAULTS = {
  port: Number(process.env.CDP_PORT || 9333),
  match: process.env.CDP_TARGET || 'doubao-chat',
};

function httpJson(url, timeout = 4000) {
  return new Promise((resolve, reject) => {
    const req = http.get(url, { timeout }, (res) => {
      let b = '';
      res.on('data', (c) => (b += c));
      res.on('end', () => { try { resolve(JSON.parse(b)); } catch (e) { reject(e); } });
    });
    req.on('timeout', () => req.destroy(new Error('timeout')));
    req.on('error', reject);
  });
}

class CDP {
  constructor(wsUrl) {
    this.ws = new WebSocket(wsUrl);
    this.id = 0;
    this.pending = new Map();
    this.closed = false;
    this.ws.addEventListener('message', (ev) => {
      let m;
      try { m = JSON.parse(ev.data); } catch { return; }
      if (m.id && this.pending.has(m.id)) {
        const p = this.pending.get(m.id);
        this.pending.delete(m.id);
        if (m.error) p.reject(new Error(JSON.stringify(m.error))); else p.resolve(m.result);
      }
    });
    this.ws.addEventListener('close', () => { this.closed = true; });
  }

  ready() {
    if (this.closed) return Promise.reject(new Error('cdp socket closed'));
    if (this.ws.readyState === 1) return Promise.resolve();
    return new Promise((resolve, reject) => {
      const ok = () => { cleanup(); resolve(); };
      const bad = () => { cleanup(); reject(new Error('cannot open devtools websocket')); };
      const cleanup = () => { this.ws.removeEventListener('open', ok); this.ws.removeEventListener('error', bad); };
      this.ws.addEventListener('open', ok);
      this.ws.addEventListener('error', bad);
    });
  }

  send(method, params = {}) {
    return new Promise((resolve, reject) => {
      const mid = ++this.id;
      this.pending.set(mid, { resolve, reject });
      try { this.ws.send(JSON.stringify({ id: mid, method, params })); }
      catch (e) { this.pending.delete(mid); reject(e); }
    });
  }

  async eval(expression) {
    const r = await this.send('Runtime.evaluate', {
      expression, returnByValue: true, awaitPromise: true, userGesture: true,
    });
    if (r.exceptionDetails) throw new Error(('' + JSON.stringify(r.exceptionDetails)).slice(0, 500));
    return r.result ? r.result.value : undefined;
  }

  async rect(selector) {
    return this.eval(`(() => {
      const e = document.querySelector(${JSON.stringify(selector)});
      if (!e) return null;
      e.scrollIntoView({ block: 'center' });
      const r = e.getBoundingClientRect();
      if (!r.width && !r.height) return { x: 0, y: 0, w: 0, h: 0, hidden: true };
      return { x: r.x + r.width / 2, y: r.y + r.height / 2, w: r.width, h: r.height };
    })()`);
  }

  /** Real mouse click (JS .click() is ignored by several Doubao controls). */
  async click(selector, { settle = 700 } = {}) {
    const r = await this.rect(selector);
    if (!r) throw new Error('element not found: ' + selector);
    if (r.hidden) throw new Error('element not visible: ' + selector);
    for (const type of ['mouseMoved', 'mousePressed', 'mouseReleased']) {
      await this.send('Input.dispatchMouseEvent', { type, x: r.x, y: r.y, button: 'left', clickCount: 1 });
    }
    if (settle) await new Promise((res) => setTimeout(res, settle));
    return r;
  }

  async press(key, { times = 1 } = {}) {
    const map = {
      Enter: { code: 'Enter', vk: 13 },
      Escape: { code: 'Escape', vk: 27 },
      Tab: { code: 'Tab', vk: 9 },
      Backspace: { code: 'Backspace', vk: 8 },
      ArrowDown: { code: 'ArrowDown', vk: 40 },
    };
    const k = map[key] || { code: key, vk: 0 };
    for (let i = 0; i < times; i++) {
      await this.send('Input.dispatchKeyEvent', { type: 'keyDown', key, code: k.code, windowsVirtualKeyCode: k.vk });
      await this.send('Input.dispatchKeyEvent', { type: 'keyUp', key, code: k.code, windowsVirtualKeyCode: k.vk });
      await new Promise((res) => setTimeout(res, 120));
    }
  }

  async insertText(text) {
    await this.send('Input.insertText', { text });
    await new Promise((res) => setTimeout(res, 300));
  }

  async screenshot(file) {
    const shot = await this.send('Page.captureScreenshot', { format: 'png', captureBeyondViewport: false });
    require('fs').writeFileSync(file, Buffer.from(shot.data, 'base64'));
    return file;
  }

  /** Attach files to the first <input type=file> of the page. */
  async setFiles(paths) {
    const doc = await this.send('DOM.getDocument', { depth: -1 });
    const q = await this.send('DOM.querySelector', { nodeId: doc.root.nodeId, selector: 'input[type=file]' });
    if (!q.nodeId) throw new Error('no file input on the page');
    await this.send('DOM.setFileInputFiles', { nodeId: q.nodeId, files: paths });
    return q.nodeId;
  }
}

let cache = null;
async function connect(opts = {}) {
  const port = opts.port || DEFAULTS.port;
  const targets = (await httpJson(`http://127.0.0.1:${port}/json/list`)).filter((t) => t.type === 'page');
  const want = opts.match || DEFAULTS.match;
  // Prefer the real chat page; never the cross-site-support "other" target or the launcher shell.
  const score = (t) => {
    let s = 0;
    if ((t.url || '').includes('doubao-chat/chat')) s += 100;
    if (t.title && t.title !== '豆包') s += 20;
    if ((t.url || '').includes('doubao-launcher')) s -= 50;
    if ((t.url || '').includes('doubao-background')) s -= 100;
    return s;
  };
  const ranked = targets.slice().sort((a, b) => score(b) - score(a));
  const t = ranked.find((x) => (x.url + ' ' + (x.title || '')).includes(want)) || ranked[0];
  if (!t) throw new Error('no Doubao page target; call doubao_desktop_ensure first');
  if (cache && !cache.cdp.closed && cache.ws === t.webSocketDebuggerUrl) return cache.cdp;
  if (cache) { try { cache.cdp.ws.close(); } catch { /* ignore */ } }
  const cdp = new CDP(t.webSocketDebuggerUrl);
  await cdp.ready();
  cache = { cdp, ws: t.webSocketDebuggerUrl };
  return cdp;
}

module.exports = { CDP, connect, httpJson, DEFAULTS };
