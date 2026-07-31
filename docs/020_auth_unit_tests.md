# 020 認証ロジックの単体テスト（/goal 演習：証拠＋抜け道封じ）

ステータス：✅ 完了

## 目的

`/goal` の「悪い条件→良い条件」演習を本リポジトリで**実際に成立**させる。
書き直された良い条件：**「test/auth のテストが全部通り、lint がクリーンになる ＋ テストファイルは書き換えない・期待値を直書きしない」**（証拠＋抜け道封じ）。

あわせて、曖昧な /goal 条件を受理せず書き直す指針を CLAUDE.md に追加する（G-3 の運用を /goal にも接続）。

## 方針

- **依存追加ゼロ**：Node 22 組み込みの `node:test` を使う（テストランナー導入は変更禁止ゾーンの依存追加になるため回避。Node 22.18+ の TS type stripping で `.ts` を直接実行）。
- `@/` エイリアスは `node:module` の resolve フック（`test/setup/`）で解決（プロジェクト規約「相対パス不使用」を維持）。
- **期待値は仕様駆動**：`lib/auth.ts` の docstring・AGENTS.md セキュリティ基準（オープンリダイレクト排除・role='admin' のみ管理者）から導出。実装の出力を貼り付けない。
- 対象は純粋ロジック：`safeRedirectPath`（オープンリダイレクト対策）・`isAdminById`（スタブ SupabaseClient で role 判定）。Supabase 実接続が要る `getRequestClaims` 等は対象外（統合テストの領域）。

## Todo

- [x] `test/setup/`（register + alias-loader、依存ゼロ。`next/headers` の exports 無し問題も loader で解決）
- [x] `test/auth/safe-redirect-path.test.ts`（仕様駆動の攻撃ベクタ＋正常系：7 テスト）
- [x] `test/auth/is-admin-by-id.test.ts`（スタブで admin/user/データ無し/大文字 role を判定：4 テスト）
- [x] `package.json` に `test` スクリプト追加（`node --test`）
- [x] レビュー指摘対応：`npm test` を `verify` と CI に組み込み（散文でなく自動ゲート化）、`engines.node >=22.18` 明記、AGENTS.md に「テスト（抜け道封じ）」節を独立（Critical 明記）、serena-expert/ci.yml の旧記述同期
- [x] 全テスト通過（11/11）＋`npm run lint` クリーン（exit 0）＋`npm run verify` 通過（exit 0）を実証
- [x] CLAUDE.md：/goal 条件の書き方（証拠＋抜け道封じ・曖昧なら書き直して合意）とテスト実行方法を追記（AGENTS.md の旧記述も整合）
- [x] `docs/000_index.md` 更新
