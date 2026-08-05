# Claude Code / Codex CLI デュアル運用ハーネス

## 目的

Claude Code CLI と Codex CLI を同じリポジトリで使い分けても、規約・安全ガード・Skills・進捗情報が分岐しない構成にする。設定ファイルを機械的に複製せず、ツール非依存の資産を単一の正典へ集約し、各 CLI は薄いアダプターから参照する。

## 設計

| 層 | 正典 | 方針 |
|---|---|---|
| 共通規約 | `AGENTS.md` | Claude Code / Codex が同じ安全・レビュー・検証ルールを読む |
| 共通実装 | `.agents/hooks/` | Hook スクリプトを一か所だけ保守し、両 CLI の設定から呼ぶ |
| パス別知識 | `.agents/rules/` | 本文を一か所だけ保守。Claude は `.claude/rules/` から参照し、Codex は `AGENTS.md` のルーティング指示で読む |
| Skills | `.agents/skills/` | Open Agent Skills 形式の正典。Codex はネイティブ検出し、Claude は `.claude/skills/` から参照する |
| CLI 固有設定 | `.claude/settings.json` / `.codex/hooks.json`・`.codex/config.toml` | JSON/TOML やイベント差を吸収する薄いアダプター。内容のコピー元にはしない |
| MCP 認証 | `.mcp.json` / `~/.codex/config.toml` | 秘密値を Git 管理しない。サーバー名の整合だけ確認し、認証は各 CLI の個人領域に保持する |
| 長時間引継ぎ | `claude-progress.txt` / `feature_list.json` | ファイル名は互換性のため維持し、両 CLI が同じ実体を読む |

## 同時利用の境界

- 同じ作業ツリーをリアルタイム共有する場合は、**一方だけを書き手**にし、もう一方は読み取り・レビュー担当にする。
- Claude Code と Codex の両方が並行して編集する場合は、別ブランチ＋別 `git worktree` を使う。同じファイルへの同時書き込みは同期ではなく競合なので禁止する。
- セッション会話そのものは相互同期されない。チケット、Git diff、`claude-progress.txt` をツール間ハンドオフの正典にする。

## 対象外

- Claude 固有のサブエージェント定義やスラッシュコマンドを Codex 形式へ一対一コピーしない。Codex の `/review`、Skills、プラグイン等で同じ目的を満たす。
- `.mcp.json` の秘密値や `.env*` を `.codex/` や Git 管理ファイルへコピーしない。
- 既存の安全ガードを弱めない。

## Todo

- [x] リポジトリ全体と `.claude` / `.codex` / `.agents` / MCP の互換性を棚卸しする
- [x] `.agents/hooks/` を共通 Hook 実装の正典にする
- [x] `.agents/rules/` を backend / frontend ルール本文の正典にする
- [x] `.agents/skills/material-design/` を共通 Skill の正典にする
- [x] `.claude/` を共通資産への薄いアダプターへ変更する
- [x] `.codex/hooks.json` と `.codex/config.toml` を追加し、共通 Hook を配線する
- [x] Codex の個人 MCP 設定を秘密値を表示せず整合させる
- [x] 同時利用・worktree・ハンドオフ手順を共通ガイドへ反映する
- [x] Hook の pipe テスト、Codex strict config、`npm run verify` を実行して結果を記録する
- [x] 索引・成熟度・進捗ファイルを更新する

## 検証条件

- Claude と Codex の設定が同じ `.agents/hooks/` を参照し、Hook 実装の重複がない。
- Codex の `SessionStart`、危険 Bash ブロック、Supabase 書き込みブロック、編集後 lint が現行 Hook 入力で動く。
- Material Design Skill が両 CLI から同じ実体として検出される。
- `.mcp.json`、`.env*`、トークン、URL の秘密値が新規追跡ファイルへ入らない。
- `npm run verify` が exit 0。テスト・期待値・lint ルールは変更しない。

## 検証結果（2026-08-05）

- Hook pipe テスト：Claude/Codex の Bash 入力、安全/危険操作、Supabase SELECT/UPDATE/migration、Claude/Codex lint 入力、SessionStart の **10 / 10 pass**。
- `.claude/settings.json` / `.codex/hooks.json`：JSON parse pass。
- `codex --strict-config --version`：exit 0（Codex CLI 0.146.0）。
- Claude adapter symlink：全対象の実体解決 pass。
- `codex mcp list`：主要6サーバー（GitHub / Notion / Supabase / Playwright / Context7 / Serena）の登録を確認。秘密値は出力・転記していない。
- `npm run verify`：初回は sandbox から Google Fonts へ接続できず build のみ失敗。ネットワーク許可付き再実行で **lint → typecheck → test 11 / 11 → build の全工程 exit 0**。
- Codex の project Hooks：設定ファイルの検証は完了。次回の対話起動時に `/hooks` で内容を確認し、ユーザーが trust する。
- Codex footer：無効だった `approval-policy` を正式な `approval-mode`＋`permissions` へ修正し、`Approve for me` と `Workspace` を優先表示。
