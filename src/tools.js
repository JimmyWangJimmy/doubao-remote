'use strict';
const fs = require('fs');
const os = require('os');
const path = require('path');
const { execFileSync, spawn } = require('child_process');
const { connect, httpJson, DEFAULTS } = require('./cdp');
const SEL = require('./selectors');

const OUT_DIR = process.env.DOUBAO_DESKTOP_OUT || path.join(os.homedir(), 'Pictures', 'doubao-desktop');
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const PENDING = /正在(思考|生成|处理|搜索|绘制|画图)|^已处理\s*\d+\s*秒|生成中|加载中/;

/* ------------------------------------------------------------------ helpers */

const IS_WIN = process.platform === 'win32';
const WIN_EXE_NAMES = ['Doubao.exe', 'doubao.exe', '豆包.exe'];

/** Locate Doubao.exe on Windows: env override, live process image path, then common install dirs. */
function findWindowsAppPath() {
  if (process.env.DOUBAO_APP_EXE && fs.existsSync(process.env.DOUBAO_APP_EXE)) return process.env.DOUBAO_APP_EXE;
  try {
    const ps = execFileSync('powershell', ['-NoProfile', '-Command',
      "(Get-Process Doubao -ErrorAction SilentlyContinue | Where-Object { $_.Path } | Select-Object -First 1 -ExpandProperty Path)"],
      { encoding: 'utf8', timeout: 8000 }).trim();
    if (ps && fs.existsSync(ps)) return ps;
  } catch { /* ignore */ }
  const guesses = [
    path.join(process.env.LOCALAPPDATA || '', 'Programs', 'Doubao', 'Doubao.exe'),
    path.join(process.env.LOCALAPPDATA || '', 'Doubao', 'Doubao.exe'),
    'C:\\Program Files\\Doubao\\Doubao.exe',
    'C:\\Program Files (x86)\\Doubao\\Doubao.exe',
    'D:\\Software\\Doubao\\app\\Doubao.exe',
  ];
  return guesses.find((p) => p && fs.existsSync(p)) || null;
}

async function pids() {
  try {
    if (IS_WIN) {
      const out = execFileSync('tasklist', ['/FI', 'IMAGENAME eq Doubao.exe', '/FO', 'CSV', '/NH'],
        { encoding: 'utf8', timeout: 8000 });
      return out.split(/\r?\n/)
        .map((line) => (line.match(/^"Doubao\.exe","(\d+)"/i) || [])[1])
        .filter(Boolean);
    }
    return execFileSync('pgrep', ['-f', 'Doubao.app/Contents/MacOS/Doubao'], { encoding: 'utf8' })
      .split('\n').map((s) => s.trim()).filter(Boolean);
  } catch { return []; }
}

/** Quit every Doubao process: osascript on macOS, taskkill on Windows. */
async function quitApp() {
  if (IS_WIN) {
    for (const name of WIN_EXE_NAMES) {
      try { execFileSync('taskkill', ['/IM', name, '/F', '/T'], { stdio: 'ignore', timeout: 15000 }); } catch { /* not running */ }
    }
    return;
  }
  try { execFileSync('osascript', ['-e', 'tell application "Doubao" to quit'], { timeout: 8000 }); } catch {}
}

/** Launch Doubao with a devtools port. Throws when the Windows executable is unknown. */
function launchApp() {
  if (IS_WIN) {
    const exe = findWindowsAppPath();
    if (!exe) throw new Error('Doubao.exe not found; set DOUBAO_APP_EXE to its full path');
    spawn(exe, [`--remote-debugging-port=${DEFAULTS.port}`],
      { detached: true, stdio: 'ignore', windowsHide: false }).unref();
    return;
  }
  spawn('open', ['-a', 'Doubao', '--args', `--remote-debugging-port=${DEFAULTS.port}`],
    { detached: true, stdio: 'ignore' }).unref();
}

