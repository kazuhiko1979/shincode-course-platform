---
allowed-tools: Bash(git status:*), Bash(git branch:*), Bash(git rev-parse:*), Bash(git log:*), Bash(git diff:*), Bash(git push:*), Task
description: code-reviewer / security-reviewer / performance-reviewer を並列実行し、問題なければ push する
---

`git push` の代わりに使うレビュー付きプッシュコマンド。以下の手順を厳密に守ること。

## 手順

### 1. 前提確認

- `git rev-parse --abbrev-ref HEAD` で現在のブランチを確認する。`main` に直接いる場合は push せず、その旨を報告して中止する（このプロジェクトは feature ブランチ運用）。
- `git status` と `git log @{u}..HEAD --oneline`（上流未設定なら `git log main..HEAD --oneline`）で、これから push される未コミットの状態と未 push コミットを把握する。
- **未コミットの変更が残っている場合**は push できないため、その旨を報告して中止する（コミットは勝手に作らない）。

### 2. レビュー対象の特定

これから push される差分を対象にする。上流があれば `git diff @{u}...HEAD`、なければ `git diff main...HEAD` を使う。対象ファイルが無い（push するものが無い）場合はその旨を報告して中止する。

### 3. 3つのレビューを**並列で**起動する

**1つのメッセージ内で 3つの Task 呼び出しを同時に発行**し、並列実行する（差分は各エージェントに「上流があれば `git diff @{u}...HEAD`、無ければ `git diff main...HEAD`」を対象にするよう伝える）。

3エージェントは**それぞれ独立・read-only** で動作する：レビュー対象コードやリポジトリのファイルは一切変更しない。書き込みは各自の `agent-memory/<name>/` への任意のメモリ更新のみで、保存先が別ディレクトリのため**互いに conflict しない**（同一ファイルを書かない）。したがって同時実行しても安全。

- `security-reviewer` サブエージェント — 「これから push される差分をセキュリティ観点でレビューし、判定（PASS / PASS WITH NOTES / BLOCKED）を明記して報告してください」
- `code-reviewer` サブエージェント — 「これから push される差分を品質・正確性・規約遵守の観点でレビューし、判定（APPROVED / APPROVED WITH NOTES / CHANGES REQUESTED / BLOCKED）を明記して報告してください」
- `performance-reviewer` サブエージェント — 「これから push される差分をパフォーマンス観点でレビューし、判定（PASS / PASS WITH NOTES / NEEDS WORK）を明記して報告してください」

### 4. 判定を統合して push 可否を決める

3エージェントの報告を受け取り、統合判定を出す：

- **いずれかに「重大な問題」がある場合は push しない**。具体的には security-reviewer の `BLOCKED`（Critical / High）、または code-reviewer の `BLOCKED` / `CHANGES REQUESTED`。
  → 問題点を重要度順に要約して報告し、`git push` は実行しない。修正してから再実行するよう促す。
- **performance-reviewer の `NEEDS WORK`（High の性能問題）はブロッカー扱いにはしない**が、統合報告で明確に強調し、push 前にユーザーへ「このまま push するか、先に改善するか」を一言確認する（明確な指示があればそれに従う）。
- **上記のブロッカーが無く、確認も通った場合のみ**、`git push`（上流未設定なら `git push -u origin <ブランチ名>`）を実行する。
  - PASS WITH NOTES / APPROVED WITH NOTES / NEEDS WORK の任意・推奨対応事項があれば、push 後に「任意対応の指摘あり」として簡潔に併記する。

### 5. 結果報告

- push した場合：push 結果（リモート・ブランチ）と、3レビューの判定サマリ、任意・推奨対応の指摘を報告する。
- push しなかった場合：中止理由（ブロッカーの内容 or 前提未達）を明確に報告する。

## 注意

- コミットの作成・修正・`--force` は**しない**。行うのは差分レビューと（問題なければ）通常の push のみ。
- レビューは「これから push される差分」に限定する。コードベース全体の棚卸しはしない。
