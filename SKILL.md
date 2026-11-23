---
name: doubao-desktop
description: 驱动本机安装的豆包桌面端（/Applications/Doubao.app）：发消息取回复、抓生成图、切模型、调技能、开会话、截图、上传附件。当用户说「让豆包去做 X」「用豆包出图」「问豆包一句话」「看豆包当前界面」「在豆包里开个新对话」时使用。自带安装器：本机没有 doubao 命令时先跑一次 bootstrap.sh 即可，无需手动装 MCP。反触发：云端 Ark / Seedream 走 arkcli；MiniMax Design 出图走 minimax-design MCP。
metadata:
  requires:
    bins: ["node", "curl"]
    node: ">=21"
  os: ["darwin"]
---

# doubao-desktop

用命令行或 MCP 驱动**本机**的豆包桌面端（macOS，`/Applications/Doubao.app`）。
两条通道能力完全一致，选一条即可：

| 通道 | 前提 | 调用形态 |
|---|---|---|
| **CLI**（默认，零配置） | `doubao` 命令在 PATH | `doubao ask "…"` |
| **MCP**（可选，给客户端用） | 已注册 `doubao-desktop`（`http://127.0.0.1:18812/mcp`） | `doubao_desktop_ask({text})` |

## 0. 自检与安装（只做一次）

```bash
command -v doubao || bash <(curl -fsSL https://raw.githubusercontent.com/JimmyWangJimmy/doubao-desktop-mcp/main/install.sh)
doubao status          # 期望 "ok": true
```

若本 skill 目录里有 `bootstrap.sh`，也可以直接 `bash bootstrap.sh`（等价）。
**不要**让用户手动 clone / 起服务 / 改配置——安装器会处理：装 CLI、带调试端口拉起豆包、自检。

`status` 返回 `ok: false` 且提示 devtools 不可用：

```bash
open -a Doubao --args --remote-debugging-port=9333   # 或 doubao ensure（会重启豆包）
```

## 1. 常用命令

```bash
doubao status                     # 进程 / 调试端口 / 当前页
doubao ask "用一句话介绍你自己"      # 发送并等回复（默认 120s）
doubao replies 3                  # 读最近 3 条回复
doubao images 1                   # 下载最近 1 条回复里的图 → ~/Pictures/doubao-desktop
doubao screenshot                 # 截图，返回路径
doubao conversations 30           # 侧栏会话列表
doubao open "介绍自己"              # 按标题打开会话
doubao models                     # 模型菜单
doubao set-model "豆包 2.1 Pro"     # 切换模型
doubao skills                     # 技能面板（快捷功能 + 内置技能 + 本机技能）
doubao goto workbench             # 工作台|cron|skills|library|office|search|chat
doubao call doubao_desktop_message_action '{"action":"read_aloud"}'
doubao list                       # 全部 23 个工具
```

一切输出都是 JSON，直接解析字段即可（`ok` / `reply` / `images` / `saved` / `error`）。

出图闭环：

```bash
doubao ask "帮我画一张竖版少女立绘，紫罗兰短发，3:4" 180000
doubao images 1          # → ~/Pictures/doubao-desktop/img-*.png
```

## 2. 用 MCP 时

工具名与 CLI 子命令一一对应（`doubao_desktop_*`）。客户端里注册：

```json
{ "mcpServers": { "doubao-desktop": { "type": "http", "url": "http://127.0.0.1:18812/mcp" } } }
```

DSH 用 `@deepseek-ai/dsh-mcp-client` + `transport: streamable-http`。

## 3. 硬规则

1. **串行**：单个 webview 只有一个焦点，别并发调用。
2. **先 status 再动手**：`ok: false` 时任何 `ask` 都会失败。
3. **draft 页没有模型/技能/插件 chip**：新对话页只有「项目 / 更多」，要切模型得先 `doubao open <已有会话>` 或先发一条消息。
4. **不要重发**：`timed_out: true` 说明慢，不是失败；用 `doubao replies 1` 续读，重发会变两条提问。
5. **花的是用户额度**：出一张图约 12.70 点，界面会明写；别为了测试让豆包画图。
6. **`doubao ensure` 会重启豆包**：用户正在输入时先问一句。

## 4. 故障速查

| 现象 | 处理 |
|---|---|
| `command not found: doubao` | 跑第 0 步安装 |
| `ok: false` + `devtools` 报错 | `open -a Doubao --args --remote-debugging-port=9333`，或 `doubao ensure` |
| `element not found: chat_input_action_model` | 在 draft 页，先 `doubao open <会话>` |
| `control not available: read_aloud` | 朗读按钮 hover 才挂载，重开会话再试 |
| `timed_out: true` | 别重发，`doubao replies 1` 续读 |
| 面板读到空 | 面板原本就开着，点击把它关了；先 `doubao screenshot` 看一眼 |

完整踩坑（14 条）与能力清单在仓库 `docs/`。
