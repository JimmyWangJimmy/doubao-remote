# 发布与推广手册（LAUNCH）

> 目标不是"涨星"，是让**需要它的人在三周内看到它**。Star 是结果，不是动作。

## 0. 现状诊断：为什么是 0 star

| 原因 | 具体表现 |
|---|---|
| **零分发** | 仓库只存在于你自己的 GitHub 账号下，没有任何渠道把它推给过谁 |
| **零索引** | 不在任何 MCP 目录（Smithery / mcp.so / PulseMCP / Official Registry）、不在 awesome-mcp-servers、不在任何 awesome 列表 |
| **零外部链接** | 没有博客、推文、帖子指向它，GitHub 的推荐与搜索都没有信号 |
| **受众错配** | 豆包桌面端是中国产品，但 GitHub 的自然流量主要来自英文用户；光有中文 README 会丢掉国际长尾 |
| **时间太短** | 仓库建立不到一天，任何统计都还没意义 |

结论：**这不是内容问题，是渠道问题。** README 已经到位，接下来是分发。

## 1. 头部项目实际怎么做的

| 项目 | 关键动作 | 可复用的点 |
|---|---|---|
| **microsoft/playwright-mcp**（~36k★） | 微软品牌背书 + 官方文档站交叉链接 + 第一时间进所有 MCP 目录 + 英文 README 带 demo | 进目录是标配动作，不是加分项 |
| **browser-use**（60k+★） | Demo GIF 放首屏 + benchmark 数据 + 播客/HN/Product Hunt 多平台同周发布 + 社区 Discord | "能看到的动作"比文字有说服力 |
| **MCP 生态整体** | `npx mcp-submit` 一键提交到 Official Registry / Smithery / mcp.so / awesome-mcp-servers 两个仓库 | 提交本身是自动化的，成本极低 |

共性：**先让能被检索到（目录 + topics + 英文），再让能被相信（demo + 测试 + 真实截图），最后才是推广（社区发帖）。**

## 1.5 当前状态（2026-11-23 已执行）

| 渠道 | 状态 | 链接 / 原因 |
|---|---|---|
| mcp.so | ✅ 已提交 | https://github.com/chatmcp/mcpso/issues/7895 |
| awesome-mcp-servers (punkpeye) | ✅ PR 已开 | https://github.com/punkpeye/awesome-mcp-servers/pull/20482 |
| awesome-mcp-servers (appcypher) | ⛔ 仓库已归档 | `archived: true`，不再接受 PR |
| Official MCP Registry | ⏸ 暂缓 | 注册表要求可安装包（npm/PyPI/OCI）或公网 remote；本项目是**本地**服务（127.0.0.1），提交会误导 |
| Smithery | ⏸ 暂缓 | 需要公网 HTTP 端点 |
| MCPCentral / PulseMCP / mcpservers.org | ⏳ 需人工 | 网页表单，需要账号登录 |
| Glama.ai | 🔄 自动索引 | 已在 README 加徽章做反链 |
| **首屏 demo GIF** | ✅ 已上线 | 真实录制：`doubao ask` → 豆包画猫 → 图落盘（`docs/assets/demo.gif`） |
| **v2.0.0 Release** | ✅ 已发布 | https://github.com/JimmyWangJimmy/doubao-remote/releases/tag/v2.0.0 |
| **3 个入门 issue** | ✅ 已开 | Windows 支持 / 英文 quickstart / 定时任务 CRUD |

> 结论：**能自动化的都做完了**。剩下的要么需要公网端点（本项目性质不匹配），要么需要你本人登录填表。

## 2. 平台矩阵

### 国际（GitHub 自然流量 + MCP 生态）

