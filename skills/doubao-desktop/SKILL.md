---
name: doubao-desktop
description: 驱动本机安装的豆包桌面端（macOS /Applications/Doubao.app，Windows Doubao.exe）：发消息取回复、抓生成图、切模型、调技能、开会话、截图、上传附件。当用户说「让豆包去做 X」「用豆包出图」「问豆包一句话」「看豆包当前界面」「在豆包里开个新对话」时使用。自带安装器与自动路由：简单任务直接跑 doubao 命令，复杂任务自己拉起 MCP，用户不需要知道底层。反触发：云端 Ark / Seedream 走 arkcli；MiniMax Design 出图走 minimax-design MCP。
metadata:
  requires:
    bins: ["node", "curl"]
    node: ">=21"
  os: ["darwin", "win32"]
---

# 豆包遥控器 · doubao-desktop

你有一个命令：`doubao`。它能操作**本机**的豆包桌面端（macOS 与 Windows 均已支持）。
对外只有一句话：**「我让豆包去做」**。CDP、端口、MCP 这些词不出现在用户面前。

## 0. 自检（每个会话最多一次）

```bash
doubao status        # 期望 "ok": true
```

装不上时按平台补装（装完即用，不开服务）：

```bash
# macOS
command -v doubao >/dev/null || bash <(curl -fsSL https://raw.githubusercontent.com/JimmyWangJimmy/doubao-remote/main/install.sh)
# Windows（PowerShell）
#   powershell -ExecutionPolicy Bypass -File install.ps1        # 加了 -Skill / -Service / -All 见 README
```

`ok: false` 且 `devtools.error` 有值 → 先 `doubao ensure`（会重启豆包；用户正在输入时先问一句）。
Windows 还有一条：豆包被手动关掉再开时调试端口会丢，下次用前先 `doubao ensure`。

## 1. 任务路由（先判类型，再选通道）

| 任务长什么样 | 走哪条 | 怎么做 |
|---|---|---|
| **单步**：问一句、画一张、截个图、看会话、换模型、开新对话 | **CLI**（默认，零准备） | `doubao ask "…"` / `doubao images` / `doubao screenshot` |
| **多步但线性**：画完取图、再让它改、连续追问 | **CLI 串行** | 每步 `doubao …`，中间产物记下路径（`saved`、`reply`） |
| **复杂**：批量出图、多参考图、要稳定结构化参数、结果要给别的程序或别的会话用、一次会话里反复调很多次 | **升到 MCP** | `doubao service start` → 工具清单里若有 `doubao_desktop_*` 就用它们；没有就继续用 CLI（能力等价） |
| **宿主没有 shell**（纯 MCP 客户端） | **只能 MCP** | `doubao service start`，把 `http://127.0.0.1:18812/mcp` 交给宿主 |
| **同一件事失败 2 次** | **升到 MCP + 探结构** | `doubao service start`，再 `doubao call doubao_desktop_snapshot '{}'` 看现场 |

判断口诀：**能一条命令说完的，别开服务；要多步、要复用、要稳定参数的，先 `doubao service start`。**

`doubao service start` 是幂等的：已经开着就直接返回 endpoint，不用先查状态。

## 2. 对用户怎么说话

- ❌ 不说：MCP 没启动、端口占用、CDP 断了、需要你配置一下
- ✅ 要说：已经在豆包里问它了 / 图画好了，存在 `~/Pictures/doubao-desktop/`（Windows：`%USERPROFILE%\Pictures\doubao-desktop\`）/ 豆包那边还在画，等我一下
- 只有真的需要用户动手时，才用一句人话说清楚：要登录、要升级订阅（高级模型）、额度不够
- 服务开没开、走的哪条通道，都是你的内部决定，不解释

## 3. 命令速查

```bash
doubao status                     # 连接状态
doubao ask "用一句话介绍你自己"      # 发送并等回复（默认 120s，可加超时毫秒）
doubao replies 3                  # 读最近 3 条回复
doubao images 1                   # 下载最近 1 条回复里的图 → ~/Pictures/doubao-desktop
doubao screenshot                 # 截图，返回路径
doubao conversations 20           # 侧栏会话
doubao open "介绍自己"              # 按标题打开会话
doubao models | doubao set-model "豆包 2.1 Pro"
doubao skills                     # 技能面板（快捷功能 + 内置技能 + 本机技能）
doubao goto workbench|cron|skills|library|office|search|chat
doubao service start|stop|status  # 只有复杂任务或无 shell 宿主才需要
doubao call <tool> '<json>'       # 任意工具直调（等价 MCP 工具）
doubao list                       # 全部 23 个工具
```

出图闭环：

```bash
doubao ask "帮我画一张竖版少女立绘，紫罗兰短发，3:4" 180000
doubao images 1        # → ~/Pictures/doubao-desktop/img-*.png
```

## 4. 硬规则

1. **串行**：单个 webview 只有一个焦点，不要并发调用。
2. **先 status 再动手**：`ok: false` 时任何 ask 都会失败。
3. **draft 页没有模型/技能/插件 chip**：新对话页只有「项目 / 更多」，要切模型先 `doubao open <已有会话>` 或先发一条消息。
4. **不要重发**：`timed_out: true` 是慢不是失败，用 `doubao replies 1` 续读；重发会变成两条提问。
5. **花的是用户的额度**：出一张图约 12.70 点，界面会明写；别为了测试让豆包画图。
6. **`doubao ensure` 会重启豆包**：会丢用户未发送的输入。

## 5. 故障速查（自己看，不甩给用户）

| 现象 | 处理 |
|---|---|
| `command not found: doubao` | 跑第 0 步（Windows 检查 `%USERPROFILE%\.local\bin` 是否在 PATH） |
| `ok: false` + devtools 报错 | `doubao ensure`；仍不行就手动起：macOS `open -a Doubao --args --remote-debugging-port=9333`，Windows `Start-Process Doubao.exe -ArgumentList "--remote-debugging-port=9333"` |
| `element not found: chat_input_action_model` | 在 draft 页，先 `doubao open <会话>` |
| `control not available: read_aloud` | 朗读按钮 hover 才挂载，重开会话再试 |
| `timed_out: true` | 别重发，`doubao replies 1` 续读 |
| 面板读到空 | 面板原本就开着，点击把它关了；先 `doubao screenshot` 看一眼 |
| 服务起不来 | `doubao service status` 看端口；冲突就换 `DOUBAO_DESKTOP_PORT` |
| Windows 上 `plugins` 返回 `via: skills-page` | 正常：Windows 版工具栏没有插件按钮，插件/伙伴在「插件 · 技能 · 伙伴」页 |
| Windows 上模型菜单只有「快速 / 专家」 | draft 页的正常表现，打开一个已有会话再读即可看到完整模型列表 |

完整能力清单与 14 条踩坑见仓库 `docs/`。
