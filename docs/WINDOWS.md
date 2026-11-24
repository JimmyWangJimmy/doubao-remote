# Windows 支持说明

> 状态：**已支持**（实测于 豆包桌面端 2.35.12 / Chromium 147 / Windows 11 + Node 24）
> macOS 12+ 与 Windows 11 能力对等，公共部分（CDP 协议、选择器、23 个工具、CLI、Skill）完全复用。

## 0. 平台自动识别（用户不需要判断）

| 你敲的 | 实际发生 |
|---|---|
| `irm https://raw.githubusercontent.com/JimmyWangJimmy/doubao-remote/main/install.ps1 \| iex` | 直接跑 Windows 安装器 |
| `curl ... install.sh \| bash`（在 macOS/Linux） | 跑 macOS 安装器 |
| `bash install.sh`（在 Git Bash / MSYS / Cygwin） | 检测到 `MINGW*`/`MSYS*`/`CYGWIN*`，**自动转交** `install.ps1`；找不到 PowerShell 时打印 Windows 一行命令并退出 |
| `install.ps1`（在非 Windows 上） | 打印 macOS 一行命令并退出，不会误装 |
| `install.cmd`（双击） | 调同目录 `install.ps1`，出错时 `pause` 停留 |

`install.sh` 会把 `--skill` / `--service` / `--all` 映射成 `-Skill` / `-Service` / `-All` 再转交，参数不会丢。

> 实测：在 Git for Windows **2.56.1** 的 bash（`GNU bash 5.3.15`）里执行 `bash install.sh`，`uname -s` 为 `MINGW64_NT-10.0-26300`，命中转交分支，PowerShell 侧完成安装与自检，**退出码 0**；`bash -n install.sh` 语法检查通过。

## 1. 安装

```powershell
# 一行（远程，推荐）
irm https://raw.githubusercontent.com/JimmyWangJimmy/doubao-remote/main/install.ps1 | iex

# 从 checkout 跑
powershell -ExecutionPolicy Bypass -File install.ps1

# 追加：把 Agent 技能装进 %USERPROFILE%\.agents\skills\doubao-desktop
powershell -ExecutionPolicy Bypass -File install.ps1 -Skill

# 追加：登录自启的 MCP 常驻（127.0.0.1:18812）；只有复杂任务或纯 MCP 宿主才需要
powershell -ExecutionPolicy Bypass -File install.ps1 -Service

# 全部
powershell -ExecutionPolicy Bypass -File install.ps1 -All
```

前置：**Node ≥ 21**（`winget install OpenJS.NodeJS.LTS`）。装完不需要任何服务，`doubao` 直接可用。
Node 不在 PATH 时，安装器依次探测：`%LOCALAPPDATA%\Programs\nodejs` → `Program Files\nodejs` → nvm → Volta → fnm → **注册表 `HKLM\SOFTWARE\Node.js` 的 InstallPath**；都没有就报错，并支持用 `DOUBAO_NODE` 直接指定 `node.exe`。

安装器做的事与 `install.sh` 一一对应：

| 步骤 | install.sh（macOS） | install.ps1（Windows） |
|---|---|---|
| 运行时 | `command -v node` | 见上面的探测链，校验 ≥ 21 |
| 源码 | `git clone` 到 `~/.local/share/doubao-remote` | 同路径规则，`%USERPROFILE%\.local\share\doubao-remote`；脚本旁若有 checkout 则优先用它；`irm \| iex` 时自动回落到已安装目录或 clone |
| CLI | `~/.local/bin/doubao`（sh 包装） | `%USERPROFILE%\.local\bin\doubao.cmd`（写入用户级 PATH） |
| 调试端口 | `open -a Doubao --args --remote-debugging-port=9333` | `bin/doubao.js ensure` → `spawn Doubao.exe --remote-debugging-port=9333` |
| 技能 | 复制到 `~/.agents/skills` | 复制到 `%USERPROFILE%\.agents\skills` |
| 常驻 | launchd plist | 优先 `schtasks /SC ONLOGON`；**非管理员时自动回退**到启动文件夹的 `doubao-remote-mcp.vbs`（无窗口） |
| 自检 | `doubao status \| grep '"ok": true'` | 同样检查 `"ok": true` |

## 2. 代码层改了哪里

平台差异集中在 3 个文件，macOS 分支原样保留：

**`src/tools.js`**

| 函数 | 作用 |
|---|---|
| `findWindowsAppPath()` | 定位 `Doubao.exe`：`DOUBAO_APP_EXE` → 运行中进程的 ImagePath → 常见安装目录 |
| `pids()` | Windows 用 `tasklist /FI "IMAGENAME eq Doubao.exe" /FO CSV /NH`；macOS 仍用 `pgrep` |
| `quitApp()` | Windows `taskkill /IM Doubao.exe /F /T`（同时覆盖 `doubao.exe` / `豆包.exe`）；macOS `osascript quit` |
| `launchApp()` | Windows `spawn(exe, --remote-debugging-port=N)`；macOS `open -a` |
| `doubao_desktop_ensure` | 去掉 `process.platform !== 'darwin'` 门禁；等待进程退出轮询 20 → 40 次 |
| `resolveSelector()` | 选择器支持候选数组，取页面上第一个真实存在的（同一工具兼容 2.35 / 2.37 两代 UI） |
| `clickText()` | 增加「首行等于目标文本」匹配，并取**文本最短**的候选（列表行带描述时也能点中） |
| `doubao_desktop_click` | 点击后额外等 350ms 再读浮层，修掉工作区切换这类异步挂载的面板 |
| `doubao_desktop_plugins` | Windows 版工具栏没有插件按钮，改为读「插件 · 技能 · 伙伴」页并 `history.back()` 回到原页面，返回 `via: "skills-page"` |

