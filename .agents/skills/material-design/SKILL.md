---
name: material-design
description: Use when google Material Design 3（Material You）に準拠した UI
  を、このプロジェクトのスタック （Next.js 16 / React 19 / Tailwind CSS v4）で作るためのスキル。Material
  Design・M3・ マテリアル・Material You に沿った画面／コンポーネント／テーマを新規作成・リデザインするとき、
  また「マテリアルっぽく」「Google 風の UI」「Material のボタン/カード/入力欄」といった依頼のときは、 たとえ "Material
  Design" と明示されていなくても必ずこのスキルを使うこと。M3 のカラーロール・ タイポグラフィスケール・エレベーション・シェイプ・ステートレイヤーを
  Tailwind v4 の `@theme` に 落とし込み、一貫した Material なコンポーネントを生成する。
---

# Material Design 3 UI（Next.js + Tailwind v4）

Material Design 3（M3 / Material You）は「デザイントークン」を土台にしたシステム。色・文字・角丸・影・余白を**個別の見た目でなくトークンの役割（role）で指定**するのが肝で、これを守ると画面全体が一貫した Material の質感になる。このスキルは M3 のトークンを **Tailwind CSS v4 の `@theme` に一度だけ登録**し、以降は `bg-primary` / `text-on-surface` / `rounded-m3-lg` / `shadow-m3-2` のようなユーティリティで組み立てる方針を取る。

なぜトークン経由にするか：M3 の一貫性は「同じ役割には同じ色・同じ角丸を使う」ことから生まれる。HEX を直書きすると役割の対応（例：`primary` の上には必ず `on-primary` を載せる）が崩れ、コントラストやダークテーマ対応も破綻する。トークンにすれば、色を1か所変えるだけで全体が追従し、ライト/ダークも自動で切り替わる。

> このプロジェクトの規約では通常「カスタムカラーは HEX 直指定・独自色を足さない」だが、**Material Design を採用する画面ではこのスキルのトークン体系を正とする**（M3 はトークン前提の設計思想のため）。既存の Udemy 風デザインと混在させず、Material 化する範囲を決めてから適用すること。

## 進め方（ワークフロー）

1. **適用範囲を確認する** — 新規画面か、既存画面のリデザインか。既存に混ぜると二重のデザイン言語になり崩れるため、対象コンポーネント／ルートを区切る。
2. **トークンを一度だけ配線する** — `app/globals.css` に M3 トークンを追加する（下記「トークンの配線」）。まだ無ければ `references/tokens.md` の貼り付け用ブロックを使う。既にあれば重複させない。
3. **コンポーネントを組む** — `references/components.md` のレシピ（ボタン各種・カード・テキストフィールド・チップ・FAB・ナビ・ダイアログ）を土台に、役割トークンのユーティリティで実装する。
4. **アクセシビリティを満たす** — タッチターゲット 48px 以上、フォーカスリング、`on-*` 色でのコントラスト、アイコンボタンの `aria-label`、画像の `alt`。
5. **確認する** — `npm run dev` で目視（ライト/ダーク両方、ホバー/フォーカス/押下のステート、キーボード操作）。あわせて完成前に `npm run verify`（lint→typecheck→build）を通す。

## トークンの配線（Tailwind v4）

このプロジェクトは Tailwind v4 の CSS ファースト設定（`app/globals.css` の `@import "tailwindcss"` ＋ `@theme inline`）。M3 トークンも同じ流儀で、**素の値を `:root` / ダーク用セレクタの CSS 変数に置き、`@theme inline` でユーティリティ名に紐づける**。

