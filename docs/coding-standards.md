# Coding Standards

本文件定义项目代码规范。AI、人工开发和 review 均以本文件作为工程约定来源；项目流程入口仍见 `AGENTS.md`，AI 协作流程见 `docs/ai-development-workflow.md`。

## 通用原则

- 保持最小必要改动，不顺手重构无关代码。
- TypeScript 代码使用 ESM imports、单引号和分号。
- 公共接口、API 响应、组件状态、配置对象必须有明确类型。
- 不新增与当前技术栈冲突的框架或状态管理库。
- 不提交真实 `.env`、密钥、Token、Cookie、私钥、构建产物、`node_modules/` 或本地系统文件。

## 命名规范

- Vue 单文件组件使用 `PascalCase.vue`，例如 `UserProfile.vue`。
- TypeScript 源码文件使用 `kebab-case.ts`，例如 `user-service.ts`。
- 组合式函数文件使用 `use-*.ts`，导出函数使用 `useXxx`，例如 `use-user-list.ts` 导出 `useUserList`。
- 类型文件使用 `*.types.ts`，例如 `api.types.ts`。
- 测试文件使用 `*.test.ts`。
- Markdown 文档文件使用 `kebab-case.md`，`README.md` 除外。
- 分支名、目录名优先使用小写短横线，不使用中文、空格或特殊符号。

## 目录规范

### 前端目录

当前前端入口较小，目录按需要逐步增加，不为小改动提前搭空目录。

- `frontend/src/components/`：跨页面复用组件。
- `frontend/src/views/`：页面级组件。
- `frontend/src/services/`：HTTP 客户端和 API 访问。
- `frontend/src/composables/`：可复用组合式逻辑。
- `frontend/src/types/`：前端共享类型。
- `frontend/src/styles/`：全局样式和 Tailwind 入口。

### 后端目录

当前后端入口较小，路由和服务可随规模增长逐步拆分。

- `backend/src/routes/`：Express route 定义。
- `backend/src/controllers/`：请求解析、状态码和响应组装。
- `backend/src/services/`：业务逻辑。
- `backend/src/config/`：环境变量和配置读取。
- `backend/src/types/`：后端共享类型。
- `backend/src/schemas/`：请求校验 schema 或数据结构约束。

## Vue 规范

- 默认使用 Vue 3 Composition API 和 `<script setup lang="ts">`。
- 组件名使用 `PascalCase`，文件名与组件语义一致。
- props、emits、API 响应和组件状态必须有明确类型。
- 页面组件负责组合数据和交互，复杂请求、转换和复用逻辑应下沉到 `services/` 或 `composables/`。
- 与接口相关的 `loading`、`error`、`empty`、正常数据态应按需求覆盖，不把错误静默吞掉。
- 不在多个组件中重复创建 Axios 配置；统一使用 `frontend/src/services/http.ts` 或其上层 service。

## CSS 和 Tailwind 规范

- 优先使用 Tailwind CSS 工具类实现局部样式。
- 全局样式仅放通用 reset、字体、基础布局变量和 Tailwind 入口。
- 新增视觉风格应复用现有颜色、间距、圆角和阴影节奏，不为局部功能创建独立视觉体系。
- 响应式布局必须覆盖常见移动端和桌面宽度，文本不得明显溢出、遮挡或导致布局崩坏。
- 当 class 过长且重复出现时，优先抽组件；只有确实是全局语义样式时再抽 CSS class。

## TypeScript 规范

- 避免使用 `any`。确实需要时，应说明原因并把范围控制在最小。
- API 响应、请求参数、组件状态和配置对象要定义类型。
- 可为空值使用显式联合类型，例如 `string | null`。
- 不在业务代码里依赖隐式 `unknown` 或不受控类型转换。
- 共享类型达到跨模块复用时，放入对应 `types/` 目录。

## 后端接口规范

- API 路径使用名词和小写短横线，版本化前不要提前引入复杂路由层级。
- 成功响应优先返回 JSON 对象，错误响应应包含稳定的错误信息字段。
- HTTP 状态码要表达真实语义，例如参数错误使用 `400`，未找到使用 `404`，服务异常使用 `500`。
- 新增必需环境变量时，同步更新 `backend/.env.example`。
- 中间件、路由、配置读取和服务逻辑随规模增长拆分，不长期堆叠在 `backend/src/index.ts`。

## 验证要求

- 跨前后端变更优先执行 `npm run check`。
- 后端代码变更优先执行 `cd backend && npm run lint && npm run build`。
- 前端代码变更优先执行 `cd frontend && npm run lint && npm run build`。
- 只改文档时，可以不运行构建，但需要检查文档和项目结构是否一致。
- 命名、分支和提交信息检查使用 `npm run check:rules`。
