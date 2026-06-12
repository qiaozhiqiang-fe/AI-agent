# DeepSeek 流式模型调用实现说明

本文档说明当前项目中 DeepSeek 模型调用的实现方式、环境变量、接口契约和本地联调方式。

## 实现位置

- 后端入口：`backend/src/index.ts`
- 后端路由：`backend/src/routes/chat-routes.ts`
- 后端控制器：`backend/src/controllers/chat-controller.ts`
- DeepSeek 流式服务：`backend/src/services/deepseek-service.ts`
- 后端请求与消息类型：`backend/src/types/chat.types.ts`
- 前端流式客户端：`frontend/src/services/chat-stream.ts`
- 前端聊天状态：`frontend/src/composables/use-chat.ts`
- 前端聊天组件：`frontend/src/components/chat/`
- 前端共享类型：`frontend/src/types/chat.types.ts`
- 前端页面组合：`frontend/src/App.vue`

## 环境变量

后端从 `backend/.env` 读取配置。示例见 `backend/.env.example`。

```env
PORT=3000
DEEPSEEK_API_KEY=
DEEPSEEK_API_BASE_URL=https://api.deepseek.com
DEEPSEEK_MODEL=deepseek-v4-flash
DEEPSEEK_REQUEST_TIMEOUT_MS=60000
DEEPSEEK_SYSTEM_PROMPT=你是一名专业、准确的中文 AI 助手。
```

字段说明：

- `DEEPSEEK_API_KEY`：DeepSeek API Key。必填；为空时接口会返回 `MODEL_API_KEY_MISSING`，不会返回 Mock 数据。
- `DEEPSEEK_API_BASE_URL`：DeepSeek API Base URL，默认 `https://api.deepseek.com`。
- `DEEPSEEK_MODEL`：模型名称，默认 `deepseek-v4-flash`。
- `DEEPSEEK_REQUEST_TIMEOUT_MS`：上游请求超时时间。
- `DEEPSEEK_SYSTEM_PROMPT`：服务端系统提示词，用于承载通用回答规则；后续可接入钉钉产品文档中的业务流程、话术和合规限制。

真实 `backend/.env` 不要提交到仓库。

## 前端调用后端接口

前端通过 `fetch` 请求后端 SSE 接口：

```http
POST /api/chat/stream
Accept: text/event-stream
Content-Type: application/json
```

请求体：

```json
{
  "message": "用户本轮输入",
  "conversationId": "optional-conversation-id",
  "context": [
    {
      "role": "user",
      "content": "上一轮用户问题",
      "status": "done"
    },
    {
      "role": "assistant",
      "content": "上一轮 AI 回复",
      "status": "done"
    }
  ]
}
```

前端会在每轮发送时携带最近的有效上下文。失败的 AI 消息默认不作为有效上下文传给后端，避免污染后续回答。

## 后端调用 DeepSeek

当 `DEEPSEEK_API_KEY` 存在时，后端会调用：

```http
POST {DEEPSEEK_API_BASE_URL}/chat/completions
Authorization: Bearer ${DEEPSEEK_API_KEY}
Content-Type: application/json
```

请求体核心字段：

```json
{
  "model": "deepseek-v4-flash",
  "messages": [
    {
      "role": "system",
      "content": "系统提示词"
    },
    {
      "role": "user",
      "content": "历史用户输入"
    },
    {
      "role": "assistant",
      "content": "历史 AI 回复"
    },
    {
      "role": "user",
      "content": "用户本轮输入"
    }
  ],
  "stream": true
}
```

后端不会把 DeepSeek 原始响应直接暴露给前端，而是转换为项目统一 SSE 事件。

## 项目 SSE 事件

连接建立：

```text
event: start
data: {"messageId":"assistant-message-id","conversationId":"conversation-id"}
```

增量内容：

```text
event: delta
data: {"content":"增量文本"}
```

完成：

```text
event: done
data: {"finishReason":"stop"}
```

失败：

```text
event: error
data: {"code":"MODEL_REQUEST_FAILED","message":"DeepSeek request failed."}
```

心跳：

```text
event: ping
data: {}
```

## 本地联调方式

1. 在 `backend/.env` 中配置真实 `DEEPSEEK_API_KEY`。
2. 启动后端后，`/api/chat/stream` 会直接调用 DeepSeek 流式接口。
3. 不配置 `DEEPSEEK_API_KEY` 时，接口返回 `MODEL_API_KEY_MISSING`，不会返回 Mock 数据。
4. 前端不展示模型名称、请求耗时和 token usage。
5. 用户取消生成时，前端会中断当前请求，并保留已经生成的部分内容。

启动命令：

```sh
npm run dev:backend
npm run dev:frontend
```

默认地址：

- 后端：`http://localhost:3000`
- 前端：`http://localhost:5173`