async function pageState(cdp) {
  return cdp.eval(`(() => {
    const vis = (e) => !!(e.offsetWidth || e.offsetHeight);
    const replies = [...document.querySelectorAll(${JSON.stringify(SEL.reply)})];
    const last = replies[replies.length - 1];
    const composer = document.querySelector(${JSON.stringify(SEL.composer)});
    return {
      title: document.title,
      url: location.href,
      replies: replies.length,
      lastReply: last ? (last.innerText || '').trim().slice(0, 400) : null,
      composerChars: composer ? (composer.innerText || '').length : null,
      composerFocused: document.activeElement === composer,
      sendVisible: !!document.querySelector(${JSON.stringify(SEL.send)}),
      chips: [...document.querySelectorAll(${JSON.stringify(SEL.inputChip)})].filter(vis)
        .map((e) => e.getAttribute('aria-label')).filter(Boolean),
    };
  })()`);
}

/** Innermost visible overlays (menus, popovers, dialogs, the 技能 panel). */
async function surfaces(cdp) {
  return cdp.eval(`(() => {
    const vis = (e) => !!(e.offsetWidth || e.offsetHeight);
    const MARKERS = ['快捷功能', '技能管理', '插件', '技能 ('];
    const cand = [...document.querySelectorAll('body *')].filter((e) => {
      if (!vis(e)) return false;
      const st = getComputedStyle(e);
      const floating = (st.position === 'fixed' || st.position === 'absolute') && +st.zIndex >= 60;
      const role = e.getAttribute('role');
      const t = e.innerText || '';
      const hasPanelText = MARKERS.some((m) => t.includes(m)) && t.length < 12000;
      return floating || role === 'dialog' || role === 'menu' || hasPanelText;
    });
    const text = (e) => (e.innerText || '').trim();
    const innermost = cand.filter((p) => cand.filter((o) => o !== p).every((o) => !text(o).includes(text(p))));
    return innermost.slice(-4).map((e) => ({
      tid: e.getAttribute('data-testid'),
      role: e.getAttribute('role'),
      z: getComputedStyle(e).zIndex,
      text: text(e).replace(/\\n+/g, ' | ').slice(0, 1800),
    }));
  })()`);
}

async function focusComposer(cdp) {
  const ok = await cdp.eval(`(() => {
    const ed = document.querySelector(${JSON.stringify(SEL.composer)});
    if (!ed) return false;
    ed.focus();
    const r = document.createRange(); r.selectNodeContents(ed); r.collapse(false);
    const s = getSelection(); s.removeAllRanges(); s.addRange(r);
    return true;
  })()`);
  if (!ok) throw new Error('composer not found (is the chat page focused?)');
  return ok;
}

async function clearComposer(cdp) {
  await focusComposer(cdp);
  await cdp.eval(`(() => { document.execCommand('selectAll'); document.execCommand('delete'); return true; })()`);
  await sleep(120);
}

async function replies(cdp, limit = 3) {
  return cdp.eval(`(() => {
    const nodes = [...document.querySelectorAll(${JSON.stringify(SEL.reply)})];
    return nodes.slice(-${Number(limit) || 3}).map((n) => {
      const t = n.querySelector(${JSON.stringify(SEL.replyText)});
      const imgs = [...n.querySelectorAll(${JSON.stringify(SEL.replyImages)})]
        .map((i) => i.currentSrc || i.src || '')
        .filter((s) => /^https?:/.test(s) && !/static\\/image|passport|avatar/i.test(s));
      return { text: (t ? t.innerText : n.innerText || '').trim(), images: [...new Set(imgs)] };
    });
  })()`);
}


/** Close stray overlays, then click a control; retry once. */
async function openControl(cdp, selector, settle = 900) {
  try { await cdp.press('Escape'); } catch { /* ignore */ }
  await sleep(250);
  try {
    await cdp.click(selector, { settle });
  } catch (e) {
    await sleep(400);
    await cdp.click(selector, { settle });
  }
  return true;
}


/** Text-diff based panel reader: click, then return whatever text newly appeared on the page.
 *  More robust than guessing popover classes/z-index, which vary per menu. */
function diffText(before, after) {
  let i = 0;
  while (i < before.length && i < after.length && before[i] === after[i]) i++;
  let j = 0;
  while (j < before.length - i && j < after.length - i
    && before[before.length - 1 - j] === after[after.length - 1 - j]) j++;
  return after.slice(i, after.length - j).trim();
}

