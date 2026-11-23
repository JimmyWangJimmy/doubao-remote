# 接入客户端

**先选通道，再谈配置**（Agent 侧已按这套规则自动路由，用户不需要判断）：

| 你的情况 | 选哪条 |
|---|---|
| Agent 能跑 shell（Claude Code / Cursor / DSH / Codex） | **只装 Skill + CLI**，不开服务、不改配置。简单任务一条命令，复杂任务 Agent 会自己 `doubao service start` |
| 宿主只能走 MCP（没有 bash） | `bash install.sh --service`，再把 `http://127.0.0.1:18812/mcp` 填进客户端 |
| 要给别人/别的程序复用同一个连接 | 同上，MCP 更适合长连接与结构化参数 |

任何支持 **streamable HTTP** 的 MCP 客户端都能直接连 `http://127.0.0.1:18812/mcp`。

<details>
<summary><b>DSH（DeepSeek Harness）</b></summary>

在 profile 的 `cordis.patch.yml` 里追加：

```yaml
- insert:
    - id: doubao-desktop
      name: "@deepseek-ai/dsh-mcp-client"
      config:
        serverName: doubao-desktop
        transport: streamable-http
        url: http://127.0.0.1:18812/mcp
        failOnStartupError: false
```

保存后热挂载，工具立刻出现在会话里。
</details>

<details>
<summary><b>通用 mcp.json（Claude Code / Cursor / 其他）</b></summary>

```json
{
  "mcpServers": {
    "doubao-desktop": {
      "type": "http",
      "url": "http://127.0.0.1:18812/mcp"
    }
  }
}
```
</details>