**`src/selectors.js`**

```js
// 2.37 (macOS) 有 general-agent-skill-button；2.35 (Windows) 只有 skill_bar_button_* 这一排
skill:  ['[data-testid=general-agent-skill-button]', '[data-testid=skill_bar_button_more]', '[data-testid^=skill_bar_button_]'],
plugin: ['[data-testid=general-agent-plugin-button]', '[data-testid^=plugin_]'],
```

**`bin/doubao.js`**

`doubao service stop` 在 Windows 上不再调用 `launchctl` / `pkill`：改为 `netstat -ano -p TCP` 找到 18812 的 LISTENING 进程并 `taskkill /PID /F /T`，返回 `{ stopped, killed: [...] }`。`service status` 的 `launcher` 在 Windows 显示 `detached-process`。

**`scripts/smoke.js`**

冒烟脚本支持 **SKIP**：需要「历史生成图」样本的两项（`C08` 抓图、`C28` 在画布打开）在会话内没有图片时记 `➖` 而不是 `❌`；`C04` / `C05` 前先调 `ensureChatSurface()`，避免 TTS 之后 composer 状态漂移导致误判。

## 3. 实测结果（Windows 11 + 豆包 2.35.12）

```
26/28 passed, 2 skipped, 0 failed
```

- 通过：状态、按标题开会话、快照、消息动作（复制/朗读）、模型枚举（13 个模型 + 推理强度）、技能面板（快捷功能 5 + 技能 35 + 设备 3）、插件/伙伴页、会话列表、切模型（豆包 2.1 Pro）、技能选择（地图）、新建会话、输入、对话取回复、回复历史、四个导航、全局搜索、附件上传、截图、通用点击、JS 逃生舱、工作区切换、Office 任务入口
- 跳过：`C08` 历史生成图抓取、`C28` 图片在画布打开 —— 这台机器的会话里没有生成图样本，选择器 `message_image_content` / `mdbox_image` 无法实测

## 4. 已知限制

| 项 | 说明 |
|---|---|
| 版本覆盖 | 只在 豆包 **2.35.12** 上实测过；选择器对 2.36/2.37 有候选回退，但新版本 UI 若有改动未经验证 |
| 插件面板位置 | Windows 2.35 的对话工具栏只有 上传 / 模式 / 技能 / 模型，没有插件按钮；插件与「伙伴」在左侧「插件 · 技能 · 伙伴」页，工具会去那里读 |
| draft 页的模型菜单 | 新建的空会话里模型 chip 只显示「快速 / 专家」；打开任一已有会话才是完整 13 模型列表 |
| 登录自启 | 非管理员时无法创建 `ONLOGON` 计划任务（`Access is denied`），自动回退为启动文件夹 VBS，效果等价，只是不出现在「任务计划程序」里 |
| 调试端口 | 豆包被**手动**关掉再开会丢 `--remote-debugging-port`，需重新 `doubao ensure` |
| 图片类工具 | 依赖真实生成图样本，仓库自带的 28 项冒烟在本机有 2 项 SKIP，属于数据缺失而非功能缺陷 |

## 5. 故障排查

| 现象 | 处理 |
|---|---|
| `node >= 21 is required` | 装 Node LTS；或设 `DOUBAO_NODE` 指向 node.exe |
| `ok: false` + `ECONNREFUSED 127.0.0.1:9333` | `doubao ensure`（会重启豆包） |
| `Doubao.exe not found` | 设 `DOUBAO_APP_EXE` 为完整路径 |
| `doubao` 在旧终端里找不到 | 用户级 PATH 已写入，重开终端 |
| `doubao service stop` 杀不掉 | 以管理员身份重试；工具会返回 `killed: []` 表示没找到监听进程 |
| 中文参数变成乱码/空 | 用引号包住：`doubao ask "你好"`；PowerShell 直接调用即可，不要套 `cmd /c "..."` |

## 补测「出图 / 抓图」这一格（想帮忙的话）

Windows 首次实测时会话里没有生成图，因此 C08（抓图）与 C28（图片进画布）被跳过——
**跳过不等于通过**。补上只需要两步：

```powershell
# 1) 让豆包画一张（消耗一次出图额度）
doubao ask "画一个纯色背景的红色圆形，正方形" 240000

# 2) 抓取，能落地就说明这一格是通的
doubao images 1     # → %USERPROFILE%\Pictures\doubao-desktop 下的 img-*.png
```

或者让冒烟自己造样本（同样消耗一次额度）：

```bash
npm run smoke -- --gen-sample
```

结果两种处理：

| 结果 | 怎么做 |
|---|---|
| 拿到图 | 把 README 平台表里那格 ⚠️ 改成 ✅，提 PR（`docs:` 前缀即可） |
| 报错 | 把 `doubao images 1` 的完整输出 + `docs/WINDOWS.md` 里的环境信息贴到 issue |

已知风险：Windows 侧是豆包 **2.35.12**，macOS 是 **2.37.12**，两者图片节点的 `data-testid`
未必一致。选择器集中在 `src/selectors.js` 的 `replyImages`，改一行即可。
