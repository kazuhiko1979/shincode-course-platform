# 016 Zod による入力バリデーション

## 概要
スキーマバリデーションライブラリ **Zod**（v4）を導入し、信頼できない入力境界＝**Server Actions**（フォーム・ID・role・検索語）を検証するようにした。従来のアドホックな `parseXxxForm` / 手動チェックを Zod スキーマに置き換え。

**設計方針（ベストプラクティス）**
- 入力は常に**サーバ側で検証**（クライアントの制御は信頼しない）。
- スキーマは `lib/schemas.ts` に集約し、各 Server Action は `safeParse` → 失敗時 `{ error }` を返す。
- ID は UUID 形式、role は enum、表示順は整数（不正値は 0）、サムネイル URL は https、YouTube URL は ID 抽出可能、テキストは最大長で制限。
- 検索語は最大長を制限し、`use cache` のキー肥大・濫用を防ぐ。

---

## Todo

- [x] `zod` を導入（v4.4.3）
- [x] `lib/schemas.ts`：`uuidSchema` / `roleSchema` / `searchQuerySchema` / `courseFormSchema` / `videoFormSchema` / `formString` / `firstError`
- [x] `courses/actions.ts`：create/update/delete を `courseFormSchema` + `uuidSchema` で検証
- [x] `courses/[id]/videos/actions.ts`：create/update/delete を `videoFormSchema` + `uuidSchema` で検証
- [x] `users/actions.ts`：`setUserRole` を `uuidSchema` + `roleSchema` で検証
- [x] `courses/[id]/actions.ts`：`enrollCourse` の courseId を `uuidSchema` で検証
- [x] `courses/[id]/videos/[videoId]/actions.ts`：視聴完了 mark/unmark の videoId/courseId を検証
- [x] `search/actions.ts`・`search/page.tsx`：検索語を `searchQuerySchema`（最大100文字）で検証

## 確認
- [x] `npm run build` / `npm run lint` 通過（全ルート ◐ PPR 維持）
- [x] Zod 実行時挙動を確認：order 不正→0 / UUID 不正拒否 / role 不正拒否 / 空白タイトルは「必須」で失敗

## 補足・残課題
- セキュリティレビュー（[docs/perf や会話履歴参照]）の残項目：
  - 🟠 SECURITY DEFINER 関数の `PUBLIC` 実行権限の是正（`revoke ... from public`）— **未対応**
  - 🟡 検索の PostgREST `.or()` のカンマ等エスケープ — 長さ制限は入れたが `.or()` 構文エスケープは**未対応**（courses は公開テーブルのため影響は低）
- フォームのフィールド単位エラー表示（現状は最初の1件を `{ error }` で返す）は、必要なら `flattenError` でフィールド別に拡張可能。