| 平台 | 手段 | 成本 | 预期 |
|---|---|---|---|
| **Official MCP Registry** | `server.json` + 注册提交 | 低 | 被 Claude / 各客户端市场同步 |
| **Smithery / mcp.so / MCPCentral / PulseMCP / mcpservers.org / Glama** | 各自表单或 PR | 低 | 稳定长尾流量 |
| **awesome-mcp-servers**（punkpeye / appcypher 两个仓库） | PR 加一行 | 低 | 直接对接"MCP 找工具"的人群 |
| **Hacker News（Show HN）** | 英文标题 + 一段 why + demo | 中 | 一次爆发，可能上千 star，也可能沉底 |
| **Reddit** r/LocalLLaMA、r/mcp、r/opensource | 同 HN 文案，讲"我解决了什么" | 低 | 稳定小流量 |
| **X / Twitter** | 15 秒 GIF + 三句话 + 链接，@ 相关账号 | 低 | 开发者圈层扩散 |
| **Product Hunt** | 需要素材（logo/截图/短描述） | 中 | 面向非技术受众，与本地工具略错位 |

### 国内（这个项目的主战场）

| 平台 | 手段 | 备注 |
|---|---|---|
| **即刻** | "我做了个东西"体，配 GIF，讲场景不讲技术 | AI 圈传播最快 |
| **V2EX**（分享创造节点） | 标题写清"豆包桌面端 MCP"，正文讲痛点+坑 | 技术人群精准，反感硬广 |
| **小红书** | "让 AI 自己用豆包画图"这种结果导向标题，图多 | 泛用户量大，转化到 GitHub 的比例低但基数大 |
| **知乎** | 回答"如何评价豆包桌面端""有哪些好用的 MCP"类问题，附仓库 | 长尾搜索 |
| **掘金 / 少数派** | 一篇"我是怎么把豆包变成 Agent 工具的"技术叙事 | 少数派适合工具类，掘金适合实现细节 |
| **B 站 / 视频号** | 60 秒录屏：说一句话 → 豆包自己画图 → 图出现在文件夹 | 转化最高，制作成本也最高 |
| **微信群 / 知识星球** | AI 编程、MCP 相关群 | 一次几十人，但都是精准用户 |

## 3. 这个项目的具体打法

**先国内，后国际。** 理由：豆包桌面端只有中文环境用户才会装，国际用户的 GitHub star 更多是"技术猎奇"，但他们的 star 对榜单权重同样有效——所以英文描述、英文 demo GIF、目录收录要做，但不用花力气翻译整篇 README。

### D0（今天，30 分钟，全自动）

- [ ] 提交 Official MCP Registry（需要 `server.json`）
- [ ] 提交 Smithery / mcp.so / MCPCentral
- [ ] 给两个 awesome-mcp-servers 提 PR
- [ ] 补 `server.json` 与英文 description（已有中英双语描述）

### D1（本周，需要你出镜或授权）

- [ ] 录 20 秒 GIF：`doubao ask "画一只猫"` → 图出现在 `~/Pictures/doubao-desktop/`，放到 README 首屏
- [ ] 即刻 + V2EX 各发一帖（文案见下）
- [ ] X 发一条英文帖

### D7–D30（持续）

- [ ] 小红书 / 知乎各一篇，主打"结果"而不是"实现"
- [ ] 每次发版在 CHANGELOG + 一条推文
- [ ] 把 issue 当客服：前 10 个 issue 全部当天回，这是早期最重要的"口碑资产"

## 4. 文案：从用户痛点出发

### 4.1 谁在看，他疼在哪

| 人群 | 他现在的真实动作 | 痛点 | 钩子该打哪 |
|---|---|---|---|
| **豆包重度用户（非程序员）** | 复制提示词 → 粘贴 → 等 → 右键另存 → 改文件名 → 丢进文件夹 | 一次一张，全是手工；十张图就是半小时 | 「不用再手动存图」 |
| **AI 编程用户（Claude Code / Cursor）** | 想用豆包的画图能力，但发现没有 API，只能切窗口手动做 | 工作流断在最后一步 | 「让 Claude Code 能直接画图」 |
| **批量/自动化需求** | 20 个 SKU 各出一张图、每天一张封面 → 手动不可能 | 重复劳动，无法定时 | 「一行命令，批量、定时都行」 |
| **技术猎奇者** | 想知道"没有 API 的桌面 App 怎么被驱动" | 好奇实现 | 「它是 Chromium 壳」 |

### 4.2 五条钩子（每条只打一个痛点）

