---
name: hook-overhead
description: .claude フック（lint-on-save / validate-bash / notify）の性能特性と受容したオーバーヘッド前提
metadata:
  type: project
---

`.claude/hooks/` のフック群はエージェント作業時のみ起動し、アプリのランタイム性能（本番バンドル・リクエスト処理）には一切影響しない。設計上のオーバーヘッド前提：

- **lint-on-save.sh**（PostToolUse Write|Edit, 同期, timeout 30s）：JS/TS 保存ごとに `node_modules/.bin/eslint` を単一ファイルに対して起動。実測 ~1.5s wall / ~264MB RSS（2026-07-30 計測、tsx 1ファイル）。同期実行は「指摘を Claude に即フィードバックする」目的のため妥当（async 化すると出力を返せず目的を失う）。非対象拡張子は case で即 exit 0。1.5s は timeout 30s に対し十分な余裕。
- **validate-bash.sh**（PreToolUse Bash）：grep プレフィルタでトリガー語が無ければ node を起動せず即 exit 0。該当時のみ node 1回 + パターン数ぶんの grep ループ。負荷は無視可能。
- **notify.sh**：音再生を `( ... ) &` でバックグラウンド化し即 exit 0（settings も async:true）。二重で非ブロッキング。
- **session-start.sh**（SessionStart, 同期, timeout 10s）：`head` と `echo` のみで実測 wall 0.00s / maxRSS 3.3MB（2026-08-02 計測・3回）。stdout をセッション文脈に注入する仕組みのため同期は必然。実行コストは無視可能で、評価軸は実行時間でなく注入トークン量（[[context-budget]]）。

**Why:** JS/TS 編集ごとの ~1.5s は「保存時 lint による自己修正」というフィードバック価値のために受容した同期コスト（原則 §9）。マイクロ最適化（node 起動回避など）より価値が上回るとの判断。
**How to apply:** このオーバーヘッドを再度ボトルネックとして指摘しない。フック内容が変わり eslint 起動対象や同期/非同期方針が変化した場合のみ再評価する。
