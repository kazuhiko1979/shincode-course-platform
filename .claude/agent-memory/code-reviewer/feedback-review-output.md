---
name: feedback-review-output
description: レビュー時のふるまいに関するユーザー指示（メモリに回避手順を書かない・実行して証拠を示す・read-only）
metadata:
  type: feedback
---

- **agent-memory に「回避手順（fix レシピ・ワークアラウンド）」を書かない**（2026-07-31 に明示指示）。
  メモリには再発しやすい観点・非自明な背景だけを残す。
- レビューは **read-only**。指摘のみで修正は適用しない。ただし `npm test` / `npm run lint` /
  `npm run typecheck` の実行は歓迎され、**実行結果を証拠として提示する**ことを期待されている。
- 出力には必ず **判定（APPROVED / APPROVED WITH NOTES / CHANGES REQUESTED / BLOCKED）** を明記し、
  指摘は重要度順・`file:line` 付きで書く。

**Why:** 修正手順をメモリに残すと古くなって誤誘導になる。また `/push-review` は 3 レビュアーの
並列判定でマージ可否を決める運用なので、判定ラベルと証拠が無いと機械的に扱えない。
**How to apply:** レビュー依頼を受けたら、まず該当コマンドを実行して事実を固め、
判定ラベル付きで報告する。メモリ更新は観点・背景のみに絞る。
関連: [[harness-doc-only-prs]]
