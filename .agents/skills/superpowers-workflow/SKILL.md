---
name: superpowers-workflow
description: Use when
  codex向けの仕様駆動・TDD・レビュー・検証・Git連携を一貫して実行する共通開発ワークフロー。新機能、バグ修正、設計変更、DB/API変更、CI/CD変更を開始するときに使う。Claude
  CodeではこのSkillではなく既存のSuperpowersを使う。
---

# Superpowers Workflow for Codex

Claude CodeとCodexの開発規約を分離する。Claude CodeではSuperpowers、CodexではこのSkillとCodexのツール群を使う。

## 開発フロー

### 1. 要求とスコープ

- 目的、対象、対象外、制約、受け入れ条件、検証方法を短く整理する。
- 不明点が成果を変える場合だけ、最重要の質問を一つ行う。
- 既存の`docs/`、Rules、Hooks、共有ハーネス、関連実装を確認する。
- 破壊的変更、認証・権限、DB、外部サービス、秘密情報は明示的にリスク確認する。

### 2. 仕様・設計先行

- 仕様をテスト可能な受け入れ条件へ変換する。
- 必要に応じて基本設計、詳細設計、DB設計、アーキテクト設計、API契約を先に更新する。
- `docs/`の番号付きTODOにタスクを追加し、完了条件を明記する。
- 既存仕様と矛盾する場合は、実装より先に仕様の差分を記録する。

### 3. TDD実装

- まず失敗するunit/APIテストを追加する。
- 最小限の実装でテストを通し、読みやすさ・重複・境界条件を整理する。
- UI変更はPlaywrightの利用者シナリオを追加する。
- 認証、認可、入力検証、監査ログ、エラー応答を正常系と異常系の両方で確認する。

### 4. 検証・レビュー

- 変更単位ごとに最小テストを実行し、最後にプロジェクトのverifyコマンドを実行する。
- UI/API/DB変更では、可能な範囲でPlaywrightと実環境の疎通を行う。
- `git diff --check`、秘密情報混入、権限境界、マイグレーションの後方互換性を確認する。
- 複雑な変更ではreview-agent相当の独立レビューを行い、重大度付きで指摘を整理する。
- テスト結果、未検証事項、既知のリスクをdocsまたは最終報告に残す。

### 5. Git・CI/CD

- 変更範囲を確認し、意図したファイルだけをcommitする。
- commit前にテストと差分を確認する。
- GitHub作業では、必要に応じてGitHub Skill、CI失敗には`github:gh-fix-ci`、レビュー対応には`github:gh-address-comments`、公開には`github:yeet`を使う。
- DBマイグレーションは適用順序、ロールバックまたは前方互換性、対象環境を確認する。
- push/PR/merge後はCI、デプロイ、主要機能の実動作を確認する。

## Codexツールの使い分け

- 計画: `update_plan`
- ファイル検索: `rg`、`rg --files`
- 編集: `apply_patch`
- テスト・CLI: `exec_command`
- 画像確認: `view_image`
- GitHub: GitHub Skill群と`gh`
- Webの最新情報: Web検索。仕様・価格・外部サービス設定など変更され得る情報は確認する
- Skill追加・更新: `skill-creator`の手順に従う

## 完了条件

```text
[ ] 要求・受け入れ条件が明確
[ ] 設計とTODOが更新済み
[ ] unit/APIテストが成功
[ ] Playwrightまたは同等のE2E検証が成功
[ ] 認証・認可・入力検証・監査を確認
[ ] 差分・秘密情報・マイグレーションを確認
[ ] CI/CD結果を確認
[ ] 未検証事項と残課題を報告
```

## 運用境界

- 共有ルールは`_shared/harness`に置き、プロジェクト固有の仕様・秘密情報・例外は各プロジェクトに置く。
- 共有Skillの更新後は`/home/kazuh/project/_shared/bin/apply-shared-harness.sh sync-all`で既存プロジェクトへ反映する。
- 自動同期でプロジェクト固有ファイルと競合した場合は、共有側で上書きせずconflictとして人が判断する。
