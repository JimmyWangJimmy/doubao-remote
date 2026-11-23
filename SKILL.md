---
name: doubao-desktop
description: 用 MCP 驱动本机豆包桌面端（/Applications/Doubao.app）：发消息取回复、抓生成图、切模型、调技能、开会话、截图、上传附件。当用户要求「让豆包去做 X」「用豆包出图」「问豆包一句话」「看豆包当前界面」「在豆包里开个新对话」时使用。反触发：云端 Ark / Seedream API 出图走 arkcli；MiniMax Design 出图走 minimax-design 的 MCP。
---

# doubao-desktop

驱动**本机**的豆包桌面端，走它自带的 Chromium DevTools 协议（`127.0.0.1:9333`），MCP 端点在 `http://127.0.0.1:18812/mcp`。

## 开工顺序

1. `doubao_desktop_status` —— 看 app 是否在跑、调试端口是否可用、当前页面是什么。
2. 如果 `devtools.error` 不为空 → `doubao_desktop_ensure`（会**重启豆包**，未发送的输入会丢，先确认用户没在打字）。
3. `doubao_desktop_snapshot` —— 拿页面 + 已打开面板的快照，决定下一步。

## 常见任务的正确姿势

### 让豆包回答 / 生成内容

```
doubao_desktop_ask({ text: "...", timeout_ms: 120000 })
```

- 返回 `reply`（文本）和 `images`（图片 URL）。
- `timed_out: true` 说明到点还没稳定下来，**不要重发**（会变成两条提问）；改用 `doubao_desktop_replies({limit:1})` 再读。
- 出图通常 30–60 秒，`timeout_ms` 给 120000 起。

### 把生成图取到本地

```
doubao_desktop_images({ limit: 1 })   // 下载到 ~/Pictures/doubao-desktop/
```

图在回复的 `message_image_content` 里，**带「豆包AI生成」水印**。要更高清的同时会有缩略图 URL，两个都会下载。

### 换模型 / 用技能

```
doubao_desktop_models()                       // 先枚举真实可用的
doubao_desktop_set_model({ name: "豆包 2.1 Pro" })
doubao_desktop_skills()                       // 快捷功能 6 + 内置技能 30 + 本机技能
doubao_desktop_toggle_skill({ name: "地图" })
```

⚠️ 模型 / 技能 / 插件这些 chip **只在已有消息的会话里存在**。draft 页会报 `element not found` —— 先 `doubao_desktop_open_conversation` 或 `doubao_desktop_new_chat` 后发一条消息，再操作。

### 换会话 / 找历史

```
doubao_desktop_conversations({ limit: 30 })
doubao_desktop_open_conversation({ title: "介绍自己" })   // 子串匹配
```

### 附件

```
doubao_desktop_upload_file({ paths: ["/abs/file.pdf"], then_send: "总结这份文档" })
```

`paths` 必须是绝对路径且存在；不传 `then_send` 就只挂附件不发。

### 看界面 / 一般操作

- 截图：`doubao_desktop_screenshot()`
- 任何没有专门工具的控件：`doubao_desktop_click({ testid | selector | text })` + `doubao_desktop_press({key:"Escape"})`
- 读不到结构时：`doubao_desktop_eval({ expression: "..." })`（返回值要可 JSON 序列化）

## 硬规则

1. **不要用 JS `.click()` 代替 `doubao_desktop_click`**：豆包的菜单对合成 click 无反应，必须真实鼠标事件。
2. **耗时动作后先 snapshot**：导航、分享、朗读都可能把输入区 chip 弄没，重新开一次会话再继续。
3. **每条消息都是真实消费**：账号与额度是用户的，出图一次约 12.70 点。批量/重试前先看界面上的消耗提示。
4. **不要并发**：同一个 webview 只有一个焦点，串行调用；并行会互相抢焦点、点错目标。
5. **改版即失效**：选择器集中在 `src/selectors.js`，豆包升级后先跑 `scripts/smoke.js` 定位断点。

## 故障速查

| 现象 | 原因 | 处理 |
|---|---|---|
| `element not found: [data-testid=chat_input_action_model]` | 在 draft 页 | 先开一个已有会话 |
| `no Doubao page target` | app 没带调试端口 | `doubao_desktop_ensure` |
| `control not available: read_aloud` | 朗读按钮只在 hover 后挂载，且最后一条可能是纯图片回复 | 重开会话重试，或 `message_action more` 后再点 |
| 面板读取为空 | 面板本来就开着，点击把它关了 | 工具已内置 Escape 重试；仍失败就 snapshot 看一眼 |
| `timed_out: true` | 生成慢 | 不要重发，用 `replies` 续读 |
