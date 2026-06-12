# Team Rules Library

本项目的团队级规则库采用分层结构，避免把所有约定塞进一个文件。

## 规则层级

1. 根目录 `AGENTS.md`
   作用：项目通用规则、命令、AI 工作流、验证要求、PR 规范。
2. 子目录 `AGENTS.md`
   作用：模块局部规则。当前包括 `backend/AGENTS.md` 和 `frontend/AGENTS.md`。
3. `docs/` 专题文档
   作用：沉淀流程、评审标准和 Prompt 模板，不直接堆进根规则文件。

## 当前规则资产

- `AGENTS.md`：项目级规则入口。
- `backend/AGENTS.md`：后端局部规则。
- `frontend/AGENTS.md`：前端局部规则。
- `docs/ai-development-workflow.md`：AI 编码自动化流程。
- `docs/coding-standards.md`：Vue、CSS、TypeScript、文件命名、目录和接口规范。
- `docs/git-workflow.md`：分支、提交、PR 和本地 Git hooks 规范。
- `docs/code-review.md`：代码评审标准。
- `docs/pull-request-process.md`：分支与 PR 流程。
- `docs/prompts/`：团队复用 Prompt 模板。
- `.github/ISSUE_TEMPLATE/`：需求和缺陷输入模板。
- `.github/pull_request_template.md`：PR 描述模板。
- `.githooks/pre-push`：本地主分支推送拦截。
- `.githooks/commit-msg`：Conventional Commits 提交信息检查。
- `scripts/check-rules.mjs`：分支名和项目文件命名检查。

## 维护原则

- 规则必须和当前仓库实际情况一致。
- 优先写可执行规则，例如具体命令、输出结构、检查方式。
- 同类错误重复出现时，再补规则；不要预先写大量空泛约束。
- 流程说明放 `docs/`，项目入口说明放 `AGENTS.md`，模块差异放子目录 `AGENTS.md`。
- 可以自动判断的规则优先接入 `npm run check:rules`、Git hooks 或 CI，不只依赖人工阅读。
