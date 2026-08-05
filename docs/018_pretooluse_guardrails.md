# 018 PreToolUse ガードレール（決定論的ブロック）

ステータス：✅ 完了

## 目的

`AGENTS.md` の「変更禁止ゾーン・Git 安全則」で**文章（確率的な「お願い」）**として禁止している危険操作を、**PreToolUse フックで決定論的に `exit 2` ブロック**する。ハーネス設計原則（`docs/harness/01_principles.md` §3「失敗が許されない制御は Hooks で強制」）の実装。`docs/harness/02_maturity.md` の **G-1**。

## スコープ

チーム共有・Git 管理下の **`.claude/settings.json`** に PreToolUse フックを配線し、スクリプトは **`.claude/hooks/`** に置く。

### ブロック対象

| 分類 | 対象ツール | ブロック条件 | 備考 |
|---|---|---|---|
| 破滅的削除 | Bash | `rm -rf`/`rm -fr` かつ対象が `/`・`~`・`$HOME`・`.`・`..`・`*` 等の壊滅的パス | `rm -rf node_modules` 等の限定パスは許可 |
| 強制 push | Bash | `git push` に `--force`/`-f`/`--force-with-lease` | 通常 push は許可（`/push-review` 経由） |
| 一括ステージ | Bash | `git add -A`/`--all`/`git add .` | パス明示を強制 |
| `.env` ステージ | Bash | `git add` の対象に `.env` を含む | シークレット混入防止 |
| DB 書き込み | `mcp__supabase__apply_migration` | 常時 | 変更禁止ゾーン |
| DB 書き込み | `mcp__supabase__execute_sql` | クエリが DDL/DML・実行系（INSERT/UPDATE/DELETE/ALTER/DROP/CREATE/TRUNCATE/GRANT/REVOKE/REPLACE/MERGE/CALL/DO/COPY/COMMENT/REFRESH/REINDEX/CLUSTER/VACUUM）を含む | SELECT/list は許可。解析不能時は fail-closed でブロック |

### 承認済み例外（オーバーライド）

DB 書き込みは変更禁止ゾーンだが「人間承認があれば実施可」。承認済みの操作は環境変数 **`CLAUDE_ALLOW_DB_WRITE=1`** をセットした状態で実行するとフックが通す（例：`CLAUDE_ALLOW_DB_WRITE=1` を付けて人間が実行）。

## 実装メモ

- jq 未インストールのため JSON 解析は **node**（本プロジェクトに必ずある）で行う。Bash フックは高速プレフィルタ（トリガー語が無ければ即 `exit 0`）で常時実行のオーバーヘッドを抑える。
- ブロックは `exit 2` ＋ stderr に理由（ユーザー画面）＋ stdout に代替案（Claude へ）。
- 通常の `git commit` / 通常 `git push` / パス明示 `git add <path>` / 限定パス `rm -rf` は**通さねばならない**（false positive を出さない）。

## Todo

- [x] `.claude/hooks/validate-bash.sh`（危険コマンドを明示的パターン配列で列挙しブロック：破滅的 rm・force push・git add -A/.・.env ステージ・sudo rm・reset --hard・clean -fdx・checkout -f・chmod 777・mkfs・dd→device・fork bomb・curl\|sh）
- [x] `.claude/hooks/validate-supabase-write.sh`（apply_migration・DDL/DML execute_sql。`CLAUDE_ALLOW_DB_WRITE=1` で承認済みオーバーライド）
- [x] `.claude/settings.json` に PreToolUse フック配線（matcher: Bash / supabase 書き込みツール）
- [x] スクリプトの pipe テスト（46/46 パス：ブロック系 exit 2・許可系 exit 0）
- [x] settings.json の検証（node で構文＋schema 確認）
- [x] `AGENTS.md`・`docs/harness/02_maturity.md` に反映（文章→強制の格上げ、G-1 完了）
- [x] `npm run verify` 通過確認 → `/push-review`

## 既知の挙動（注意）

- `validate-bash.sh` はコマンド**文字列全体**を検査するため、危険パターンを**文字列として含むだけ**のコマンド（例：`echo "rm -rf /"`、危険パターンを説明する grep）もブロックされる。誤検知だが安全側の設計。回避策：コミット/PR 文面やパターンを含むテキストは**ファイル経由**（`git commit -F <file>`、`--body-file`、`bash <script>`）で扱う。
- DB 書き込みの承認済み実行は `CLAUDE_ALLOW_DB_WRITE=1` を付けて行う。
- フックは `.claude/settings.json`（チーム共有・Git 管理）。無効化は `/hooks` から、または `settings.json` の該当ブロック削除。
