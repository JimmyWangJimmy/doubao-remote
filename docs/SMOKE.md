# 全量冒烟测试报告

生成时间：2026-11-23T08:59:54.297Z

通过 **28/28**

| # | 能力 | 工具 | 结果 | 证据 |
|---|---|---|---|---|
| C01 | 应用状态 / devtools 连通 | `doubao_desktop_status` | ✅ | Chrome/147.0.7727.149 |
| C02 | 按标题打开会话 | `doubao_desktop_open_conversation` | ✅ | 介绍自己 - 豆包 |
| C03 | 页面快照 + 浮层读取 | `doubao_desktop_snapshot` | ✅ | 介绍自己 - 豆包 |
| C09 | 消息动作：复制 | `doubao_desktop_message_action` | ✅ | copy |
| C10 | 消息动作：朗读（TTS） | `doubao_desktop_message_action` | ✅ | read_aloud |
| C04 | 模型菜单枚举 | `doubao_desktop_models` | ✅ | 自动 小额免费 豆包 2.1 Lite 限时优惠 0.01x 豆包 2.1 Pro 0.65x DeepSeek V4.1 Flash 限时优惠 0.01x Q |
| C05 | 技能面板枚举（快捷功能 + 技能 30） | `doubao_desktop_skills` | ✅ | 快捷功能 (6) 用量 上下文用量 6% 技能管理 计划 描述你的任务，执行前会先输出计划 目标 描述你的目标，成果定义越清晰效果越好 打开画布 在无限画布中自 |
| C06 | 插件/伙伴面板 | `doubao_desktop_plugins` | ✅ | 地图    为你提供查地点、查路线、查公交、驾车和步骑行导航等全方位地理信息服务 添加插件 管理插件 |
| C07 | 会话列表读取 | `doubao_desktop_conversations` | ✅ | 31 条 |
| C08 | 历史生成图抓取（message_image_content） | `doubao_desktop_images` | ✅ | 2 张 |
| C11 | 切换模型 | `doubao_desktop_set_model` | ✅ | 豆包 2.1 Pro |
| C12 | 技能选择 | `doubao_desktop_toggle_skill` | ✅ | 地图 |
| C13 | 新建会话 | `doubao_desktop_new_chat` | ✅ | chrome://doubao-chat/chat |
| C14 | 输入层：写入输入框 | `doubao_desktop_type` | ✅ | 10 字 |
| C15 | 对话：发送并取回回复 | `doubao_desktop_ask` | ✅ | 收到 |
| C16 | 回复历史读取 | `doubao_desktop_replies` | ✅ | 1 条 |
| C17 | 导航：工作台 | `doubao_desktop_goto` | ✅ | 豆包 |
| C18 | 导航：定时任务 | `doubao_desktop_goto` | ✅ | 豆包 |
| C19 | 导航：资料库 | `doubao_desktop_goto` | ✅ | 豆包 |
| C20 | 导航：技能页 | `doubao_desktop_goto` | ✅ | 豆包 |
| C21 | 全局搜索 | `doubao_desktop_search` | ✅ | 清空 全部 消息 对话 资料库 本地产物 Previous slide Next slide 对话 0-K/年报、8-K |
| C22 | 附件上传 | `doubao_desktop_upload_file` | ✅ | attached |
| C23 | 截图 | `doubao_desktop_screenshot` | ✅ | /Users/jimmy/Pictures/doubao-desktop/doubao-1795424383915.png |
| C24 | 通用点击层（真实鼠标事件） | `doubao_desktop_click` | ✅ | model chip |
| C25 | JS 逃生舱 | `doubao_desktop_eval` | ✅ | 豆包 |
| C26 | 工作区切换（豆包 / 工作） | `doubao_desktop_click` | ✅ | workspace chip |
| C27 | 新工作任务（Office 任务入口） | `doubao_desktop_goto` | ✅ | 豆包 / 工作 / 新工作任务 / ⌘ N / ⌘ / N / 新对话 / ⇧ ⌘ K / ⇧ / ⌘ / K / 工作 |
| C28 | 图片动作：在画布打开 | `doubao_desktop_message_action` | ✅ | open_canvas |
