#!/usr/bin/env node
'use strict';
/**
 * Full-surface smoke test against the running MCP server.
 * usage: node scripts/smoke.js [--json out.json] [--md docs/SMOKE.md]
 */
const http = require('http');
const fs = require('fs');
const path = require('path');

const PORT = Number(process.env.DOUBAO_DESKTOP_PORT || 18812);

function rpc(name, args = {}, timeout = 240000) {
  return new Promise((resolve, reject) => {
    const body = JSON.stringify({ jsonrpc: '2.0', id: 1, method: 'tools/call', params: { name, arguments: args } });
    const req = http.request({
      host: '127.0.0.1', port: PORT, path: '/mcp', method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Content-Length': Buffer.byteLength(body) },
      timeout,
    }, (res) => {
      let b = '';
      res.on('data', (c) => (b += c));
      res.on('end', () => {
        try {
          const j = JSON.parse(b);
          if (j.error) return reject(new Error(JSON.stringify(j.error)));
          resolve(j.result.structuredContent);
        } catch (e) { reject(new Error('bad reply: ' + b.slice(0, 200))); }
      });
    });
    req.on('timeout', () => req.destroy(new Error('timeout')));
    req.on('error', reject);
    req.end(body);
  });
}

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

/** Some actions (TTS, share…) can drop the composer chips; reopen the conversation and retry. */
async function ensureChatSurface() {
  let st = await rpc('doubao_desktop_snapshot');
  const ok = st.page && Array.isArray(st.page.chips) && st.page.chips.length > 2;
  if (!ok) {
    await rpc('doubao_desktop_press', { key: 'Escape' });
    await sleep(500);
    await rpc('doubao_desktop_open_conversation', { title: '介绍自己' });
    st = await rpc('doubao_desktop_snapshot');
  }
  return st;
}
const results = [];
/** ok === 'skip' records a SKIP: the capability exists but this machine has no sample for it. */
function record(id, capability, tool, ok, detail) {
  const skipped = ok === 'skip';
  results.push({ id, capability, tool, ok: skipped ? null : ok, skipped, detail: detail === undefined ? null : detail });
  const flag = skipped ? 'SKIP' : (ok ? 'PASS' : 'FAIL');
  console.log(`${flag} ${id} ${capability} (${tool}) ${detail ? '— ' + String(detail).slice(0, 120) : ''}`);
}

/** Does the open conversation actually contain rendered images? (images / image_canvas need a sample) */
async function conversationHasImages() {
  const r = await rpc('doubao_desktop_eval', {
    expression: `document.querySelectorAll('[data-testid=receive_message] img, [data-testid=message_image_content] img, [data-testid=mdbox_image] img').length`,
  });
  return Number(r && r.value) > 0;
}

