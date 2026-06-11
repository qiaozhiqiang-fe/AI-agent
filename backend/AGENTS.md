# Backend AGENTS

本文件定义 `backend/` 目录下的局部规则。进入该目录或修改其子文件时，本文件优先于根目录中更宽泛的后端描述。

## 适用范围

- `backend/src/`
- `backend/package.json`
- `backend/tsconfig.json`
- `backend/.env.example`

## 后端约定

- 当前后端为 Express + TypeScript 的轻量 API 服务。
- 新增接口时，优先保持统一的 JSON 返回结构，并明确成功态与错误态。
- 共享数据结构较多时，再考虑拆出独立的 `types` 或 `schemas` 文件；小改动不要过度抽象。
- 中间件、路由、配置读取逐步拆分即可，不为小功能提前搭复杂目录。
- 涉及时间、状态、枚举值时，优先返回稳定且可前端消费的数据格式。

## 环境变量

- 新增必需环境变量时，同时更新 `.env.example`。
- 不在代码中写入真实密钥或外部服务凭据。

## 后端验证

修改后优先执行：

```sh
cd backend
npm run lint
npm run build
```

涉及接口行为变更时，还应说明：

- 影响的路由
- 请求参数或响应结构是否变化
- 前端是否需要同步调整

