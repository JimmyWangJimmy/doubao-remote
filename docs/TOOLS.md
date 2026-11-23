# 工具参考（23 个）

CLI 子命令与 MCP 工具一一对应；`doubao call <tool> '<json>'` 可直调任意一个。

| 分类 | 工具 | 作用 |
|---|---|---|
| **状态** | `doubao_desktop_status` | 进程 / 调试端口 / 当前页 / 输入框状态 |
| | `doubao_desktop_ensure` | 调试端口没开就重启 app（会中断当前输入） |
| | `doubao_desktop_snapshot` | 页面 + 已打开面板的结构化快照 |
| | `doubao_desktop_screenshot` | 截图落盘，返回路径 |
| | `doubao_desktop_eval` | 页面内执行 JS（逃生舱） |
| **输入层** | `doubao_desktop_click` | 真实鼠标点击（selector / testid / 文本） |
| | `doubao_desktop_type` | 向输入框写字 |
| | `doubao_desktop_press` | Enter / Escape / Tab / ⌘A |
| **对话** | `doubao_desktop_ask` | 发送并等到「真回复」（含图片 URL） |
| | `doubao_desktop_replies` | 读最近 N 条回复 |
| | `doubao_desktop_new_chat` | 新对话 |
| | `doubao_desktop_conversations` | 侧栏会话列表 |
| | `doubao_desktop_open_conversation` | 按标题（子串）打开会话 |
| | `doubao_desktop_message_action` | 复制 / 分享 / 重新生成 / 点赞 / 朗读 / 图片下载·引用·进画布 |
| **媒体** | `doubao_desktop_images` | 抓取并下载回复中的图片 |
| **配置** | `doubao_desktop_models` | 枚举模型菜单 |
| | `doubao_desktop_set_model` | 切换模型 |
| | `doubao_desktop_skills` | 技能面板（快捷功能 + 内置技能 + 本机技能） |
| | `doubao_desktop_toggle_skill` | 选择技能 |
| | `doubao_desktop_plugins` | 插件 / 伙伴面板 |
| | `doubao_desktop_upload_file` | 上传附件，可顺带回一句话 |
| **导航** | `doubao_desktop_goto` | 工作台 / 定时任务 / 技能页 / 资料库 / 新工作任务 / 搜索 / 设置 / 对话 |
| | `doubao_desktop_search` | 全局搜索 |

## CLI 速查

```bash
doubao list                       # 列出全部工具
doubao status                     # 连接状态
doubao ask "…" [timeout_ms]       # 发送并等回复
doubao replies [n]
doubao images [n]
doubao screenshot [path]
doubao conversations [n]
doubao open "<标题>"
doubao models | doubao set-model "<名称>"
doubao skills
doubao goto workbench|cron|skills|library|office|search|chat
doubao service start|stop|status  # 复杂任务或无 shell 宿主才需要
doubao call <tool> '<json>'
```
