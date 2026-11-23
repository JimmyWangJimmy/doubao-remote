# 能力矩阵（实测）

环境：macOS · Doubao.app 2.37.12（`com.bot.pc.doubao`）· 内核 `Chrome/147.0.7727.149` · 账号为「学生免费版」
采集方式：`doubao-remote` 的 `snapshot` / 文本 diff 面板读取 / 真实鼠标点击，逐项记录于 `docs/smoke.json`。

## 1. 外壳与布局

| 区域 | 元素（`data-testid`） | 说明 |
|---|---|---|
| 顶栏 | `workspace-switch-chip` | 「豆包 / 工作」双工作区切换 |
| 侧栏 | `create_office_task_button` | 新工作任务 ⌘N |
| | `create_conversation_button` | 新对话 ⇧⌘K |
| | `sidebar_workbench_nav_button` | 工作台 |
| | `cron-jobs-sidebar-entry` | 定时任务 ⇧⌘T |
| | `sidebar_skills_nav_button` | 插件 · 技能 · 伙伴 ⇧⌘S |
| | `ai_space_nav_button` | 资料库 ⇧⌘D |
| | `global-search-icon-entry` | 全局搜索 |
| | `conversation-list-v2-item` / `conversation-list-v2-project` | 会话与项目分组、未读标记 |
| | `sidebar_footer_setting_entry` | 设置 |
| 头部 | `editable_conversation_name` | 会话名可直接编辑 |
| | `conversation_header_more_button` | 会话级更多（归档等） |

## 2. 输入区

| 元素 | testid | 实测行为 |
|---|---|---|
| 输入框 | `chat_input_input` 内的 `.ProseMirror` | TipTap/ProseMirror，`Input.insertText` 可写 |
| 发送 | `chat_input_send_button`（`aria-label=发送`） | **有内容才渲染**，需要真实鼠标点击 |
| 上传 | `upload_file_button` | 页面有 `input[type=file]`，`DOM.setFileInputFiles` 可直接注入 |
| 模型 | `chat_input_action_model` | 打开模型菜单 |
| 模式 | `chat_input_action_mode` | 模式切换（按会话状态变化） |
| 技能 | `general-agent-skill-button` | 打开技能面板 |
| 插件 | `general-agent-plugin-button` | 插件 / 伙伴面板 |
| 更多 | `chat_input` 内 `aria-label=更多` | 更多入口 |

> ⚠️ **新建对话（draft）页只有「项目 / 更多」两个 chip**；模型、技能、插件、按需确认、本地电脑这些 chip 只在**已有消息的会话**里出现。所有涉及它们的工具都因此需要先 `open_conversation`。

## 3. 模型清单（`doubao_desktop_models` 实测）

```
自动（小额免费）          豆包 2.1 Lite（限时优惠 0.01x）   豆包 2.1 Pro（0.65x）
DeepSeek V4.1 Flash       Qwen 4 Max（新上线 0.47x）        Kimi K3.1 Pro（0.95x）
Kimi K3.1 Pro 高速（1.44x） Kimi K3（1.48x）                 GLM 5.3（0.80x）
GLM 5.3 Flash（0.08x）     DeepSeek V4 Pro（0.46x）          Qwen 3.8 Max（0.74x）
Qwen 3.8 Flash（0.05x）
推理强度：中 / …
```

切换：`doubao_desktop_set_model({name:"豆包 2.1 Pro"})`，切回 `"自动"` 同样有效。

## 4. 技能面板（`doubao_desktop_skills` 实测）

**快捷功能（6）**：用量（上下文 6%）、技能管理、计划、目标、打开画布、反馈

**内置技能（30）**：
地图 · 录音转写 · 画板 · Markdown 笔记 · 知识库 · 任务 · 云文档 · PPT · 会议 · 多维表格 · 云盘 · 表格 · AI MediaKit 视频智能处理 · AI MediaKit 图像处理工具 · 豆包订阅礼品卡兑换 · HTML · Word · PDF · Seedream 5.5 · 创意设计 · 创意视频 · 定时任务 · 创建技能 · Seedance 2.5 · 系统清理与优化助手 · 会中实时查询 · AI 同传 · 录制操作生成技能 · **操作浏览器** · **操作电脑**

**来自本机（67）**：豆包桌面端会读取本机的 Agent 技能目录（本次实测读到 67 条，与 DSH 的 `~/.agents/skills` 一一对应，如 `Arkcli Agent`、`Lark Docs`、`Firecrawl Build` 等）。也就是说它本身已经是一个「技能宿主」。

> 这解释了为什么「操作电脑 / 操作浏览器」这类技能存在：豆包桌面端自己就能驱动 GUI，而本项目的 MCP 是从外部驱动它。

## 5. 消息区动作

| 动作 | testid | 备注 |
|---|---|---|
| 复制 | `message_action_copy` | 纯前端复制 |
| 分享 | `message_action_share` | 打开分享面板 |
| 编辑 | `message_action_edit` | 仅用户消息 |
| 更多 | `message_action_more` | 展开更多 |
| 点赞 / 点踩 | `message_action_like` / `_dislike` | |
| 重新生成 | `message_action_regenerate` | |
| 朗读（TTS） | `audio_play_button`（`aria-label=朗读`） | **hover 后才挂载** |
| 图片 | `message_image_content` → `mdbox_image` | 图源 `p5-flow-imagex-sign.byteimg.com`，带「豆包AI生成」水印 |
| 图片动作 | `edit_image_hover_tag_download_btn` / `_reference_btn` / `_open_canvas_btn` | 下载 / 作参考 / 在画布打开 |

## 6. 生成的完整证据

一次真实生成（`doubao_desktop_ask` → `doubao_desktop_images`）：

- 请求：「帮我画一张图：未来感少女半身立绘，紫罗兰短发、#8f7cff 挑染…竖构图 3:4」
- 回复：「共用时 35 秒 / 已完成图片生成 / 画好了，按你给的设定出图…消耗 12.70」
- 产物：`1330×1773` PNG（2.3 MB）+ `288×384` 缩略图，落在 `~/Pictures/doubao-desktop/`

## 7. 没接进来的（属于 UI 内部，非 API）

- 工作台 / 定时任务 / 资料库页面的**具体操作**（本项目只做到「导航到位并读到页面内容」，未做逐条 CRUD）
- 画布编辑（`打开画布` 会切到无限画布视图）
- 麦克风语音输入、会中同传等需要麦克风/会议权限的能力
- 「操作电脑 / 操作浏览器」技能的执行（那是豆包自己的技能，不是在 MCP 侧）
