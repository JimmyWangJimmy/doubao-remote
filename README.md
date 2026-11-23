# doubao-desktop-mcp

把**本机安装的豆包桌面端**（`/Applications/Doubao.app`，macOS，v2.37.12）变成一套 MCP 工具，让任意支持 MCP 的 Agent 直接驱动它：发消息、取回复、拉生成图、切模型、调技能、开画布、看会话、截图、上传附件。

不是调云端 API，也不是模拟点击屏幕——**走它自带的 Chromium DevTools 协议**，直接操作真实 UI。

```
Agent ──MCP(HTTP)──> doubao-desktop-mcp ──CDP(ws)──> 豆包.app 渲染进程 ──> 服务端
                      127.0.0.1:18812          127.0.0.1:9333
```

## 为什么不是「豆包官方 MCP」

`Doubao.app/Contents/Helpers/libmcp_helper.dylib` 里确实打包了 `rmcp-3.2.0`，但那是它的 **MCP 客户端**（豆包去连别人的 MCP server），不是 server。桌面端也没有任何本地 HTTP 端口。所以这里换了一条路：它本身是 Chromium 壳（`NSPrincipalClass = BrowserCrApplication`，内核 `Chrome/147.0.7727.149`），只要启动时给一个开关，就能拿到完整的 DevTools 协议。

```bash
open -a Doubao --args --remote-debugging-port=9333
curl -s http://127.0.0.1:9333/json/version   # → Chrome/147.0.7727.149
```

## 快速开始

```bash
git clone https://github.com/JimmyWangJimmy/doubao-desktop-mcp.git
cd doubao-desktop-mcp

# 1) 让豆包带调试端口启动
open -a Doubao --args --remote-debugging-port=9333

# 2) 起 MCP 服务（Node >= 21，零依赖）
node src/server.js          # → http://127.0.0.1:18812/mcp

# 3) 冒烟测试（会真的往豆包发一条消息）
node scripts/smoke.js
```

接入 DSH（或任何 MCP 客户端）只需要一条条目：

```yaml
- id: doubao-desktop
  name: "@deepseek-ai/dsh-mcp-client"
  config:
    serverName: doubao-desktop
    transport: streamable-http
    url: http://127.0.0.1:18812/mcp
    failOnStartupError: false
```

常驻（macOS）：`launchd/com.jimmy.doubao-desktop-mcp.plist` 里的 `__REPO__` 换成仓库绝对路径，扔进 `~/Library/LaunchAgents/` 再 `launchctl bootstrap gui/$(id -u) <plist>`。

## 工具一览（23 个）

| 分类 | 工具 | 作用 |
|---|---|---|
| 状态 | `doubao_desktop_status` | 进程 / 调试端口 / 当前页 / 输入框 |
| | `doubao_desktop_ensure` | 没开调试口就重开 app |
| | `doubao_desktop_snapshot` | 页面 + 已打开的面板结构化快照 |
| | `doubao_desktop_screenshot` | 截图落盘 |
| | `doubao_desktop_eval` | 页面内执行 JS（逃生舱） |
| 输入层 | `doubao_desktop_click` | 真实鼠标点击（selector / testid / 文本） |
| | `doubao_desktop_type` | 向输入框写字 |
| | `doubao_desktop_press` | Enter / Escape / Tab / ⌘A |
| 对话 | `doubao_desktop_ask` | 发送并等到回复（含图片 URL） |
| | `doubao_desktop_replies` | 读最近 N 条回复 |
| | `doubao_desktop_new_chat` | 新对话 |
| | `doubao_desktop_conversations` | 侧栏会话列表 |
| | `doubao_desktop_open_conversation` | 按标题打开会话 |
| | `doubao_desktop_message_action` | 复制 / 分享 / 重新生成 / 点赞 / 朗读 / 图片下载·引用·进画布 |
| 媒体 | `doubao_desktop_images` | 抓取并下载回复里的图片 |
| 控制 | `doubao_desktop_models` / `doubao_desktop_set_model` | 枚举 / 切换模型 |
| | `doubao_desktop_skills` / `doubao_desktop_toggle_skill` | 技能面板（快捷功能 + 30 个技能 + 本机技能） |
| | `doubao_desktop_plugins` | 插件 / 伙伴 |
| | `doubao_desktop_upload_file` | 上传附件（可顺带回一句话） |
| 导航 | `doubao_desktop_goto` | 工作台 / 定时任务 / 技能页 / 资料库 / 新工作任务 / 搜索 / 设置 / 对话 |
| | `doubao_desktop_search` | 全局搜索 |

## 实测覆盖

`node scripts/smoke.js` 对 28 项能力逐条打通，当前 **28/28 通过**，报告生成在 [`docs/SMOKE.md`](docs/SMOKE.md)（原始数据 `docs/smoke.json`）：

| # | 能力 | 结果 |
|---|---|---|
| C01–C03 | 应用状态、调试端口、页面快照 | ✅ |
| C04–C06 | 模型菜单（13 个模型）、技能面板（快捷功能 6 + 技能 30 + 本机 67）、插件面板 | ✅ |
| C07 | 会话列表（30+ 条） | ✅ |
| C08 | 历史生成图抓取（2 张，含原图与缩略图） | ✅ |
| C09–C10 | 复制、朗读（TTS） | ✅ |
| C11–C12 | 切模型、选技能 | ✅ |
| C13–C16 | 新对话、输入、发送并取回复、读回复 | ✅ |
| C17–C20 | 工作台 / 定时任务 / 资料库 / 技能页导航 | ✅ |
| C21–C25 | 全局搜索、附件上传、截图、通用点击层、JS 逃生舱 | ✅ |
| C26–C28 | 工作区切换、新工作任务、图片「在画布打开」 | ✅ |

能力清单与证据见 [`docs/CAPABILITIES.md`](docs/CAPABILITIES.md)，踩过的坑见 [`docs/PITFALLS.md`](docs/PITFALLS.md)——**那篇比代码更值钱**。

## 它不能做什么

- **不能脱离 UI**：豆包改版、换选择器就会断；有 `doubao_desktop_eval` 可以先探再改。
- **不能免登录**：跑的是你自己的豆包账号，消耗的是你自己的额度（出图一次约 12.70 点，界面写得清清楚楚）。
- **不能拿到无水印原图**：`message_image_content` 的图自带「豆包AI生成」水印。
- **不能在没有调试端口的实例上工作**：`ensure` 会重启 app，未保存的输入会丢。
- 只支持 macOS（`osascript` 退出 / `open -a` 启动 / `pgrep` 探测）。

## 结构

```
src/server.js      MCP 传输层（Streamable HTTP，JSON 回复，23 工具）
src/cdp.js         CDP 客户端：输入事件、截图、文件注入、目标选择
src/tools.js       全部工具实现（含面板文本 diff 读取）
src/selectors.js   实测过的选择器表
scripts/smoke.js   28 项全量冒烟
scripts/cdp-*.js   调试小工具：eval / click / probe
skills/            Agent 用 Skill（SKILL.md）
docs/              能力矩阵、坑位、测试报告
```

## 许可

MIT。仅供本机自动化与自用；豆包的服务条款、账号与内容归属仍归字节跳动与你自己。
