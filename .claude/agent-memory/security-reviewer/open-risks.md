---
name: open-risks
description: 確認済みの未解決アプリケーションセキュリティリスク（差分に現れたら要再確認・重複指摘回避）
metadata:
  type: project
---

以下は code-reviewer のメモリ（`.claude/agent-memory/code-reviewer/security-findings.md`）に「2026-07-10 時点で未解決」と記録された、アプリコードの既知リスク。**これらのファイルが差分に現れたら現行コードで存在を再確認してから扱う**（renamed/fix 済みの可能性あり）。

### 1. deleteVideo に所有権 WHERE 句が欠落
`app/admin/(protected)/courses/[id]/videos/actions.ts` の `deleteVideo` は `.eq('id', videoId)` のみで `.eq('course_id', courseId)` が無い（`updateVideo` は修正済みで非対称）。別コースの videoId を細工すると削除可能。admin 限定操作のため重要度 Low だが修正は容易。
**Why:** 対になる更新/削除操作の所有権チェック非対称は本プロジェクトで再発するパターン。
**How to apply:** 当該ファイルが差分に出たら修正されたか確認。未修正なら Low で再掲、修正済みなら本項を削除。

### 2. GET /auth/callback で受講登録の副作用
`app/auth/callback/route.ts` の GET ハンドラ内で `?enroll=<uuid>` を受けて `enrollCourse` を実行（GET で状態変更）。OAuth code でゲートされ CSRF リスクは限定的、被害は無料コースへの本人登録のみのため重要度 Low。CLAUDE.md/AGENTS.md の「GET で状態変更しない」規約には抵触。
**Why:** 受容済みの既知リスク。同種パターンの拡大（他の GET 副作用）に注意する基準点。
**How to apply:** 新規 GET ルートで同型の副作用が増えていないか監視。単独では既知として再掲不要。
