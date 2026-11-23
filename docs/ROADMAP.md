# 路线图

## 平台

| 平台 | 状态 | 说明 |
|---|---|---|
| **macOS 12+** | ✅ 已支持 | 当前唯一受支持平台，28/28 冒烟全绿 |
| **Windows** | 🚧 开发中 | 需替换三处平台相关实现，见下 |

### Windows 版要改的三处

| 现在（macOS） | Windows 对应 |
|---|---|
| `open -a Doubao --args --remote-debugging-port=9333` | `Start-Process` 传参启动豆包（`Doubao.exe` + `--remote-debugging-port`） |
| `osascript -e 'tell application "Doubao" to quit'` | `Stop-Process` / `taskkill` 关闭豆包 |
| `pgrep -f Doubao.app/...` | `tasklist` / `Get-Process Doubao` 探测进程 |

其余部分（CDP 协议、选择器、23 个工具、CLI、Skill）与平台无关，可原样复用；`install.sh` 需要一份 PowerShell 等价物。

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
