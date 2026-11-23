#!/usr/bin/env node
'use strict';
/**
 * doubao — command line front end for the same 23 tools the MCP server exposes.
 * Lets an Agent use this project without registering any MCP server.
 *
 *   doubao list
 *   doubao status
 *   doubao ask "让豆包画一只猫"
 *   doubao call doubao_desktop_conversations '{"limit":5}'
 *   doubao screenshot
 */
const { tools } = require('../src/tools');

function die(msg) {
  console.error(msg);
  process.exit(1);
}

function print(obj) {
  process.stdout.write(JSON.stringify(obj, null, 2) + '\n');
}

async function call(name, args) {
  const tool = tools[name];
  if (!tool) die(`unknown tool: ${name}\nrun: doubao list`);
  try {
    return await tool.run(args || {});
  } catch (e) {
    return { ok: false, error: String((e && e.message) || e) };
  }
}

(async () => {
  const [cmd, ...rest] = process.argv.slice(2);

  if (!cmd || cmd === '-h' || cmd === '--help' || cmd === 'help') {
    console.log(`doubao — drive the local Doubao desktop app

  doubao list                     list tools
  doubao status                   app / devtools / page state
  doubao ensure                   relaunch the app with a devtools port
  doubao ask <text> [timeout_ms]  send a message and wait for the reply
  doubao replies [n]              read the last n assistant replies
  doubao images [n]               download images from the last n replies
  doubao screenshot [path]        capture the webview
  doubao conversations [n]        list sidebar conversations
  doubao open <title>             open a conversation by title
  doubao models                   list models
  doubao set-model <name>         switch model
  doubao skills                   read the skills panel
  doubao goto <target>            workbench|cron|skills|library|office|search|chat
  doubao call <tool> [json]       call any tool directly

env: CDP_PORT (default 9333), DOUBAO_DESKTOP_OUT (image output dir)`);
    return;
  }

  if (cmd === 'list') {
    print(Object.entries(tools).map(([name, t]) => ({ name, description: t.description })));
    return;
  }

  const shortcuts = {
    status: ['doubao_desktop_status', {}],
    ensure: ['doubao_desktop_ensure', {}],
    replies: ['doubao_desktop_replies', { limit: Number(rest[0]) || 3 }],
    images: ['doubao_desktop_images', { limit: Number(rest[0]) || 1 }],
    screenshot: ['doubao_desktop_screenshot', rest[0] ? { save_path: rest[0] } : {}],
    conversations: ['doubao_desktop_conversations', { limit: Number(rest[0]) || 30 }],
    models: ['doubao_desktop_models', {}],
    skills: ['doubao_desktop_skills', {}],
    ask: ['doubao_desktop_ask', { text: rest[0] || '', timeout_ms: Number(rest[1]) || 120000 }],
    open: ['doubao_desktop_open_conversation', { title: rest.join(' ') }],
    'set-model': ['doubao_desktop_set_model', { name: rest.join(' ') }],
    goto: ['doubao_desktop_goto', { target: rest[0] }],
  };

  if (shortcuts[cmd]) {
    const [name, args] = shortcuts[cmd];
    print(await call(name, args));
    return;
  }

  if (cmd === 'call') {
    const name = rest[0];
    if (!name) die('usage: doubao call <tool> [json]');
    let args = {};
    if (rest[1]) {
      try { args = JSON.parse(rest[1]); } catch { die('second argument must be JSON'); }
    }
    print(await call(name, args));
    return;
  }

  die(`unknown command: ${cmd}\nrun: doubao --help`);
})().then(
  () => process.exit(0),
  (e) => { console.error(String((e && e.message) || e)); process.exit(1); },
);