**① 非程序员 · 省手工**（推荐发即刻 / 小红书）
```
豆包画完图，我得右键另存、再改文件名、再拖进文件夹，一张图 30 秒。
现在一句话出十张，图自己落到文件夹里。
github.com/JimmyWangJimmy/doubao-remote
```

**② AI 编程 · 补上工作流最后一步**（推荐发 X / 技术群）
```
Claude Code 写代码很强，但画不了图；豆包画得好，却死活不给 API。
现在它俩能连上了，一句话让豆包画完直接落盘。
github.com/JimmyWangJimmy/doubao-remote
```

**③ 批量 · 时间对比**（最能打动人，适合即刻）
```
40 个商品图，手动让豆包一张张画，我昨天花了两小时。
今天写了个脚本，一行命令跑完，8 分钟。
github.com/JimmyWangJimmy/doubao-remote
```

**④ 反常识 · 技术猎奇**（适合 V2EX / HN）
```
豆包没开放 API，但它是 Chromium 壳 —— 开个调试端口，就能像调接口一样调它。
不用截图、不用 OCR、不用点坐标，直接操作真实 UI。
github.com/JimmyWangJimmy/doubao-remote
```

**⑤ 最短 · 一句话 + 链接**（评论区 / 转发用）
```
豆包不给 API，我就从它的界面里抢了一个。github.com/JimmyWangJimmy/doubao-remote
```

### 4.3 英文（X）

```
Claude Code can write code but can't draw. Doubao draws well but ships no API.
Now they talk: one command and the image lands in your folder.
github.com/JimmyWangJimmy/doubao-remote
```

### 4.4 Hacker News（Show HN）

标题：`Show HN: Doubao Remote – driving a desktop app that has no API`

```
Doubao is ByteDance's assistant app. No local API, but it's a Chromium shell, so
--remote-debugging-port exposes the full CDP surface. I wrapped it into a CLI and an
MCP server: chat, image generation (and pulling the files out), model switching,
skills, navigation.

The annoying parts were not the protocol but the UI: JS .click() is ignored on its
menus (needs Input.dispatchMouseEvent), overlays have to be read by diffing
body.innerText, and "reply finished" requires filtering intermediate states.
Notes: docs/PITFALLS.md. macOS only for now.
```

### 4.5 写文案的三条硬规则

1. **第一行必须是"我（用户）的麻烦"，不是"我的项目"**
2. **给数字**：30 秒 / 两张 / 8 分钟 / 一行命令 —— 数字比形容词可信
3. **链接放最后一行**，前面不要出现仓库名，否则读者在读懂价值前就划走

## 5. 提交清单（目录站）

| 目录 | 入口 | 需要什么 |
|---|---|---|
| Official MCP Registry | registry.modelcontextprotocol.io | `server.json` |
| Smithery | smithery.ai | CLI 或表单 |
| mcp.so | GitHub issue | 一行描述 + 链接 |
| MCPCentral | API / 表单 | 同上 |
| PulseMCP | pulsemcp.com/submit | 浏览器表单 |
| mcpservers.org | mcpservers.org/submit | 浏览器表单 |
| Glama.ai | 自动索引 | 无需提交 |
| awesome-mcp-servers (punkpeye) | PR | 一行，见下 |
| awesome-mcp-servers (appcypher) | PR | 一行 |

awesome 列表加行模板：

```markdown
- [doubao-remote](https://github.com/JimmyWangJimmy/doubao-remote) — Drive the local Doubao (豆包) desktop app: chat, image generation, model switching over Chromium DevTools. macOS.
```

## 6. 衡量

| 指标 | 目标（首月） | 怎么读 |
|---|---|---|
| star | 50–200 | 主要来自 V2EX / 即刻 / awesome 列表 |
| 目录收录 | ≥5 | 决定长期长尾流量 |
| issue / 私信 | ≥3 | 说明真的有人跑起来了，比 star 更可信 |
| clone（Insights → Traffic） | ≥300 | 真实试用意图 |

**不要**把 star 当第一指标。早期唯一重要的是：**有没有陌生人成功跑起来并回来提 issue。**