(async () => {
  const [[, , ...cliArgs]] = [process.argv];
  const jsonOut = cliArgs.includes('--json') ? cliArgs[cliArgs.indexOf('--json') + 1] : 'docs/smoke.json';
  const mdOut = cliArgs.includes('--md') ? cliArgs[cliArgs.indexOf('--md') + 1] : 'docs/SMOKE.md';
  // Opt-in: burn one image generation so C08/C28 have a sample instead of skipping.
  const genSample = cliArgs.includes('--gen-sample');

  let r;
  r = await rpc('doubao_desktop_status');
  record('C01', '应用状态 / devtools 连通', 'doubao_desktop_status', !!r.ok, r.devtools && r.devtools.browser);

  r = await rpc('doubao_desktop_open_conversation', { title: '介绍自己' });
  record('C02', '按标题打开会话', 'doubao_desktop_open_conversation', !!r.ok, r.page && r.page.title);

  r = await rpc('doubao_desktop_snapshot');
  record('C03', '页面快照 + 浮层读取', 'doubao_desktop_snapshot', !!r.ok && !!r.page, r.page && r.page.title);

  r = await rpc('doubao_desktop_message_action', { action: 'copy' });
  record('C09', '消息动作：复制', 'doubao_desktop_message_action', !!r.ok, 'copy');

  r = await rpc('doubao_desktop_message_action', { action: 'read_aloud' });
  record('C10', '消息动作：朗读（TTS）', 'doubao_desktop_message_action', !!r.ok, r.error || 'read_aloud');

  await ensureChatSurface();
  r = await rpc('doubao_desktop_models');
  record('C04', '模型菜单枚举', 'doubao_desktop_models', /豆包 2\.1 Pro/.test(r.panel || ''), (r.panel || '').replace(/\n/g, ' ').slice(0, 80));

  await ensureChatSurface();
  r = await rpc('doubao_desktop_skills');
  record('C05', '技能面板枚举（快捷功能 + 技能 30）', 'doubao_desktop_skills', /快捷功能/.test(r.panel || ''), (r.panel || '').replace(/\n/g, ' ').slice(0, 80));

  r = await rpc('doubao_desktop_plugins');
  record('C06', '插件/伙伴面板', 'doubao_desktop_plugins', (r.panel || '').length > 0, (r.panel || '').replace(/\n/g, ' ').slice(0, 80));

  r = await rpc('doubao_desktop_conversations');
  record('C07', '会话列表读取', 'doubao_desktop_conversations', r.ok && r.count > 0, `${r.count} 条`);

  let hasImgSample = await conversationHasImages();
  if (!hasImgSample && genSample) {
    console.log('… --gen-sample: asking Doubao to draw a tiny sample (this costs one image generation)');
    await rpc('doubao_desktop_ask', { text: '画一个纯色背景的红色圆形，正方形，画面干净', timeout_ms: 240000 });
    hasImgSample = await conversationHasImages();
    console.log(`… sample ready: ${hasImgSample}`);
  }
  r = await rpc('doubao_desktop_images', { limit: 3 });
  record('C08', '历史生成图抓取（message_image_content）', 'doubao_desktop_images',
    hasImgSample ? (r.ok && r.count > 0) : 'skip',
    hasImgSample ? `${r.count} 张` : '当前会话没有生成图样本，跳过');

  await ensureChatSurface();
  r = await rpc('doubao_desktop_set_model', { name: '豆包 2.1 Pro' });
  record('C11', '切换模型', 'doubao_desktop_set_model', !!r.ok, r.model || r.error);
  await rpc('doubao_desktop_set_model', { name: '自动' });

  await ensureChatSurface();
  r = await rpc('doubao_desktop_toggle_skill', { name: '地图' });
  record('C12', '技能选择', 'doubao_desktop_toggle_skill', !!r.ok, r.selected || r.error);
  await rpc('doubao_desktop_press', { key: 'Escape' });

  r = await rpc('doubao_desktop_new_chat');
  record('C13', '新建会话', 'doubao_desktop_new_chat', !!r.ok, r.page && r.page.url);

  r = await rpc('doubao_desktop_type', { text: 'MCP 冒烟测试文本' });
  const typed = r.page && r.page.composerChars >= 2;
  record('C14', '输入层：写入输入框', 'doubao_desktop_type', !!typed, `${r.page && r.page.composerChars} 字`);

  r = await rpc('doubao_desktop_ask', { text: '只回答两个字：收到', timeout_ms: 90000 });
  record('C15', '对话：发送并取回回复', 'doubao_desktop_ask', !!r.ok && !!r.reply, r.reply && r.reply.slice(0, 60));

  r = await rpc('doubao_desktop_replies', { limit: 2 });
  record('C16', '回复历史读取', 'doubao_desktop_replies', r.ok && r.replies.length > 0, `${r.replies.length} 条`);

  for (const [id, target, label] of [
    ['C17', 'workbench', '工作台'],
    ['C18', 'cron', '定时任务'],
    ['C19', 'library', '资料库'],
    ['C20', 'skills', '技能页'],
  ]) {
    const res = await rpc('doubao_desktop_goto', { target });
    record(id, `导航：${label}`, 'doubao_desktop_goto', !!(res.ok && res.page && res.page.text), res.page && res.page.title);
  }
  await rpc('doubao_desktop_goto', { target: 'chat' });

  r = await rpc('doubao_desktop_search', { query: '年报' });
  record('C21', '全局搜索', 'doubao_desktop_search', !!(r.ok || (r.hits || []).length), (r.panel || '').replace(/\n/g, ' ').slice(0, 60));
  await rpc('doubao_desktop_press', { key: 'Escape' });

  const tmp = path.join(require('os').tmpdir(), 'doubao-mcp-smoke.txt');
  fs.writeFileSync(tmp, 'smoke test file for doubao desktop mcp\n');
  r = await rpc('doubao_desktop_upload_file', { paths: [tmp] });
  record('C22', '附件上传', 'doubao_desktop_upload_file', !!r.ok, r.error || 'attached');

  r = await rpc('doubao_desktop_screenshot');
  record('C23', '截图', 'doubao_desktop_screenshot', !!(r.ok && fs.existsSync(r.saved_path)), r.saved_path);

  r = await rpc('doubao_desktop_click', { testid: 'chat_input_action_model' });
  const okClick = !!r.ok;
  await rpc('doubao_desktop_press', { key: 'Escape' });
  record('C24', '通用点击层（真实鼠标事件）', 'doubao_desktop_click', okClick, 'model chip');

  r = await rpc('doubao_desktop_eval', { expression: 'document.title' });
  record('C25', 'JS 逃生舱', 'doubao_desktop_eval', !!r.ok, r.value);


  r = await rpc('doubao_desktop_click', { testid: 'workspace-switch-chip' });
  record('C26', '工作区切换（豆包 / 工作）', 'doubao_desktop_click', !!(r.ok && (r.surfaces || []).length), 'workspace chip');
  await rpc('doubao_desktop_press', { key: 'Escape' });

  r = await rpc('doubao_desktop_goto', { target: 'office' });
  record('C27', '新工作任务（Office 任务入口）', 'doubao_desktop_goto', !!(r.ok && r.page && r.page.text), (r.page && r.page.text || '').slice(0, 60));
  await rpc('doubao_desktop_goto', { target: 'chat' });

  r = await rpc('doubao_desktop_open_conversation', { title: '介绍自己' });
  r = await rpc('doubao_desktop_message_action', { action: 'image_canvas' });
  record('C28', '图片动作：在画布打开', 'doubao_desktop_message_action',
    (await conversationHasImages()) ? !!r.ok : 'skip', r.error || 'open_canvas');
  await rpc('doubao_desktop_goto', { target: 'chat' });

  const pass = results.filter((x) => x.ok === true).length;
  const skipped = results.filter((x) => x.skipped).length;
  const failed = results.length - pass - skipped;
  const summary = {
    generatedAt: new Date().toISOString(),
    platform: process.platform,
    total: results.length,
    passed: pass,
    skipped,
    failed,
    results,
  };
  fs.mkdirSync(path.dirname(jsonOut), { recursive: true });
  fs.writeFileSync(jsonOut, JSON.stringify(summary, null, 2));

  const rows = results
    .map((x) => `| ${x.id} | ${x.capability} | \`${x.tool}\` | ${x.skipped ? '➖' : (x.ok ? '✅' : '❌')} | ${x.detail ? String(x.detail).replace(/\|/g, '/').slice(0, 90) : ''} |`)
    .join('\n');
  const md = `# 全量冒烟测试报告\n\n生成时间：${summary.generatedAt}\n平台：${summary.platform}\n\n通过 **${pass}/${results.length}**${skipped ? `（跳过 ${skipped}，失败 ${failed}）` : ''}\n\n| # | 能力 | 工具 | 结果 | 证据 |\n|---|---|---|---|---|\n${rows}\n`;
  fs.writeFileSync(mdOut, md);
  console.log(`\n${pass}/${results.length} passed${skipped ? `, ${skipped} skipped` : ''}${failed ? `, ${failed} failed` : ''} → ${jsonOut}, ${mdOut}`);
  process.exit(failed === 0 ? 0 : 1);
})().catch((e) => { console.error('SMOKE ERROR', e.message); process.exit(2); });