/** Resolve the first selector that actually exists, so one tool can cover several app builds. */
async function resolveSelector(cdp, selector) {
  if (!Array.isArray(selector)) return selector;
  const found = await cdp.eval(`(() => {
    const list = ${JSON.stringify(selector)};
    for (const q of list) { try { if (document.querySelector(q)) return q; } catch (e) {} }
    return null;
  })()`);
  if (!found) throw new Error('element not found: ' + selector.join(' | '));
  return found;
}

async function panelDelta(cdp, selector, settle = 900) {
  const sel = await resolveSelector(cdp, selector);
  let before = await cdp.eval('document.body.innerText');
  await cdp.click(sel, { settle });
  let after = await cdp.eval('document.body.innerText');
  let inserted = diffText(before, after);
  if (!inserted) {
    // the control was probably already open (click closed it): reset and try once more
    await cdp.press('Escape');
    await sleep(350);
    before = await cdp.eval('document.body.innerText');
    await cdp.click(sel, { settle });
    after = await cdp.eval('document.body.innerText');
    inserted = diffText(before, after);
  }
  return { inserted: inserted.slice(0, 12000), grew: inserted.length > 0 };
}


/** Real pointer move over the last reply so hover-only controls mount. */
async function hoverLastReply(cdp) {
  const r = await cdp.eval(`(() => {
    const n = [...document.querySelectorAll(${JSON.stringify(SEL.reply)})].pop();
    if (!n) return null;
    n.scrollIntoView({ block: 'center' });
    const b = n.getBoundingClientRect();
    const clamp = (v, lo, hi) => Math.min(Math.max(v, lo), hi);
    return {
      x: clamp(b.x + b.width / 2, 12, innerWidth - 12),
      y: clamp(b.y + b.height / 2, 12, innerHeight - 12),
      inView: b.bottom > 0 && b.top < innerHeight,
    };
  })()`);
  if (!r) return false;
  await cdp.send('Input.dispatchMouseEvent', { type: 'mouseMoved', x: r.x - 30, y: r.y - 10 });
  await cdp.send('Input.dispatchMouseEvent', { type: 'mouseMoved', x: r.x, y: r.y });
  await sleep(600);
  return true;
}

async function clickText(cdp, needle, rootSelector) {
  const sel = await cdp.eval(`(() => {
    const vis = (e) => !!(e.offsetWidth || e.offsetHeight);
    const root = document.querySelector(${JSON.stringify(rootSelector || 'body')}) || document.body;
    const nodes = [...root.querySelectorAll('button,[role=button],[role=menuitem],[role=option],div,li,span,label')].filter(vis);
    const wanted = ${JSON.stringify(needle)};
    const flat = (e) => (e.innerText || '').replace(/\\s+/g, ' ').trim();
    const firstLine = (e) => ((e.innerText || '').trim().split('\\n')[0] || '').trim();
    // 1) exact text, 2) first line equals the needle (list rows carry a description below),
    // 3) prefix match. Always prefer the innermost (shortest-text) candidate so we do not
    // click a giant container that happens to contain the label.
    let pool = nodes.filter((e) => flat(e) === wanted);
    if (!pool.length) pool = nodes.filter((e) => firstLine(e) === wanted);
    if (!pool.length) pool = nodes.filter((e) => flat(e).startsWith(wanted) && flat(e).length < wanted.length + 24);
    if (!pool.length) return null;
    pool.sort((a, b) => flat(a).length - flat(b).length);
    const node = pool[0];
    node.dataset.dshProbe = '1';
    return '[data-dsh-probe="1"]';
  })()`);
  if (!sel) return false;
  await cdp.click(sel, { settle: 500 });
  await cdp.eval(`(() => { const e = document.querySelector('[data-dsh-probe="1"]'); if (e) delete e.dataset.dshProbe; return true; })()`);
  return true;
}

/* ------------------------------------------------------------------- tools */