```css
/* app/globals.css — 既存の @import "tailwindcss"; の下に追記 */

/* 1) M3 システムトークン（ライト）。役割名で持つ */
:root {
  --md-primary: #6750a4;
  --md-on-primary: #ffffff;
  --md-primary-container: #eaddff;
  --md-on-primary-container: #21005d;
  --md-surface: #fef7ff;
  --md-on-surface: #1d1b20;
  --md-surface-container: #f3edf7;
  --md-outline: #79747e;
  /* …全ロールは references/tokens.md 参照 */
}

/* 2) ダークテーマ（.dark クラス or prefers-color-scheme で上書き） */
@media (prefers-color-scheme: dark) {
  :root {
    --md-primary: #d0bcff;
    --md-on-primary: #381e72;
    --md-surface: #141218;
    --md-on-surface: #e6e0e9;
    /* … */
  }
}

/* 3) Tailwind ユーティリティへ公開 */
@theme inline {
  --color-primary: var(--md-primary);
  --color-on-primary: var(--md-on-primary);
  --color-primary-container: var(--md-primary-container);
  --color-on-primary-container: var(--md-on-primary-container);
  --color-surface: var(--md-surface);
  --color-on-surface: var(--md-on-surface);
  --color-surface-container: var(--md-surface-container);
  --color-outline: var(--md-outline);

  /* シェイプ（角丸）→ rounded-m3-* */
  --radius-m3-xs: 4px;
  --radius-m3-sm: 8px;
  --radius-m3-md: 12px;
  --radius-m3-lg: 16px;
  --radius-m3-xl: 28px;

  /* エレベーション → shadow-m3-* */
  --shadow-m3-1: 0 1px 2px 0 rgb(0 0 0 / 0.30), 0 1px 3px 1px rgb(0 0 0 / 0.15);
  --shadow-m3-2: 0 1px 2px 0 rgb(0 0 0 / 0.30), 0 2px 6px 2px rgb(0 0 0 / 0.15);
  --shadow-m3-3: 0 1px 3px 0 rgb(0 0 0 / 0.30), 0 4px 8px 3px rgb(0 0 0 / 0.15);
}
```

これで `bg-primary text-on-primary`、`bg-surface-container text-on-surface`、`rounded-m3-lg`、`shadow-m3-2` が使える。**完全なトークン表（全カラーロールのライト/ダーク値・タイポスケール・貼り付け用の全文ブロック）は `references/tokens.md` を読むこと。**

## M3 の必須ルール（これだけは外さない）

- **色は必ずペアで使う** — 背景に `bg-primary` を敷いたら文字は `text-on-primary`。`surface` には `on-surface`、`primary-container` には `on-primary-container`。この対応がコントラストを保証する。単独色（`bg-primary` に黒文字など）は禁止。
- **角丸は M3 スケールから選ぶ** — 任意の px でなく `rounded-m3-{xs,sm,md,lg,xl}` と `rounded-full`。ボタンは基本 `rounded-full`、カードは `rounded-m3-md`〜`lg`、ダイアログは `rounded-m3-xl`。
- **影はエレベーションレベルで** — `shadow-m3-1`〜`3` を使い、任意の影を作らない。フラットな面（filled 系）は影を持たない。
- **ステートレイヤー** — ホバー/フォーカス/押下は、前景色（`on-*`）を 8%/10%/10% の不透明度で重ねて表現する。Tailwind では `hover:bg-on-surface/8`（＝8% 相当。Tailwind の任意値は `/[0.08]`）等で近似。`references/components.md` の実装を踏襲。
- **タッチターゲット 48px** — インタラクティブ要素は視覚サイズが小さくても当たり判定を `min-h-12`（48px）確保する。
- **タイポはスケールで** — 見出し・本文・ラベルを `display/headline/title/body/label` の役割で選ぶ（`references/tokens.md` のスケール）。

## このプロジェクトとの統合

- **Server Component 優先** — 見た目だけのコンポーネントは Server のまま。`useState` 等が要るインタラクション（メニュー開閉・リップル）だけ末端を `'use client'` に。
- **Tailwind のみ** — インライン `style={}` は使わない。ステートレイヤーやリップルも Tailwind ユーティリティ／`@theme` で表現。
- **`next/image`・`<Link>`** を使う（`<img>`・`<a href>` 不可）。
- **繰り返すクラス文字列は定数化** — ボタンのバリアント別クラスなどは `const FILLED = "..."` のようにコンポーネント外へ。
- コンポーネントは `export default`、props 型は複雑なら named `type`。命名は PascalCase。

## リファレンス

- `references/tokens.md` — 全カラーロール（ライト/ダーク完全版）・タイポグラフィスケール・シェイプ/エレベーション・`app/globals.css` に貼れる全文ブロック。**トークンを配線するとき必ず読む。**
- `references/components.md` — React + Tailwind のコンポーネントレシピ（Filled/Tonal/Outlined/Text/Elevated ボタン、FAB、カード3種、テキストフィールド、チップ、ナビゲーションバー、トップアプリバー、ダイアログ）。**コンポーネントを組むとき読む。**
</content>
