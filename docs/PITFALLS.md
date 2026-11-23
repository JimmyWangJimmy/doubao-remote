# 踩坑记录（每条都花了时间）

## 1. 豆包桌面端是 Chromium 壳，不是 Electron

- 没有 `Contents/Frameworks/Electron Framework.framework`，但 `Info.plist` 里 `NSPrincipalClass = BrowserCrApplication`、`CFBundleExecutable = Doubao`。
- 只要 `open -a Doubao --args --remote-debugging-port=9333`，`/json/version` 就回 `Chrome/147.0.7727.149`。
- `Helpers/libmcp_helper.dylib` 里是 `rmcp-3.2.0` **客户端**，别被文件名骗了——豆包是去连别人的 MCP server，不是给你当 server。
- 它另有两个子壳：`Helpers/Doubao Browser.app`（自带 `Doubao Browser Framework.framework`）和 `Helpers/豆包.app`。

## 2. JS `.click()` 不算数，必须发真实鼠标事件

```js
document.querySelector('[data-testid=chat_input_action_model]').click();   // 菜单不开
```

`Runtime.evaluate` 里调 `.click()` 对模型 / 技能 / 插件 / 菜单项**全部无效**（React 合成事件 + 依赖 pointer 序列）。必须走：

```js
Input.dispatchMouseEvent { type: mouseMoved }
Input.dispatchMouseEvent { type: mousePressed, button: 'left', clickCount: 1 }
Input.dispatchMouseEvent { type: mouseReleased, ... }
```

本项目的 `CDP.click()` 就是这么做的。`doubao_desktop_eval` 里的 `.click()` 只适合「纯 DOM 按钮」，别指望它开菜单。

## 3. `/json/list` 里不止一个页面，`doubao-chat` 会误配

```
page    | 豆包                     | doubao://doubao-launcher/chat?viewId=101
other   | doubao://doubao-chat/cross-site-support/
page    | 介绍自己 - 豆包           | doubao://doubao-chat/chat/38455902610080514
page    | doubao://doubao-background
iframe  | https://www.doubao.com/drive-iframe/...
```

按字符串 `includes('doubao-chat')` 找目标会命中 **`cross-site-support`**（type 是 `other`，没有 DOM 交互能力），于是所有工具都报「element not found」。正确做法：只要 `type === 'page'`，再按 `doubao-chat/chat` +100、标题非「豆包」+20、launcher −50、background −100 打分排序。

## 4. 面板读取不能靠选择器猜，要文本 diff

模型菜单、技能面板、插件面板、搜索面板的容器类名/层级/z-index 各不相同，有的 `position:absolute` 且 `z-index:auto`，用 `[role=menu]`、`zIndex>=60` 这类规则会漏。可靠做法：

1. 点击前 `document.body.innerText`
2. 点击后同一取值
3. 取**最长公共前后缀之间**的插入段 = 新出现的面板文本

`panelDelta()` 即此实现。顺带解决了「面板已经开着、再点一下反而关掉」——插入段为空时按一次 Escape 重试。

## 5. hover-only 控件

`audio_play_button`（朗读）以及图片的「下载 / 参考 / 画布」按钮，只有指针悬停在消息上才挂载。`elementFromPoint` 或合成 `MouseEvent('mouseover')` 都不行，要用 `Input.dispatchMouseEvent {type:'mouseMoved'}`，且坐标必须**夹进视口**（`scrollIntoView` 之后 rect 仍可能在视口外，坐标越界等于没 hover）。

## 6. 工具必须带超时与重试，否则整条链路挂死

初版 `cdp-eval.js` 在目标被切走时 `Runtime.evaluate` 永不返回，整个脚本卡死（Node 侧没有默认超时）。落地的服务里：`connect()` 带 4s HTTP 超时，`WebSocket.ready()` 有 error 监听，工具层每个动作都是短平快的一次调用，长等待只在 `ask` 的轮询里。

## 7. 发送按钮「有内容才渲染」

`chat_input_send_button` 在输入框为空时**不存在**。所以 `ask` 的顺序必须是：清空 → 聚焦 → `Input.insertText` → 等 300ms → 再找发送按钮。空着直接找必然失败。

## 8. 回复「完成」的判定

豆包的中间态文本长这样：

```
已处理 20 秒
正在生成图片
```

```js
const PENDING = /正在(思考|生成|处理|搜索|绘制|画图)|^已处理\s*\d+\s*秒|生成中|加载中/;
```

只看「文本稳定两轮」会把 `正在思考` 当答案返回（第一版就踩了）。正确判定：文本稳定 **且** 不匹配 PENDING，连续 2 轮才算完。

## 9. 图片不在 `message_text_content` 里

生成图在 `message_image_content` → `mdbox_image` 的 `<img>`，且同时有两个 URL（缩略图 `cthumb_lwm3` 与原图 `cgen_lwm3`，都带水印）。只查 `message_text_content` 会永远拿到 0 张。

## 10. draft 页与会话页的输入区不是同一套

新对话页 chips 只有「项目 / 更多」；会话页才有「本地电脑 / 项目 / 按需确认 / 技能 / 插件 / 自动」。因此所有依赖 chip 的工具（模型、技能、插件）在 draft 页会「element not found」——这不是 bug，是 UI 状态。冒烟脚本里因此加了 `ensureChatSurface()`：发现 chips 不足就重开会话再测。

## 11. 模板字符串里写正则会被二次转义

`new RegExp`/正则字面量塞进 `cdp.eval(\`...\`)` 的模板串里，`\\(` 会被吃成 `\(`，运行时直接 `SyntaxError: Unterminated group`。本项目最终**在注入的 JS 里不用带括号的正则**，改用 `MARKERS.some(m => text.includes(m))`。

## 12. 属性选择器要加引号

`[data-dsh-probe=1]` 在 `querySelector` 里会抛 `SyntaxError`（值必须以标识符或引号形式），写成 `[data-dsh-probe="1"]` 才对。这个 bug 让 `set_model` 直接崩过一次。

## 13. 别用 `timeout` 命令

macOS 默认没有 GNU `timeout`（`bash: timeout: command not found`）。要么 `gtimeout`（coreutils），要么在 Node/Python 里自己控超时。

## 14. 额度是真金白银

生成一张图，界面会明写「消耗 12.70」。跑冒烟测试时不要顺手让豆包生成图片；本项目的历史图抓取（C08）是**读已有消息**，不产生费用。
