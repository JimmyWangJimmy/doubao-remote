# Changelog

## 2.1.0 — 2026-11-24

- **Windows 11 支持**：进程控制改为 `tasklist` / `taskkill` / `spawn(Doubao.exe)`，`doubao ensure` 去掉 macOS 门禁
- 新增 `install.ps1`（含 `-Skill` / `-Service` / `-All`）与 `install.cmd`；`install.sh` 在 Git Bash / MSYS / Cygwin 下自动转交 PowerShell
- `doubao service stop` 在 Windows 上用 `netstat` + `taskkill` 定位并结束后台 MCP
- 选择器支持多版本候选：2.37 的 `general-agent-skill-button` ↔ 2.35 的 `skill_bar_button_*`
- `clickText` 改为首行匹配并优先最内层节点；点击后等待浮层挂载，修掉工作区切换等异步面板
- Windows 上 `doubao_desktop_plugins` 改从「插件 · 技能 · 伙伴」页读取，读完回到原页面
- 冒烟支持 SKIP（缺生成图样本时不再记失败），报告带 `platform` 字段
- 新增 `docs/WINDOWS.md`；README 增加平台矩阵与双平台一行安装

## 2.0.0 — 2026-11-23

- 工具从 9 个扩到 23 个：补齐输入层（真实鼠标 / 键盘）、模型与技能、会话、导航、上传、消息动作
- 面板读取改为**文本 diff**，不再猜容器类名或 z-index
- CDP 目标选择改为打分排序，修掉误连 `cross-site-support` 的问题
- hover-only 控件（朗读、图片动作）补齐指针移动与坐标夹取
- 修正属性选择器 / 模板正则两处 `SyntaxError`
- 新增 28 项冒烟测试、能力清单、14 条踩坑记录、Skill、launchd 模板、CI

## 1.0.0 — 2026-11-23

- 首版：status / ask / replies / images / screenshot / eval / new_chat / ensure / targets
