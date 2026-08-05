# Claude Code / Codex CLI デュアル運用

## 共通構成

| 用途 | 正典 | Claude Code | Codex CLI |
|---|---|---|---|
| 規約 | `AGENTS.md` | `CLAUDE.md` から import | ネイティブ読込 |
| Hooks | `.agents/hooks/` | `.claude/settings.json` | `.codex/hooks.json` |
| パス別ルール | `.agents/rules/` | `.claude/rules/` の symlink | `AGENTS.md` のルーティング |
| Skills | `.agents/skills/` | `.claude/skills/` の symlink | ネイティブ検出 |
| 引継ぎ | `docs/`・Git diff・`claude-progress.txt` | 同じ実体 | 同じ実体 |

`.agents/` の変更は両 CLI に即時反映される。`.claude/settings.json` と `.codex/hooks.json` はイベント名や形式が違うため同期対象ではなく、同じ共通スクリプトを呼ぶ薄いアダプターにする。

## 起動と切替

```bash
# Claude Code
claude

# Codex
codex

# Codex の直前セッションを再開（~/.bashrc の alias）
ccc
```

Codex では `/permissions` で権限プリセットを切り替える。下部ステータスの `approval-mode` が `Ask for approval` / `Approve for me` / `Full access`、`permissions` が `Workspace` 等の sandbox 境界を表示する。`Approve for me` は sandbox を広げず、境界を越える申請だけを自動レビューへ送る。

Codex CLI 0.146.0 の Shift+Tab は Plan mode 切替として予約されている。`/keymap` の設定対象に権限メニューを開く action はないため、Shift+Tab を権限切替へ変更せず、権限変更には `/permissions` を使う。

## 同時利用

### 同じ作業ツリー

- 一方だけを書き手にする。
- 他方は `/review`、調査、説明など読み取り中心にする。
- 編集担当を交代する前に、実行中処理がないことと `git diff` を確認する。

### 両方で編集

別ブランチと別 worktree を使う。例では現在の作業ツリーを変更しない。

```bash
git worktree add ../shincode-course-platform-codex -b chore/codex-task
```

Claude と Codex に異なる worktree を割り当て、同じファイルを同時編集しない。統合は通常の Git review/merge で行う。

## セッション間ハンドオフ

会話履歴そのものは同期できない。作業の区切りで次を更新・確認する。

1. `docs/000_index.md` と対象チケットの Todo
2. `git status` と `git diff`
3. `claude-progress.txt`（検証済み事実だけ、60行以内、秘密値なし）
4. 実行済み検証と未実施検証

## MCP と秘密情報

Claude Code は `.mcp.json`、Codex は個人領域の `~/.codex/config.toml` を使う。形式が異なるためファイルをコピーせず、サーバー名だけを合わせる。キー、トークン、URL、`.env*` は共有設定や Git 管理ファイルへ転記しない。

確認コマンド：

```bash
codex mcp list
```

認証状態は CLI ごとに管理する。サーバー追加・削除時は両方の一覧を確認し、必要な側だけ同じ名前で更新する。

## Hook 変更時の検証

`.agents/hooks/` は両 CLI に影響するため、変更前に人間承認を得る。変更後は Claude 形式と Codex 形式の JSON をそれぞれ pipe テストし、設定 JSON/TOML、symlink、`npm run verify` まで確認する。
