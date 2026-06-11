# AGENTS.md

本文件是 Codex 在当前项目内工作的项目级规则。除非用户明确覆盖，所有自动化修改、排查、验证和提交说明都应遵守这里的约定。

## 项目概况

- 项目类型：前后端分离的 TypeScript 应用。
- 后端目录：`backend/`，使用 Express + TypeScript，入口为 `backend/src/index.ts`。
- 前端目录：`frontend/`，使用 Vue 3 + TypeScript + Vite + Tailwind CSS，入口为 `frontend/src/main.ts`。
- 前端 HTTP 客户端位于 `frontend/src/services/http.ts`，默认通过 `/api` 访问后端。
- Vite 开发服务在 `frontend/vite.config.ts` 中把 `/api` 代理到 `http://localhost:3000`。
- 后端默认端口为 `3000`，可通过 `backend/.env` 中的 `PORT` 覆盖；示例配置见 `backend/.env.example`。

## 沟通语言

- 日常沟通使用中文，优先说明结论、改动和验证结果。
- 技术报错、异常名、API 名称、命令输出、库名、配置键、HTTP 状态码等保留英文原文。
- 如果出现错误，不要只翻译或概括；保留关键英文错误信息，方便定位。
- 需要用户确认时，只问一个最关键的问题，避免把简单事项拆成多轮。

## 工作方式

- 需求足够明确时直接执行；只有继续操作会带来明显风险、不可逆影响或需要外部权限时才先询问。
- 修改前先阅读相关文件，不凭印象改。
- 优先做最小必要改动，避免顺手重构无关代码。
- 不覆盖用户已有改动，不擅自格式化无关文件。
- 无法完成、验证失败、环境缺失、网络失败都要真实说明。

## 代码规范

- 遵循现有 TypeScript 风格：ESM imports、单引号、分号。
- 公共接口、API 响应、组件状态等应使用明确的类型。
- 后端路由、服务逻辑和配置应随规模增长逐步拆分，避免把所有逻辑长期堆在 `backend/src/index.ts`。
- 前端 API 访问优先放在 `frontend/src/services/` 下。
- Vue 组件保持职责清晰，避免在单个组件里混合过多请求、转换、展示和交互逻辑。
- Tailwind 类名优先复用现有视觉风格，避免引入与项目不一致的大范围样式体系。

## 环境与安全

- 不提交真实 `.env`、密钥、Token、Cookie、私钥或账号凭据。
- 新增必需环境变量时，同步更新对应的 `.env.example`。
- 示例配置只能使用占位符，不写入真实业务数据。
- 不执行破坏性命令，例如 `git reset --hard`、批量删除、清空目录，除非用户明确要求并确认目标路径。
- 不提交 `node_modules/`、构建产物或本地系统文件。

## 常用命令

后端命令：

```sh
cd backend
npm install
npm run dev
npm run build
npm run lint
npm run format
```

前端命令：

```sh
cd frontend
npm install
npm run dev
npm run build
npm run lint
npm run format
```

本地开发默认地址：

- 后端：`http://localhost:3000`
- 前端：`http://localhost:5173`

## 验证要求

- 后端代码变更后，优先运行：

```sh
cd backend
npm run lint
npm run build
```

- 前端代码变更后，优先运行：

```sh
cd frontend
npm run lint
npm run build
```

- 涉及前后端联调时，尽量同时启动后端和前端，确认 `/api` 代理和接口调用正常。
- 只改文档时，可以不运行构建，但最终回复要说明已做的文档检查。
- 如果验证无法执行，要明确说明原因和剩余风险，不要声称测试通过。

## Git 与提交

- 提交前先检查 `git status`，区分自己改动和用户已有改动。
- 不回滚用户未授权的修改。
- 提交信息使用简洁中文或常见英文 conventional commit，保持含义清楚。
- 依赖变更需要同时提交对应的 lockfile；没有依赖变更时不要改 lockfile。
- 推送前确认目标远端和分支，不默认推送到任意远端。

## 修改流程

1. 阅读相关前端、后端或配置文件。
2. 确认最小改动范围。
3. 修改前简短说明即将编辑哪些文件。
4. 修改后执行与变更匹配的验证。
5. 最终回复说明改了什么、验证了什么、是否还有未覆盖风险。

## 不应做的事

- 不把项目描述成纯静态 HTML 页面。
- 以 `backend/package.json` 和 `frontend/package.json` 中的脚本为准，不虚构不存在的命令。
- 不引入 React、Next.js、Nuxt、其他后端框架或新状态管理库，除非用户明确要求。
- 不把中文需求改写成只有英文的文档或界面。
- 不在未验证时声称“已完成测试”或“构建通过”。
