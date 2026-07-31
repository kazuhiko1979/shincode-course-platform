# Code Reviewer Memory Index

- [Project Architecture](project-architecture.md) — Core stack, key conventions, and recurring patterns in this Next.js 16 + Supabase codebase
- [Security Findings](security-findings.md) — Known security gaps confirmed during initial full-codebase review (2026-06-03)
- [Common Mistake Patterns](common-mistakes.md) — Mistakes to watch for in future code changes
- [Rules split](rules-split.md) — 詳細規約は .claude/rules/ に分割。@import→paths: 一本化（v2.1.220 で検証済・glob 穴なし）
- [Harness / doc-only PRs](harness-doc-only-prs.md) — ランタイム無変更 PR は「文書の横断整合」と「新ルールの強制点」が主軸
- [Review output feedback](feedback-review-output.md) — read-only・実行して証拠提示・判定ラベル必須・メモリに回避手順を書かない
