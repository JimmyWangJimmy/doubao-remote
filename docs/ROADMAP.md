# 路线图

## 平台

| 平台 | 状态 | 说明 |
|---|---|---|
| **macOS 12+** | ✅ 已支持 | 主平台，28/28 冒烟全绿 |
| **Windows 11** | ✅ 已支持 | 26/28 通过 + 2 项因无生成图样本跳过（豆包 2.35.12 实测），见 [WINDOWS.md](WINDOWS.md) |

### Windows 版落地时替换的三处

| 原（macOS） | Windows 实现 | 位置 |
|---|---|---|
| `open -a Doubao --args --remote-debugging-port=9333` | `spawn(Doubao.exe, --remote-debugging-port=N)` + `findWindowsAppPath()` | `src/tools.js` `launchApp()` |
| `osascript -e 'tell application "Doubao" to quit'` | `taskkill /IM Doubao.exe /F /T` | `src/tools.js` `quitApp()` |
| `pgrep -f Doubao.app/...` | `tasklist /FI "IMAGENAME eq Doubao.exe" /FO CSV /NH` | `src/tools.js` `pids()` |

配套改动：`install.sh` 的 PowerShell 等价物 [install.ps1](../install.ps1)；`bin/doubao.js` 的 `service stop` 改用 `netstat` + `taskkill`；选择器支持多版本候选。其余部分（CDP 协议、23 个工具、CLI、Skill）与平台无关，原样复用。

## 功能

- [x] 对话 / 读回复 / 出图 / 切模型 / 技能 / 插件 / 导航 / 上传 / 截图
- [x] 28 项冒烟 + 全量能力清单
- [ ] 工作台 / 定时任务 / 资料库的逐条 CRUD（目前只到「导航并读页面」）
- [ ] 画布（无限画布）节点级操作
- [ ] 会话清理 / 归档 / 重命名的批量接口
- [ ] 把「操作电脑 / 操作浏览器」技能纳入 MCP 语义层

## 明确不做

- **不碰云端 API**：不封装 Ark / Seedream 的 HTTP 接口，那是 arkcli 的事；这里只管本机 UI
- **不做账号体系**：用的是本机已登录的豆包账号，不引入任何凭证管理
- **不去水印**：生成图保持原样（含「豆包AI生成」水印）
