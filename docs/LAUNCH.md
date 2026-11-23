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

### 4.2 种草体（即刻 / 小红书 / 群，首选）

> 语气：**你是发现者，不是作者**。"挖到个宝藏" 比 "我做了个工具" 点击率高得多。
> 结构：宝藏开头 → 一个具体动作 → 免费/零成本 → 出口

**A（推荐）**
```
💎挖到个宝藏项目：一键解锁豆包的全部能力

说一句「画只赛博朋克猫」，它自己开豆包、发消息、等画完，图直接落到本地文件夹。
不用 API key、不额外花钱 —— 用的就是你豆包里的额度。

Mac 一条命令：github.com/JimmyWangJimmy/doubao-remote
```

**B（更短）**
```
一键解锁豆包全部能力：免费生图，不用 API key，图直接存本地。
一条命令，Mac 能用 → github.com/JimmyWangJimmy/doubao-remote
```

**C（小红书体）**
```
💎宝藏开源｜把豆包变成"随叫随到"的画图工
不用 API、不用花钱，说一句它就自己画完存好
Mac 可用｜一条命令装完
```

**D（技术群，保留原理）**
```
挖到个宝藏：豆包没开放 API，但它是 Chromium 壳 —— 开个调试端口，Claude Code 就能直接指挥它画图。
免费（用你自己的豆包额度），Mac 一条命令：github.com/JimmyWangJimmy/doubao-remote
```


> **即刻实操记录（2026-11-23）**：首帖用了长版（四段），已删除。
> 删除后立刻重发会触发站方风控，页面出现大量 `操作过于频繁` —— **删帖与重发之间至少间隔 30 分钟**，
> 或干脆不删、等下一篇用短版。

**E（能力展示型 · 配图，覆盖面最广）**
```
💎以为它只能出图，结果能干的比我想象的多

对话、13 个模型随便切、内置 30 个技能、工作台/定时任务/资料库都能进，
上传附件、朗读、截图也都有 —— 23 个工具，28 项冒烟全绿。

不用 API key，一条命令装完：
github.com/JimmyWangJimmy/doubao-remote
```
配图直接用 `docs/assets/capabilities.png`（1080×1350，小红书/即刻通用）。

⚠️ **措辞红线**：可以写"免费生图"（走用户自己的豆包额度、无需额外付费），
**不要写"免费视频"**——豆包的视频生成本身要消耗额度，而且本项目目前只自动抓图，
视频需要手动保存（抓取在 roadmap 上）。

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


## 4.6 「让豆包自己写宣传」的闭环（实测好用）

这条路径比人想文案更快，而且自带平台语感：

```bash
# 1) 让豆包写文案 + 生图提示词
doubao ask "我要在即刻和小红书宣传一个开源项目……（贴项目背景），
           给我 3 条 ≤40 字的宣传文案，再给我一段 200 字内的 AI 生图提示词" 

# 2) 直接把它给的提示词丢回去生图
doubao ask "<上一步输出的提示词>" 300000

# 3) 取图
doubao images 1     # → ~/Pictures/doubao-desktop/
```

实测产物：`docs/assets/promo-banner.jpg`（1800×1011，含「一句话让豆包自己干活」主视觉）。
注意：图右下角会带「豆包 AI 生成」水印，属正常。

豆包给的 3 条文案（供参考，偏功能罗列，比手写版长）：

1. 本机豆包桌面端变成 AI 可调用工具：一句话让它自动打开、输入、发送、画图并保存图片。
2. 免费无需 API key，Mac 可用，支持切模型、调技能、管理会话，内置 23 个工具。
3. 说一声就能自动完成桌面操作，28 项测试全绿，让豆包从聊天工具变成执行工具。

> 判断：模型写的文案通顺但"像说明书"。**结构可以借，第一句最好自己写**——
> 用「我以为只能 X，结果还能 Y」这种反差，比罗列能力更容易让人停下来。

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
