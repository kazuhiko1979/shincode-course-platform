<!-- performance-reviewer の永続メモリ索引。1メモリ1行で追記する（frontmatter なし・内容は各ファイルへ）。 -->

- [フックのオーバーヘッド前提](hook-overhead.md) — .claude フックは作業時のみ・アプリ性能に無影響。lint-on-save の ~1.5s 同期コストは受容済み
- [テストハーネスのオーバーヘッド前提](test-harness-overhead.md) — npm test は wall ~0.5s・バンドル影響ゼロ。実行時間/型チェック混入は再指摘しない
