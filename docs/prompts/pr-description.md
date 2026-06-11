# PR Description Prompt

用于根据当前 diff 和验证结果生成 PR 描述。

```md
请基于当前改动生成 PR 描述。

要求：
- 使用 .github/pull_request_template.md 的结构。
- 只写本次改动相关内容。
- 验证结果必须来自真实执行过的命令或实际检查。
- 如果存在未验证项或已知风险，写入“风险与影响”或“备注”。
```

