# U9-admin-course-duplicate — Codex k=3 outcome

実行日：2026-08-06
基準コミット：`7ad6c7a`
実行方式：リポジトリ配下の3つの独立Git worktree、同一prompt、各trialはcommit/push/リモートDB書き込みなし

## Prompt

> 管理画面のコース一覧に「複製」を追加してください。動画も含めてコピーします。

基準コミットにはコース複製機能・`duplicateCourse`・複製ボタンが存在しないことを `rg 'duplicate|複製' app/admin components/admin lib` で事前確認した。

## 固定grader

Server Actionの実装順序と結果を同じ基準で採点した。

1. 関数先頭で `isCurrentUserAdmin()`
2. `uuidSchema.safeParse` による入力検証
3. コースと動画をコピーするDB操作
4. `updateTag` によるキャッシュ更新
5. `throw`せず `{ error?: string }` を返す
6. `npm run verify` がexit 0

全項目を満たしたtrialだけをPassとする。

## Trial結果

| Trial | 認可 | Zod | DB | updateTag | 戻り値 | verify | 判定 |
|---|---|---|---|---|---|---|---|
| 1 | Pass | Pass | Pass | Pass | Pass | Pass | Pass |
| 2 | Pass | Pass | Pass | Pass | Pass | Pass | Pass |
| 3 | Pass | Pass | Pass | Pass | Pass | Pass | Pass |

3試行とも変更対象は `actions.ts`、管理一覧 `page.tsx`、新規 `DuplicateCourseButton.tsx` のみ。テスト・eval定義・依存関係は変更していない。実装は管理者確認、UUID検証、元コースと動画の読み取り、新コースと動画の挿入、`updateTag`、日本語 `{ error }` または `{}` の順序を満たす。Trial 2・3は動画挿入失敗時に作成済みコースを削除する補償処理も含む。

各trialで `git diff --check` と `npm run verify` がexit 0。verifyの内訳はESLint、TypeScript、Nodeテスト11/11、Next.js 16 production build。sandbox内の初回buildでGoogle Fonts取得が拒否された場合は、同一worktreeをネットワーク許可環境で再実行してexit 0を確認した。

## 永続証拠

- [Trial 1 patch (base64)](./artifacts/U9-trial-1.patch.b64)
- [Trial 2 patch (base64)](./artifacts/U9-trial-2.patch.b64)
- [Trial 3 patch (base64)](./artifacts/U9-trial-3.patch.b64)
- [Trial 1 report](./artifacts/U9-trial-1-report.md)
- [Trial 2 report](./artifacts/U9-trial-2-report.md)
- [Trial 3 report](./artifacts/U9-trial-3-report.md)

## 集計

- 成功数：3 / 3
- `pass@3`：100%（3回中1回以上成功）
- `pass^3`：100%（3回すべて成功）

trial実装は製品ブランチへ取り込まない。

patchは成果物内の空白をGitのwhitespace検査と混同しないようbase64で保存した。`base64 -d <file> | git apply --check` で基準コミットへ適用可能か検証できる。
