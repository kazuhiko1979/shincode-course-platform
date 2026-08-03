---
name: open-risks
description: 確認済みの未解決アプリケーションセキュリティリスク（差分に現れたら要再確認・重複指摘回避）
metadata:
  type: project
---

アプリコードの既知リスク。**これらのファイルが差分に現れたら現行コードで存在を再確認してから扱う**（fix 済みの可能性あり）。

### 1. GET /auth/callback で受講登録の副作用（未解決・受容）
`app/auth/callback/route.ts` の GET ハンドラ内で `?enroll=<uuid>` を受けて `enrollCourse` を実行（GET で状態変更）。OAuth code でゲートされ CSRF リスクは限定的、被害は無料コースへの本人登録のみのため重要度 Low。CLAUDE.md/AGENTS.md の「GET で状態変更しない」規約には抵触。
**Why:** 受容済みの既知リスク。同種パターンの拡大（他の GET 副作用）に注意する基準点。
**How to apply:** 新規 GET ルートで同型の副作用が増えていないか監視。単独では既知として再掲不要。

### 解決済み（再指摘しない）
- **deleteVideo の所有権 WHERE 欠落** — 2026-08-02 に現行コードで解消を確認（`app/admin/(protected)/courses/[id]/videos/actions.ts` の `deleteVideo` は `.eq('id', ...)` ＋ `.eq('course_id', ...)` の両方を持ち `updateVideo` と対称）。対になる操作の非対称は本プロジェクトの再発パターンなので、新規の update/delete ペアでは引き続き確認する。