const tools = {
  /* ---------- meta ---------- */
  doubao_desktop_status: {
    description: 'App process, devtools port, active page and composer state. Read-only.',
    schema: { type: 'object', properties: {}, additionalProperties: false },
    async run() {
      const running = await pids();
      let version = null, state = null, error = null;
      try {
        version = await httpJson(`http://127.0.0.1:${DEFAULTS.port}/json/version`);
        state = await pageState(await connect());
      } catch (e) { error = e.message; }
      return {
        ok: !error,
        app: { running: running.length > 0, pids: running.slice(0, 3) },
        devtools: { port: DEFAULTS.port, browser: version ? version.Browser : null, error },
        page: state,
        hint: error ? 'app is running without a devtools port → call doubao_desktop_ensure' : 'ready',
      };
    },
  },

  doubao_desktop_ensure: {
    description: 'Relaunch the app with --remote-debugging-port when the devtools port is closed.',
    schema: { type: 'object', properties: {}, additionalProperties: false },
    async run() {
      try { await httpJson(`http://127.0.0.1:${DEFAULTS.port}/json/version`); return { ok: true, action: 'none' }; } catch {}
      if ((await pids()).length) {
        await quitApp();
        for (let i = 0; i < 40; i++) { if (!(await pids()).length) break; await sleep(300); }
      }
      try { launchApp(); } catch (e) { return { ok: false, action: 'launch-failed', error: String(e.message || e) }; }
      for (let i = 0; i < 45; i++) {
        await sleep(700);
        try { await httpJson(`http://127.0.0.1:${DEFAULTS.port}/json/version`, 1500); return { ok: true, action: 'relaunched' }; } catch {}
      }
      return { ok: false, action: 'relaunch-failed' };
    },
  },

  doubao_desktop_snapshot: {
    description: 'Structured snapshot: page, composer, last reply, visible overlays/panels.',
    schema: { type: 'object', properties: {}, additionalProperties: false },
    async run() {
      const cdp = await connect();
      return { ok: true, page: await pageState(cdp), surfaces: await surfaces(cdp) };
    },
  },

  doubao_desktop_screenshot: {
    description: 'Capture the webview as PNG and return the saved path.',
    schema: { type: 'object', properties: { save_path: { type: 'string' } }, additionalProperties: false },
    async run(args) {
      const cdp = await connect();
      fs.mkdirSync(OUT_DIR, { recursive: true });
      const file = args.save_path || path.join(OUT_DIR, `doubao-${Date.now()}.png`);
      await cdp.screenshot(file);
      return { ok: true, saved_path: file, bytes: fs.statSync(file).size };
    },
  },

  doubao_desktop_eval: {
    description: 'Escape hatch: evaluate JS in the page and return the value.',
    schema: { type: 'object', properties: { expression: { type: 'string' } }, required: ['expression'], additionalProperties: false },
    async run(args) {
      if (!args.expression) return { ok: false, error: 'expression required' };
      const cdp = await connect();
      return { ok: true, value: await cdp.eval(args.expression) };
    },
  },

  /* ---------- input layer ---------- */
  doubao_desktop_click: {
    description: 'Real mouse click on a CSS selector, a data-testid, or an element whose text matches exactly. Then reports overlays that opened.',
    schema: {
      type: 'object',
      properties: {
        selector: { type: 'string' },
        testid: { type: 'string' },
        text: { type: 'string', description: 'exact visible text to click' },
        scope: { type: 'string', description: 'optional CSS scope for text lookup' },
      },
      additionalProperties: false,
    },
    async run(args) {
      const cdp = await connect();
      let ok = false;
      if (args.selector) { await cdp.click(args.selector, { settle: 900 }); ok = true; }
      else if (args.testid) { await cdp.click(`[data-testid=${args.testid}]`, { settle: 900 }); ok = true; }
      else if (args.text) { ok = await clickText(cdp, args.text, args.scope); }
      if (!ok) return { ok: false, error: 'target not found' };
      // Popovers (workspace switch, model menu) mount a frame or two after the click.
      await sleep(350);
      return { ok: true, surfaces: await surfaces(cdp), page: await pageState(cdp) };
    },
  },

  doubao_desktop_press: {
    description: 'Press a key in the page (Enter, Escape, Tab, ArrowDown, Backspace) or send Cmd+A.',
    schema: {
      type: 'object',
      properties: { key: { type: 'string' }, meta: { type: 'boolean' } },
      required: ['key'],
      additionalProperties: false,
    },
    async run(args) {
      const cdp = await connect();
      if (args.meta) {
        await cdp.send('Input.dispatchKeyEvent', { type: 'keyDown', key: args.key, code: `Key${args.key.toUpperCase()}`, modifiers: 4 });
        await cdp.send('Input.dispatchKeyEvent', { type: 'keyUp', key: args.key, code: `Key${args.key.toUpperCase()}`, modifiers: 4 });
      } else {
        await cdp.press(args.key);
      }
      return { ok: true };
    },
  },

  doubao_desktop_type: {
    description: 'Insert text into the chat composer (focuses it, optionally replacing content).',
    schema: {
      type: 'object',
      properties: { text: { type: 'string' }, replace: { type: 'boolean' } },
      required: ['text'],
      additionalProperties: false,
    },
    async run(args) {
      const cdp = await connect();
      if (args.replace !== false) await clearComposer(cdp);
      await focusComposer(cdp);
      await cdp.insertText(args.text);
      return { ok: true, page: await pageState(cdp) };
    },
  },

  /* ---------- chat ---------- */
  doubao_desktop_ask: {
    description: 'Send a message in the open conversation and wait for the finished reply (text + image urls).',
    schema: {
      type: 'object',
      properties: {
        text: { type: 'string' },
        timeout_ms: { type: 'integer', description: 'default 120000' },
        replace: { type: 'boolean' },
      },
      required: ['text'], additionalProperties: false,
    },
    async run(args) {
      const text = (args.text || '').trim();
      if (!text) return { ok: false, error: 'text required' };
      const timeout = Math.min(Number(args.timeout_ms) || 120000, 600000);
      const cdp = await connect();
      const before = await cdp.eval(`document.querySelectorAll(${JSON.stringify(SEL.reply)}).length`);
      if (args.replace !== false) await clearComposer(cdp);
      await focusComposer(cdp);
      await cdp.insertText(text);
      await sleep(300);
      const send = await cdp.eval(`(() => {
        const b = document.querySelector(${JSON.stringify(SEL.send)});
        if (!b) return 'no-send-button';
        return 'send-visible';
      })()`);
      if (send !== 'send-visible') return { ok: false, error: 'send button did not appear', state: await pageState(cdp) };
      await cdp.click(SEL.send, { settle: 0 });
      const started = Date.now();
      let prev = '', stable = 0, hit = null;
      while (Date.now() - started < timeout) {
        await sleep(1200);
        const count = await cdp.eval(`document.querySelectorAll(${JSON.stringify(SEL.reply)}).length`);
        if (count <= before) continue;
        const list = await replies(cdp, 1);
        const cur = list[0] ? list[0].text : '';
        const pending = !cur || PENDING.test(cur.slice(-24));
        if (!pending && cur === prev) stable += 1; else stable = 0;
        prev = cur;
        if (!pending && stable >= 2) { hit = list[0]; break; }
      }
      const finalList = hit ? [hit] : await replies(cdp, 1);
      return {
        ok: !!hit,
        sent: text,
        reply: finalList[0] ? finalList[0].text : null,
        images: finalList[0] ? finalList[0].images : [],
        waited_ms: Date.now() - started,
        timed_out: !hit,
      };
    },
  },

  doubao_desktop_replies: {
    description: 'Read the last N assistant replies (text + image urls).',
    schema: { type: 'object', properties: { limit: { type: 'integer' } }, additionalProperties: false },
    async run(args) {
      const cdp = await connect();
      return { ok: true, replies: await replies(cdp, args.limit || 3) };
    },
  },

  doubao_desktop_new_chat: {
    description: 'Start a fresh conversation (sidebar 新对话).',
    schema: { type: 'object', properties: {}, additionalProperties: false },
    async run() {
      const cdp = await connect();
      await cdp.click(SEL.newChat);
      await sleep(900);
      return { ok: true, page: await pageState(cdp) };
    },
  },

  doubao_desktop_conversations: {
    description: 'List conversation entries from the sidebar (title + latest snippet).',
    schema: { type: 'object', properties: { limit: { type: 'integer' } }, additionalProperties: false },
    async run(args) {
      const cdp = await connect();
      const items = await cdp.eval(`(() => {
        const nodes = [...document.querySelectorAll(${JSON.stringify(SEL.convItem)})].filter((e) => e.offsetWidth || e.offsetHeight);
        return nodes.map((e) => (e.innerText || '').replace(/\\n+/g, ' | ').trim()).filter(Boolean);
      })()`);
      return { ok: true, count: items.length, conversations: items.slice(0, args.limit || 30) };
    },
  },

  doubao_desktop_open_conversation: {
    description: 'Open a conversation by its sidebar text (exact or substring match).',
    schema: { type: 'object', properties: { title: { type: 'string' } }, required: ['title'], additionalProperties: false },
    async run(args) {
      const cdp = await connect();
      const ok = await cdp.eval(`(() => {
        const nodes = [...document.querySelectorAll(${JSON.stringify(SEL.convItem)})].filter((e) => e.offsetWidth || e.offsetHeight);
        const needle = ${JSON.stringify(args.title || '')};
        const hit = nodes.find((e) => (e.innerText || '').includes(needle));
        if (!hit) return false;
        hit.dataset.dshOpen = '1';
        return true;
      })()`);
      if (!ok) return { ok: false, error: 'conversation not found: ' + args.title };
      await cdp.click('[data-dsh-open="1"]');
      await cdp.eval(`(() => { const e = document.querySelector('[data-dsh-open="1"]'); if (e) delete e.dataset.dshOpen; return true; })()`);
      await sleep(900);
      return { ok: true, page: await pageState(cdp) };
    },
  },

  doubao_desktop_message_action: {
    description: 'Run an action on the last reply: copy, share, regenerate, like, dislike, read_aloud, more, image_download, image_reference, image_canvas.',
    schema: {
      type: 'object',
      properties: { action: { type: 'string', enum: ['copy', 'share', 'regenerate', 'like', 'dislike', 'read_aloud', 'more', 'image_download', 'image_reference', 'image_canvas'] } },
      required: ['action'], additionalProperties: false,
    },
    async run(args) {
      const map = {
        copy: SEL.copy, share: SEL.share, regenerate: SEL.regenerate, like: SEL.like,
        dislike: SEL.dislike, read_aloud: SEL.readAloud, more: SEL.messageMore,
        image_download: SEL.imageDownload, image_reference: SEL.imageReference, image_canvas: SEL.imageCanvas,
      };
      const sel = map[args.action];
      if (!sel) return { ok: false, error: 'unknown action' };
      const fallbacks = {
        read_aloud: ['[aria-label=朗读]'],
        copy: ['[aria-label=复制]'],
        share: ['[aria-label=分享]'],
        regenerate: ['[aria-label=重新生成]'],
      };
      const selectors = [sel, ...(fallbacks[args.action] || [])];
      const cdp = await connect();
      // hover first: the action bar and image controls only mount while the reply is hovered
      await hoverLastReply(cdp);
      let found = false;
      for (const candidate of selectors) {
        const hit = await cdp.eval(`(() => {
          const nodes = [...document.querySelectorAll(${JSON.stringify(candidate)})].filter((e) => e.offsetWidth || e.offsetHeight);
          if (!nodes.length) return false;
          nodes[nodes.length - 1].dataset.dshAct = '1';
          return true;
        })()`);
        if (hit) { found = true; break; }
      }
      if (!found) {
        // last resort: jump to the newest message and hover again
        await cdp.eval(`(() => { const b = document.querySelector(${JSON.stringify(SEL.toBottom)}); if (b) b.click(); window.scrollTo(0, document.body.scrollHeight); return true; })()`);
        await sleep(700);
        await hoverLastReply(cdp);
        for (const candidate of selectors) {
          const hit = await cdp.eval(`(() => {
            const nodes = [...document.querySelectorAll(${JSON.stringify(candidate)})].filter((e) => e.offsetWidth || e.offsetHeight);
            if (!nodes.length) return false;
            nodes[nodes.length - 1].dataset.dshAct = '1';
            return true;
          })()`);
          if (hit) { found = true; break; }
        }
        if (!found) {
          // last resort for TTS: the button may exist but stay unrendered; JS click the first one
          if (args.action === 'read_aloud') {
            const js = await cdp.eval(`(() => {
              const b = document.querySelector('[data-testid=audio_play_button]');
              if (!b) return 'missing';
              b.click();
              return 'js-clicked';
            })()`);
            if (js === 'js-clicked') return { ok: true, action: args.action, via: 'js-click' };
          }
          return { ok: false, error: `control not available: ${args.action}`, page: await pageState(cdp) };
        }
      }
      await cdp.click('[data-dsh-act="1"]', { settle: 600 });
      await cdp.eval(`(() => { const e = document.querySelector('[data-dsh-act="1"]'); if (e) delete e.dataset.dshAct; return true; })()`);
      return { ok: true, action: args.action, surfaces: await surfaces(cdp) };
    },
  },

  doubao_desktop_images: {
    description: 'Collect and download images of the last N replies.',
    schema: {
      type: 'object',
      properties: { limit: { type: 'integer' }, download: { type: 'boolean' } },
      additionalProperties: false,
    },
    async run(args) {
      const cdp = await connect();
      const list = await replies(cdp, args.limit || 1);
      const urls = [...new Set((list || []).flatMap((r) => r.images || []))];
      const out = { ok: true, count: urls.length, urls, saved: [] };
      if (args.download !== false) {
        fs.mkdirSync(OUT_DIR, { recursive: true });
        for (const [i, u] of urls.entries()) {
          try {
            const res = await fetch(u);
            const buf = Buffer.from(await res.arrayBuffer());
            const ext = (u.split('?')[0].split('.').pop() || 'png').slice(0, 4);
            const file = path.join(OUT_DIR, `img-${Date.now()}-${i}.${ext}`);
            fs.writeFileSync(file, buf);
            out.saved.push({ path: file, bytes: buf.length });
          } catch (e) { out.saved.push({ error: String(e.message || e) }); }
        }
      }
      return out;
    },
  },

  /* ---------- model / skills / plugins ---------- */
  doubao_desktop_models: {
    description: 'Open the model menu and return the model list (and reasoning-effort label).',
    schema: { type: 'object', properties: {}, additionalProperties: false },
    async run() {
      const cdp = await connect();
      const d = await panelDelta(cdp, SEL.model, 900);
      await cdp.press('Escape');
      return { ok: d.grew, panel: d.inserted, surfaces: await surfaces(cdp) };
    },
  },

  doubao_desktop_set_model: {
    description: 'Pick a model by visible name in the model menu.',
    schema: { type: 'object', properties: { name: { type: 'string' } }, required: ['name'], additionalProperties: false },
    async run(args) {
      const cdp = await connect();
      await panelDelta(cdp, SEL.model, 900);
      const ok = await clickText(cdp, args.name, 'body');
      if (!ok) { await cdp.press('Escape'); return { ok: false, error: 'model not found: ' + args.name, surfaces: await surfaces(cdp) }; }
      await sleep(500);
      return { ok: true, model: args.name, page: await pageState(cdp) };
    },
  },

  doubao_desktop_skills: {
    description: 'Open the skills panel (技能) and return 快捷功能 + 技能 list text.',
    schema: { type: 'object', properties: {}, additionalProperties: false },
    async run() {
      const cdp = await connect();
      const d = await panelDelta(cdp, SEL.skill, 1000);
      await cdp.press('Escape');
      return { ok: d.grew, panel: d.inserted, surfaces: await surfaces(cdp) };
    },
  },

  doubao_desktop_plugins: {
    description: 'Open the plugin/伙伴 panel and return its text.',
    schema: { type: 'object', properties: {}, additionalProperties: false },
    async run() {
      const cdp = await connect();
      if (IS_WIN) {
        // Windows builds ship no composer plugin chip (the 2.35 composer only has
        // upload / mode / skills / model). Plugins and 伙伴 live on the
        // 「插件 · 技能 · 伙伴」page, so read it there and come back.
        const before = await cdp.eval('location.href');
        await cdp.click(SEL.skillsPage, { settle: 1600 });
        const info = await cdp.eval(`(() => ({
          title: document.title,
          url: location.href,
          text: (document.body.innerText || '').replace(/\\n+/g, ' | ').slice(0, 4000),
        }))()`);
        await cdp.eval('history.back()');
        await sleep(900);
        return {
          ok: !!(info && info.text), via: 'skills-page',
          panel: info.text, page: { title: info.title, url: info.url, returned_to: before },
        };
      }
      const d = await panelDelta(cdp, SEL.plugin, 1000);
      await cdp.press('Escape');
      return { ok: d.grew, panel: d.inserted, surfaces: await surfaces(cdp) };
    },
  },

  doubao_desktop_toggle_skill: {
    description: 'Open the skills panel and click a skill by its visible name.',
    schema: { type: 'object', properties: { name: { type: 'string' } }, required: ['name'], additionalProperties: false },
    async run(args) {
      const cdp = await connect();
      await panelDelta(cdp, SEL.skill, 1000);
      const ok = await clickText(cdp, args.name, 'body');
      if (!ok) { await cdp.press('Escape'); return { ok: false, error: 'skill not found: ' + args.name }; }
      await sleep(600);
      return { ok: true, selected: args.name, page: await pageState(cdp) };
    },
  },

  doubao_desktop_upload_file: {
    description: 'Attach local files to the composer through the 上传 control.',
    schema: {
      type: 'object',
      properties: { paths: { type: 'array', items: { type: 'string' } }, then_send: { type: 'string' } },
      required: ['paths'], additionalProperties: false,
    },
    async run(args) {
      const missing = (args.paths || []).filter((p) => !fs.existsSync(p));
      if (missing.length) return { ok: false, error: 'missing files: ' + missing.join(', ') };
      const cdp = await connect();
      let attached = false;
      try { await cdp.setFiles(args.paths); attached = true; } catch {}
      if (!attached) {
        await cdp.click(SEL.upload, { settle: 800 });
        await cdp.setFiles(args.paths);
      }
      await sleep(1200);
      let sent = null;
      if (args.then_send) {
        await focusComposer(cdp);
        await cdp.insertText(args.then_send);
        await sleep(200);
        await cdp.click(SEL.send, { settle: 0 });
        sent = args.then_send;
      }
      return { ok: true, files: args.paths, sent, page: await pageState(cdp) };
    },
  },

  /* ---------- navigation ---------- */
  doubao_desktop_goto: {
    description: 'Navigate the app: workbench | cron | skills | library | office | search | settings | chat.',
    schema: {
      type: 'object',
      properties: { target: { type: 'string', enum: ['workbench', 'cron', 'skills', 'library', 'office', 'search', 'settings', 'chat'] } },
      required: ['target'], additionalProperties: false,
    },
    async run(args) {
      const map = {
        workbench: SEL.workbench, cron: SEL.cron, skills: SEL.skillsPage, library: SEL.library,
        office: SEL.officeTask, search: SEL.search, settings: SEL.settings, chat: SEL.newChat,
      };
      const sel = map[args.target];
      if (!sel) return { ok: false, error: 'unknown target' };
      const cdp = await connect();
      await cdp.click(sel, { settle: 1500 });
      const info = await cdp.eval(`(() => ({ title: document.title, url: location.href, text: (document.body.innerText || '').replace(/\\n+/g, ' | ').slice(0, 1200) }))()`);
      return { ok: true, target: args.target, page: info };
    },
  },

  doubao_desktop_search: {
    description: 'Global search (⇧⌘K style) for a query inside the app.',
    schema: { type: 'object', properties: { query: { type: 'string' } }, required: ['query'], additionalProperties: false },
    async run(args) {
      const cdp = await connect();
      const d = await panelDelta(cdp, SEL.search, 900);
      await cdp.insertText(args.query || '');
      await sleep(1000);
      const body = await cdp.eval('document.body.innerText');
      const hits = body.split('\\n').filter((l) => (args.query || '') && l.includes(args.query)).slice(0, 10);
      return { ok: d.grew || hits.length > 0, panel: d.inserted, hits, surfaces: await surfaces(cdp) };
    },
  },
};

module.exports = { tools, OUT_DIR, helpers: { pids, pageState, surfaces, replies } };
