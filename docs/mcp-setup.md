# MCP 配置说明

本项目使用项目级 `.codex/config.toml` 配置 MCP。项目级配置适合放无密钥、可共享的 MCP；涉及个人账号、Token、OAuth 登录的内容只放环境变量或个人级 `~/.codex/config.toml`，不要提交真实凭据。

## 已添加的 MCP

### Context7

用途：查询 Vue 3、Vite、Tailwind CSS、Express、TypeScript、SSE 等开发文档。

配置：

```toml
[mcp_servers.context7]
command = "npx"
args = ["-y", "@upstash/context7-mcp"]
```

使用方式：

- 让 Codex 查询某个库的当前文档，例如“用 Context7 查 Vue 3 watchEffect 的最新用法”。
- 实现 DeepSeek 流式接口、前端流式渲染、Vite 代理等功能前，可先让 Codex 查相关官方或库文档。

### Playwright

用途：验证前端页面、流式布局、滚动、错误态、移动端适配和交互行为。

配置：

```toml
[mcp_servers.playwright]
command = "npx"
args = ["-y", "@playwright/mcp"]
```

使用方式：

- 启动后端和前端开发服务后，让 Codex 打开 `http://localhost:5173`。
- 验证 SSE 消息是否增量出现、输入框状态是否正确、断流错误是否可见、移动端布局是否溢出。

### Figma

用途：读取 Figma 设计稿上下文，辅助把设计稿落地到 Vue 组件和 Tailwind 样式。

配置：

```toml
[mcp_servers.figma]
url = "https://mcp.figma.com/mcp"
```

使用方式：

- 首次使用前需要完成 Figma MCP 授权，通常使用：

```sh
codex mcp login figma
```

- 授权后，把 Figma 文件或选中 frame 告诉 Codex，让 Codex 读取设计信息并实现对应页面。
- 如果团队使用 Figma Local MCP，也可以把本项目配置改成本地服务地址。

### GitHub

用途：读取和管理 GitHub issue、PR、review、workflow 等协作信息。

配置：

```toml
[mcp_servers.github]
url = "https://api.githubcopilot.com/mcp/"
bearer_token_env_var = "GITHUB_PERSONAL_ACCESS_TOKEN"
```

使用方式：

- 使用前在本机环境变量中设置 `GITHUB_PERSONAL_ACCESS_TOKEN`，Token 权限按最小权限原则授予。
- 可让 Codex 查询 PR 状态、整理 issue、生成 PR 描述、查看 review 评论。
- 不要把 `GITHUB_PERSONAL_ACCESS_TOKEN` 写入 `.codex/config.toml` 或任何仓库文件。
- 如果远程 GitHub MCP 在当前账号或策略下不可用，可以改用 GitHub 官方 Docker 本地版：

```toml
[mcp_servers.github]
command = "docker"
args = ["run", "-i", "--rm", "-e", "GITHUB_PERSONAL_ACCESS_TOKEN", "ghcr.io/github/github-mcp-server"]
env_vars = ["GITHUB_PERSONAL_ACCESS_TOKEN"]
```

### 钉钉产品文档 MCP

用途：先支持读取仓库内导出的产品文档，后续可扩展为读取钉钉开放平台文档 API。

配置：

```toml
[mcp_servers.dingtalk_product_docs]
command = "node"
args = ["mcp/dingtalk-product-docs/server.mjs"]
cwd = "."
```

当前支持的工具：

- `list_product_docs`：列出 `docs/product/` 下的产品文档。
- `search_product_docs`：按关键词搜索产品文档。
- `read_product_doc`：读取指定产品文档。

使用方式：

- 将钉钉产品文档导出为 Markdown 或文本文件，放入 `docs/product/`。
- 让 Codex 使用钉钉产品文档 MCP 搜索需求、读取指定文档、对照设计稿和实现。
- 后续如果要接入钉钉开放平台 API，可以在 `mcp/dingtalk-product-docs/server.mjs` 中新增鉴权和远程读取工具，Token 仍通过环境变量传入。

## 生效方式

1. 确认当前项目在 Codex 中是 trusted project。
2. 重启 Codex，或开启新会话，让 `.codex/config.toml` 重新加载。
3. 在 Codex CLI 中可使用 `/mcp` 查看 MCP 状态。
4. 对 HTTP OAuth MCP，例如 Figma，按需执行 `codex mcp login figma`。

## 安全约定

- 不提交真实 Token、Cookie、私钥或账号凭据。
- Figma、GitHub、钉钉等账号型 MCP 优先使用 OAuth 或环境变量。
- 钉钉 MCP 默认只读本地导出文档，避免误改线上产品文档。
