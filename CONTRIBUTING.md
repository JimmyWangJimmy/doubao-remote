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

## 语言约定（README 双语）

决定：**中文为主，英文并置**（对齐 taro 的做法；ant-design 是英文主，两者都成立，本项目选中文主）。

| 文件 | 语言 | 说明 |
|---|---|---|
| `README.md` | 中文 | GitHub 默认展示的就是它，也是中文读者的入口 |
| `README.en.md` | 英文 | 顶部语言条互链；结构与中文版一一对应 |

改 README 时：**两边同步**。只改中文版会让英文读者看到过期信息，反之亦然。
语言条写法固定为「当前语言纯文本 + 另一种语言带链接」，不要两边都写成链接。

## 提 PR

- `npm run smoke` 保持全绿；若因版本差异预期失败，请在描述里写清版本号与失败项
- 附 `docs/smoke.json` 改动前后对比
- 新工具请同步：`src/tools.js` + README 工具表 + `skills/doubao-desktop/SKILL.md` 的用法段
- README 改动：中文/英文两份都要动（见「语言约定」）
