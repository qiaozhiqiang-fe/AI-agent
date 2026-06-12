# Pull Request Process

本项目默认禁止直推 `main`，所有代码变更通过功能分支和 Pull Request 合入。

## 默认流程

1. 从 `main` 拉出功能分支，例如 `codex/<topic>` 或 `feature/<topic>`。
2. 在功能分支完成修改、自检和提交。
3. 推送功能分支到远端。
4. 基于 `.github/pull_request_template.md` 创建 Pull Request。
5. 在 PR 中填写真实背景、改动内容、验证结果、风险与影响、备注。
6. 等待 GitHub Actions `CI` 检查通过。
7. 完成 review 后再合并到 `main`。

## 分支建议

- 文档或流程类改动：`docs/<topic>`
- 功能改动：`feature/<topic>`
- 缺陷修复：`fix/<topic>`
- 重构：`refactor/<topic>`
- 测试：`test/<topic>`
- 工具或维护：`chore/<topic>`
- AI 代理协作改动：`codex/<topic>`

详细分支和提交规范见 `docs/git-workflow.md`。

## 约束说明

- 本地 `.githooks/pre-push` 会阻止直接从 `main` 或 `master` 执行 `git push`。
- 本地 `.githooks/commit-msg` 会检查 Conventional Commits 提交信息。
- 推送前会执行 `scripts/check-rules.mjs` 检查分支名和文件命名。
- GitHub Actions 会在面向 `main` 的 PR 上执行基础 CI，运行 `npm run check`。
- PR 描述默认使用 `.github/pull_request_template.md`。
- 直接推送功能分支是允许的；禁止的是把改动直接推到受保护主分支。

## PR 创建要求

- 标题简洁，能说明改动意图。
- 正文必须覆盖模板中的各段。
- 验证结果只能填写真实执行过的命令和检查。
- 未验证项或已知风险必须写明。

## 推荐命令

```sh
git switch -c codex/<topic>
git push origin codex/<topic>
```

如果使用 GitHub Web 创建 PR，仓库会自动带出 PR 模板。
