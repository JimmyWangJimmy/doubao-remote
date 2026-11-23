#!/usr/bin/env node
'use strict';
/**
 * doubao-desktop-mcp — MCP server (Streamable HTTP, JSON replies) that drives the
 * local Doubao desktop app over its Chromium DevTools endpoint.
 */
const http = require('http');
const crypto = require('crypto');
const { tools } = require('./tools');

const PORT = Number(process.env.DOUBAO_DESKTOP_PORT || 18812);
const SERVER_NAME = 'doubao-desktop';
const SERVER_VERSION = '2.0.0';
const PROTOCOLS = ['2025-06-18', '2025-03-26', '2024-11-05'];

const INSTRUCTIONS = [
  'Controls the locally installed Doubao desktop app (豆包.app) over its Chromium devtools port.',
  'Start with doubao_desktop_status; doubao_desktop_ensure relaunches the app with a debug port when missing.',
  'doubao_desktop_snapshot shows the page plus any open panel; doubao_desktop_click/doubao_desktop_type are the generic input layer (JS .click() alone does not work on most Doubao controls — this server dispatches real mouse events).',
  'doubao_desktop_ask sends a chat turn and waits for the finished reply; doubao_desktop_images downloads generated pictures.',
].join(' ');

async function dispatch(msg) {
  const method = msg.method;
  const id = msg.id;
  if (method === 'initialize') {
    const asked = (msg.params || {}).protocolVersion;
    return {
      jsonrpc: '2.0', id,
      result: {
        protocolVersion: PROTOCOLS.includes(asked) ? asked : '2024-11-05',
        capabilities: { tools: { listChanged: false } },
        serverInfo: { name: SERVER_NAME, version: SERVER_VERSION },
        instructions: INSTRUCTIONS,
      },
    };
  }
  if (method && method.startsWith('notifications/')) return null;
  if (method === 'ping') return { jsonrpc: '2.0', id, result: {} };
  if (method === 'tools/list') {
    return {
      jsonrpc: '2.0', id,
      result: {
        tools: Object.entries(tools).map(([name, t]) => ({
          name, description: t.description, inputSchema: t.schema,
        })),
      },
    };
  }
  if (method === 'tools/call') {
    const p = msg.params || {};
    const t = tools[p.name];
    if (!t) return { jsonrpc: '2.0', id, error: { code: -32602, message: 'unknown tool: ' + p.name } };
    let result;
    try {
      result = await t.run(p.arguments || {});
    } catch (e) {
      result = { ok: false, error: String((e && e.message) || e) };
    }
    return {
      jsonrpc: '2.0', id,
      result: {
        content: [{ type: 'text', text: JSON.stringify(result, null, 2) }],
        structuredContent: result,
        isError: !!(result && result.ok === false),
      },
    };
  }
  if (method === 'resources/list') return { jsonrpc: '2.0', id, result: { resources: [] } };
  if (method === 'prompts/list') return { jsonrpc: '2.0', id, result: { prompts: [] } };
  if (id === undefined || id === null) return null;
  return { jsonrpc: '2.0', id, error: { code: -32601, message: 'method not found: ' + method } };
}

const server = http.createServer((req, res) => {
  const reply = (obj, status = 200, session) => {
    const body = obj === null ? Buffer.alloc(0) : Buffer.from(JSON.stringify(obj), 'utf8');
    const headers = {
      'Content-Type': 'application/json; charset=utf-8',
      'Content-Length': body.length,
      'Cache-Control': 'no-store',
    };
    if (session) headers['mcp-session-id'] = session;
    res.writeHead(status, headers);
    res.end(body);
  };
  if (req.method === 'DELETE') { res.writeHead(204); res.end(); return; }
  if (req.method !== 'POST') { reply({ error: 'use POST /mcp' }, 405); return; }
  if ((req.url || '').replace(/\/$/, '') !== '/mcp') { reply({ error: 'not found' }, 404); return; }
  let raw = '';
  req.on('data', (c) => { raw += c; });
  req.on('end', async () => {
    let payload;
    try { payload = JSON.parse(raw); } catch {
      reply({ jsonrpc: '2.0', id: null, error: { code: -32700, message: 'parse error' } }, 400);
      return;
    }
    const batch = Array.isArray(payload);
    const items = batch ? payload : [payload];
    const session = req.headers['mcp-session-id'] || crypto.randomUUID();
    const out = [];
    for (const m of items) {
      try {
        const r = await dispatch(m);
        if (r) out.push(r);
      } catch (e) {
        if (m && m.id !== undefined) out.push({ jsonrpc: '2.0', id: m.id, error: { code: -32603, message: String(e.message || e) } });
      }
    }
    if (!out.length) { reply(null, 202, session); return; }
    reply(batch ? out : out[0], 200, session);
  });
});

server.listen(PORT, '127.0.0.1', () => {
  process.stderr.write(`doubao-desktop-mcp listening on http://127.0.0.1:${PORT}/mcp (tools: ${Object.keys(tools).length})\n`);
});
