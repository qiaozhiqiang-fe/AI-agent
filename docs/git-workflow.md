# Git Workflow

本文件定义项目分支、提交和 PR 协作规范。默认禁止直推 `main`，所有变更通过功能分支和 Pull Request 合入。

## 分支规范

允许的分支类型：

- `feature/<topic>`：功能开发。
- `fix/<topic>`：缺陷修复。
- `docs/<topic>`：文档或流程调整。
- `refactor/<topic>`：重构，不改变外部行为。
- `test/<topic>`：测试补充。
- `chore/<topic>`：工具、依赖、配置和维护任务。
- `codex/<topic>`：AI 代理协作任务。

分支名要求：

- 使用小写字母、数字、短横线和斜线。
- 不使用中文、空格、下划线或特殊符号。
- `<topic>` 应表达任务意图，例如 `codex/add-coding-standards`。
- `main` 和 `master` 只作为受保护主分支，不直接提交和推送。

## 提交规范

提交信息采用 Conventional Commits 风格：

```text
<type>(<scope>): <description>
```

允许省略 `scope`：

```text
<type>: <description>
```

常用类型：

- `feat`：新增功能。
- `fix`：缺陷修复。
- `docs`：文档。
- `style`：格式或样式，不影响逻辑。
- `refactor`：重构。
- `test`：测试。
- `build`：构建系统或外部依赖。
- `ci`：CI 配置。
- `chore`：维护任务。
- `revert`：回滚。

示例：

```text
docs: add coding standards
feat(frontend): add user profile view
fix(backend): handle missing port env
chore(git): validate branch names
```

## 提交前检查

提交前应完成：

```sh
git status --short
npm run check:rules
```

按改动范围再执行：

```sh
npm run check
```

只改文档时，可以不运行构建，但必须确认文档路径、命令和项目结构真实存在。

## Pull Request 规范

- PR 标题要清楚说明意图。
- PR 正文必须基于 `.github/pull_request_template.md`。
- 验证结果只填写真实执行过的命令和结果。
- 未验证项、已知风险和后续事项必须写明。
- review 发现的问题解决后再合并。

## 本地工具约束

本仓库使用 `.githooks/` 作为本地 Git hooks 目录，当前 checkout 已通过 `core.hooksPath` 启用。

- `.githooks/pre-push`：阻止从 `main` 或 `master` 直接推送，并检查分支命名。
- `.githooks/commit-msg`：检查提交信息格式。
- `scripts/check-rules.mjs`：检查当前分支名和项目文件命名。

本地 hooks 不能替代 GitHub 分支保护。团队协作时仍建议在远端开启 branch protection 或 rulesets，要求 PR、status checks 和 review 后才能合并。
