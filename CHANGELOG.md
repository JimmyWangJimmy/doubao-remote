# Changelog

## 2.0.0 — 2026-11-23

- 工具从 9 个扩到 23 个：补齐输入层（真实鼠标 / 键盘）、模型与技能、会话、导航、上传、消息动作
- 面板读取改为**文本 diff**，不再猜容器类名或 z-index
- CDP 目标选择改为打分排序，修掉误连 `cross-site-support` 的问题
- hover-only 控件（朗读、图片动作）补齐指针移动与坐标夹取
- 修正属性选择器 / 模板正则两处 `SyntaxError`
- 新增 28 项冒烟测试、能力清单、14 条踩坑记录、Skill、launchd 模板、CI

## 1.0.0 — 2026-11-23

- 首版：status / ask / replies / images / screenshot / eval / new_chat / ensure / targets
