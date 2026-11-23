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

## 4. 可直接复制的文案

### X / Twitter（英文）

```
Doubao (豆包) desktop has no API. So I gave it one — over Chromium DevTools.

Now Claude Code / Cursor / any MCP client can make it write, draw, and switch models:

  doubao ask "画一张赛博朋克猫" 180000
  doubao images 1

Skill-first install, zero config. macOS. 23 tools, 28/28 smoke tests.
https://github.com/JimmyWangJimmy/doubao-remote
```

### Hacker News（Show HN）

```
Show HN: Doubao Remote – drive the Doubao desktop app over DevTools

Doubao is ByteDance's assistant app (China-only, desktop). It ships no local API,
but it's a Chromium shell, so `--remote-debugging-port` gives you the full CDP surface.

I wrapped that into 23 tools exposed two ways: a `doubao` CLI (no server, no config)
and an MCP server for clients that can only speak MCP. Chat, image generation, model
switching, skills, navigation — all through the real UI, no cloud keys involved.

Trickier bits: JS .click() doesn't work on its menus (needs Input.dispatchMouseEvent),
overlays must be read by text-diffing body.innerText, and "reply finished" needs
filtering of intermediate states. Notes in docs/PITFALLS.md.

macOS only for now; Windows port needs three OS-specific calls swapped.
```

### V2EX（中文）

```
标题：[分享创造] 把豆包桌面端变成了 Agent 能调的工具（MCP + CLI）

正文：
豆包桌面端没有开放接口，但它是个 Chromium 壳。
用 --remote-debugging-port 起起来，就能拿到完整的 DevTools 协议。
我把这套东西包成了 23 个工具，两种用法：
- doubao 命令：一条命令装完，不需要开服务、不需要改配置
- MCP：给没有 shell 的客户端用

能干什么：发消息取回复、让它画图并把图抓到本地、切模型、用技能、看会话、截图。

踩到的坑都写进 docs/PITFALLS.md 了（JS click 无效、面板读取、hover-only 控件……）。
macOS 可用，Windows 在做。

https://github.com/JimmyWangJimmy/doubao-remote
```

### 即刻（中文，短）

```
把豆包桌面端变成了"能被 AI 指挥"的工具。

说一句「让豆包画一张紫罗兰短发少女」，它自己打开豆包、输入、发送、等画完，
再把图存到我文件夹里。全程不用我点。

原理不复杂：豆包是 Chromium 壳，开个调试端口就能被驱动。
装起来就一条命令，Mac 可用。

https://github.com/JimmyWangJimmy/doubao-remote
```

### 小红书 / 知乎 标题备选

- 「我让 AI 自己去用豆包画图，全程没碰鼠标」
- 「豆包没有 API，于是我给它装了一个」
- 「把豆包桌面端接进 Claude Code 是什么体验」

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
