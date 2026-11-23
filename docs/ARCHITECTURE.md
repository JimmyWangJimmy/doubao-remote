# 架构

```
src/server.js      MCP 传输层：Streamable HTTP、JSON 回复、工具注册
src/cdp.js         CDP 客户端：Input 事件、截图、文件注入、目标打分选择
src/tools.js       23 个工具实现（含面板文本 diff 读取、hover 重试）
src/selectors.js   实测过的选择器表（豆包改版时只改这里）
scripts/smoke.js   28 项全量冒烟，输出 docs/smoke.json + docs/SMOKE.md
bin/doubao.js      命令行入口：23 个工具的子命令（无需 MCP）
install.sh         一键安装：CLI + 调试端口 + 自检（可选 launchd / skill）
scripts/cdp-*.js   调试三件套：eval / click / probe
skills/            Agent 用 Skill（含故障速查）
```
