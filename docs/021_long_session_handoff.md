# 021 長時間エージェント管理（構造化ハンドオフ・G-2）

ステータス：✅ 完了

## 目的

コンテキスト不安（窓が埋まると早期に手を抜く）・肥大化・コンテキスト毒性（幻覚の残留）への対策として、教材 §7 のハンドオフ基盤を導入する（`docs/harness/01_principles.md` §7、`02_maturity.md` G-2）。

- **`claude-progress.txt`**（進捗ファイル）：セッション間の引き継ぎノート。完了した作業／現在の状態／次のアクション。エージェント自身が更新する
- **`feature_list.json`**（フィーチャーリスト）：機能と検証手順の台帳。**`passes` フィールドのみ変更可・項目の削除/編集は人間承認必須**（テストを消して「全合格」を防ぐ規約。現状は文章ルール — PreToolUse ガード化は別チケット候補）
- **SessionStart フック**：セッション開始時に progress を自動注入＝「スタートアップ手順を必ず実行」を決定論化
- **役割分担**：Initializer（初回のみ基盤作成）／後継エージェント（毎セッション：手順→作業→progress 更新）

## Todo

- [x] `claude-progress.txt` 初期化（Initializer 役・60行以内・検証済み事実のみ）
- [x] `feature_list.json` 初期化（14機能＋検証手順、`_rules` に passes 規約明記）
- [x] `.claude/hooks/session-start.sh` ＋ `.claude/settings.json` に SessionStart 配線
- [x] CLAUDE.md に「セッション開始時の手順」「長時間運用の規律（不安・肥大化・毒性）」「役割分担」を記載
- [x] `docs/harness/02_maturity.md`（G-2 完了・領域7=2.5・総合80%）・`03_one-pager.md`・`000_index` 同期
- [x] フックの pipe テスト（exit 0・progress 注入確認）＋ `npm run verify` 通過
