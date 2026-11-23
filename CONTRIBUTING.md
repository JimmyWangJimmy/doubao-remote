# Contributing

## 开发

```bash
open -a Doubao --args --remote-debugging-port=9333
node src/server.js            # 工具服务
node scripts/smoke.js         # 28 项冒烟
```

调试单个动作时用三件套更快：

```bash
node scripts/cdp-eval.js 'document.title'
node scripts/cdp-click.js '[data-testid=chat_input_action_model]'
node scripts/cdp-probe.js '[data-testid=general-agent-skill-button]'
```

## 改选择器

豆包改版后先跑冒烟定位断点，再改 `src/selectors.js`（唯一真源），不要在 `tools.js` 里散落选择器。

## 提 PR

- `npm run smoke` 保持全绿；若因版本差异预期失败，请在描述里写清版本号与失败项
- 附 `docs/smoke.json` 改动前后对比
- 新工具请同步：`src/tools.js` + README 工具表 + `skills/doubao-desktop/SKILL.md` 的用法段
