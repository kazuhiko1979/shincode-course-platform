# Material 3 トークン完全版

M3 baseline パレット（Roboto/紫系のリファレンス配色）。プロダクト固有のブランド色に差し替える場合は、同じ「役割 → 値」の構造を保ったまま値だけ入れ替える。

## 目次
- [カラーロール（ライト/ダーク）](#カラーロール)
- [タイポグラフィスケール](#タイポグラフィスケール)
- [シェイプ（角丸）](#シェイプ)
- [エレベーション](#エレベーション)
- [ステートレイヤー](#ステートレイヤー)
- [globals.css 貼り付け用 全文ブロック](#貼り付け用-全文ブロック)

## カラーロール

各ロールは「面の色」と、その上に載る前景色 `on-*` がペア。UI では必ずペアで使う。

| ロール | ライト | ダーク | 用途 |
|---|---|---|---|
| primary | `#6750A4` | `#D0BCFF` | 主要アクション（filled ボタン、選択状態、FAB） |
| on-primary | `#FFFFFF` | `#381E72` | primary の上の文字/アイコン |
| primary-container | `#EADDFF` | `#4F378B` | 主要だが控えめな面（tonal ボタン、強調チップ） |
| on-primary-container | `#21005D` | `#EADDFF` | primary-container の上 |
| secondary | `#625B71` | `#CCC2DC` | 補助アクセント |
| on-secondary | `#FFFFFF` | `#332D41` | |
| secondary-container | `#E8DEF8` | `#4A4458` | 補助的な強調面 |
| on-secondary-container | `#1D192B` | `#E8DEF8` | |
| tertiary | `#7D5260` | `#EFB8C8` | 対比アクセント（バランス調整用） |
| on-tertiary | `#FFFFFF` | `#492532` | |
| tertiary-container | `#FFD8E4` | `#633B48` | |
| on-tertiary-container | `#31111D` | `#FFD8E4` | |
| error | `#B3261E` | `#F2B8B5` | エラー・破壊的操作 |
| on-error | `#FFFFFF` | `#601410` | |
| error-container | `#F9DEDC` | `#8C1D18` | エラーの控えめ面 |
| on-error-container | `#410E0B` | `#F9DEDC` | |
| surface | `#FEF7FF` | `#141218` | 既定の背景面 |
| on-surface | `#1D1B20` | `#E6E0E9` | surface 上の本文 |
| surface-variant | `#E7E0EC` | `#49454F` | 区切り面・入力欄の塗り |
| on-surface-variant | `#49454F` | `#CAC4D0` | 補助テキスト・アイコン |
| surface-container-lowest | `#FFFFFF` | `#0F0D13` | 最も沈んだ面 |
| surface-container-low | `#F7F2FA` | `#1D1B20` | |
| surface-container | `#F3EDF7` | `#211F26` | カード等の標準コンテナ |
| surface-container-high | `#ECE6F0` | `#2B2930` | |
| surface-container-highest | `#E6E0E9` | `#36343B` | 最も浮いた面 |
| outline | `#79747E` | `#938F99` | 枠線（outlined ボタン/入力欄） |
| outline-variant | `#CAC4D0` | `#49454F` | 控えめな区切り線 |
| inverse-surface | `#322F35` | `#E6E0E9` | 反転面（スナックバー） |
| inverse-on-surface | `#F5EFF7` | `#322F35` | |
| inverse-primary | `#D0BCFF` | `#6750A4` | 反転面上の主要色 |
| scrim | `#000000` | `#000000` | モーダル背後の暗幕（不透明度で使う） |

## タイポグラフィスケール

`役割: font-size / line-height / weight / letter-spacing`。M3 既定フォントは Roboto だが、本プロジェクトの Geist をそのまま使ってよい（厳密に Roboto を使うなら `next/font/google` で読み込む）。

| 役割 | size | line-height | weight | tracking | 用途 |
|---|---|---|---|---|---|
| display-large | 57px | 64px | 400 | -0.25 | ヒーロー見出し |
| display-medium | 45px | 52px | 400 | 0 | |
| display-small | 36px | 44px | 400 | 0 | |
| headline-large | 32px | 40px | 400 | 0 | セクション大見出し |
| headline-medium | 28px | 36px | 400 | 0 | |
| headline-small | 24px | 32px | 400 | 0 | |
| title-large | 22px | 28px | 400 | 0 | カード/アプリバー見出し |
| title-medium | 16px | 24px | 500 | 0.15 | リスト項目タイトル |
| title-small | 14px | 20px | 500 | 0.1 | |
| body-large | 16px | 24px | 400 | 0.5 | 本文 |
| body-medium | 14px | 20px | 400 | 0.25 | 本文（既定） |
| body-small | 12px | 16px | 400 | 0.4 | 補助 |
| label-large | 14px | 20px | 500 | 0.1 | ボタンのラベル |
| label-medium | 12px | 16px | 500 | 0.5 | |
| label-small | 11px | 16px | 500 | 0.5 | |

Tailwind v4 では `@theme` に `--text-*` を定義すると `text-*` ユーティリティになる（line-height も併記可）：

```css
@theme inline {
  --text-display-large: 3.5625rem;      /* 57px */
  --text-display-large--line-height: 4rem;
  --text-headline-small: 1.5rem;         /* 24px */
  --text-headline-small--line-height: 2rem;
  --text-title-medium: 1rem;
  --text-title-medium--line-height: 1.5rem;
  --text-body-medium: 0.875rem;
  --text-body-medium--line-height: 1.25rem;
  --text-label-large: 0.875rem;
  --text-label-large--line-height: 1.25rem;
  /* 必要な役割だけ定義すればよい */
}
```
使用例：`className="text-headline-small font-normal text-on-surface"`。weight/tracking はユーティリティ（`font-medium`, `tracking-[0.1px]`）で補う。

## シェイプ

| トークン | 値 | 主な用途 |
|---|---|---|
| m3-xs | 4px | 小さなチップ、テキストフィールドの角 |
| m3-sm | 8px | チップ、スナックバー |
| m3-md | 12px | カード（標準） |
| m3-lg | 16px | カード（大）、シート |
| m3-xl | 28px | ダイアログ、大きなコンテナ |
| full | 9999px | ボタン、FAB、検索バー |

## エレベーション

M3 は影＋（ダークでは）サーフェスの明度上げで表現。ここでは影のみを扱う。filled/tonal のフラットな要素は原則 level0（影なし）。

| レベル | 使用例 | box-shadow |
|---|---|---|
| 0 | filled ボタン、標準カード面 | none |
| 1 | elevated ボタン、浮いたカード | `0 1px 2px 0 rgb(0 0 0/.30), 0 1px 3px 1px rgb(0 0 0/.15)` |
| 2 | FAB（静止） | `0 1px 2px 0 rgb(0 0 0/.30), 0 2px 6px 2px rgb(0 0 0/.15)` |
| 3 | ダイアログ、メニュー、FAB(hover) | `0 1px 3px 0 rgb(0 0 0/.30), 0 4px 8px 3px rgb(0 0 0/.15)` |
| 4 | ナビゲーションドロワー | `0 2px 3px 0 rgb(0 0 0/.30), 0 6px 10px 4px rgb(0 0 0/.15)` |
| 5 | 最前面の一時的サーフェス | `0 4px 4px 0 rgb(0 0 0/.30), 0 8px 12px 6px rgb(0 0 0/.15)` |

## ステートレイヤー

インタラクティブ要素は、前景色（`on-*`）を半透明で重ねて状態を示す。

| 状態 | 不透明度 |
|---|---|
| hover | 8% |
| focus | 10% |
| pressed | 10% |
| dragged | 16% |

実装（Tailwind）：要素内に絶対配置のオーバーレイ要素を置くか、`hover:bg-[color-mix(...)]` で近似。簡易には `relative` な要素へ `before:` 疑似要素で `before:bg-on-surface before:opacity-0 hover:before:opacity-[0.08]` を敷く（`references/components.md` に実装例）。

## 貼り付け用 全文ブロック

`app/globals.css` の `@import "tailwindcss";` の直後に貼る。既存の `:root` 変数（Udemy 風の `--purple` 等）とは名前が衝突しないので共存可。

```css
/* ===== Material 3 tokens ===== */
:root {
  --md-primary: #6750a4; --md-on-primary: #ffffff;
  --md-primary-container: #eaddff; --md-on-primary-container: #21005d;
  --md-secondary: #625b71; --md-on-secondary: #ffffff;
  --md-secondary-container: #e8def8; --md-on-secondary-container: #1d192b;
  --md-tertiary: #7d5260; --md-on-tertiary: #ffffff;
  --md-tertiary-container: #ffd8e4; --md-on-tertiary-container: #31111d;
  --md-error: #b3261e; --md-on-error: #ffffff;
  --md-error-container: #f9dedc; --md-on-error-container: #410e0b;
  --md-surface: #fef7ff; --md-on-surface: #1d1b20;
  --md-surface-variant: #e7e0ec; --md-on-surface-variant: #49454f;
  --md-surface-container-lowest: #ffffff; --md-surface-container-low: #f7f2fa;
  --md-surface-container: #f3edf7; --md-surface-container-high: #ece6f0;
  --md-surface-container-highest: #e6e0e9;
  --md-outline: #79747e; --md-outline-variant: #cac4d0;
  --md-inverse-surface: #322f35; --md-inverse-on-surface: #f5eff7;
  --md-inverse-primary: #d0bcff; --md-scrim: #000000;
}
@media (prefers-color-scheme: dark) {
  :root {
    --md-primary: #d0bcff; --md-on-primary: #381e72;
    --md-primary-container: #4f378b; --md-on-primary-container: #eaddff;
    --md-secondary: #ccc2dc; --md-on-secondary: #332d41;
    --md-secondary-container: #4a4458; --md-on-secondary-container: #e8def8;
    --md-tertiary: #efb8c8; --md-on-tertiary: #492532;
    --md-tertiary-container: #633b48; --md-on-tertiary-container: #ffd8e4;
    --md-error: #f2b8b5; --md-on-error: #601410;
    --md-error-container: #8c1d18; --md-on-error-container: #f9dedc;
    --md-surface: #141218; --md-on-surface: #e6e0e9;
    --md-surface-variant: #49454f; --md-on-surface-variant: #cac4d0;
    --md-surface-container-lowest: #0f0d13; --md-surface-container-low: #1d1b20;
    --md-surface-container: #211f26; --md-surface-container-high: #2b2930;
    --md-surface-container-highest: #36343b;
    --md-outline: #938f99; --md-outline-variant: #49454f;
    --md-inverse-surface: #e6e0e9; --md-inverse-on-surface: #322f35;
    --md-inverse-primary: #6750a4; --md-scrim: #000000;
  }
}
@theme inline {
  --color-primary: var(--md-primary); --color-on-primary: var(--md-on-primary);
  --color-primary-container: var(--md-primary-container); --color-on-primary-container: var(--md-on-primary-container);
  --color-secondary: var(--md-secondary); --color-on-secondary: var(--md-on-secondary);
  --color-secondary-container: var(--md-secondary-container); --color-on-secondary-container: var(--md-on-secondary-container);
  --color-tertiary: var(--md-tertiary); --color-on-tertiary: var(--md-on-tertiary);
  --color-tertiary-container: var(--md-tertiary-container); --color-on-tertiary-container: var(--md-on-tertiary-container);
  --color-error: var(--md-error); --color-on-error: var(--md-on-error);
  --color-error-container: var(--md-error-container); --color-on-error-container: var(--md-on-error-container);
  --color-surface: var(--md-surface); --color-on-surface: var(--md-on-surface);
  --color-surface-variant: var(--md-surface-variant); --color-on-surface-variant: var(--md-on-surface-variant);
  --color-surface-container-lowest: var(--md-surface-container-lowest);
  --color-surface-container-low: var(--md-surface-container-low);
  --color-surface-container: var(--md-surface-container);
  --color-surface-container-high: var(--md-surface-container-high);
  --color-surface-container-highest: var(--md-surface-container-highest);
  --color-outline: var(--md-outline); --color-outline-variant: var(--md-outline-variant);
  --color-inverse-surface: var(--md-inverse-surface); --color-inverse-on-surface: var(--md-inverse-on-surface);
  --color-inverse-primary: var(--md-inverse-primary); --color-scrim: var(--md-scrim);

  --radius-m3-xs: 4px; --radius-m3-sm: 8px; --radius-m3-md: 12px;
  --radius-m3-lg: 16px; --radius-m3-xl: 28px;

  --shadow-m3-1: 0 1px 2px 0 rgb(0 0 0 / 0.30), 0 1px 3px 1px rgb(0 0 0 / 0.15);
  --shadow-m3-2: 0 1px 2px 0 rgb(0 0 0 / 0.30), 0 2px 6px 2px rgb(0 0 0 / 0.15);
  --shadow-m3-3: 0 1px 3px 0 rgb(0 0 0 / 0.30), 0 4px 8px 3px rgb(0 0 0 / 0.15);
  --shadow-m3-4: 0 2px 3px 0 rgb(0 0 0 / 0.30), 0 6px 10px 4px rgb(0 0 0 / 0.15);
  --shadow-m3-5: 0 4px 4px 0 rgb(0 0 0 / 0.30), 0 8px 12px 6px rgb(0 0 0 / 0.15);

  --text-display-large: 3.5625rem;  --text-display-large--line-height: 4rem;
  --text-headline-medium: 1.75rem;  --text-headline-medium--line-height: 2.25rem;
  --text-headline-small: 1.5rem;    --text-headline-small--line-height: 2rem;
  --text-title-large: 1.375rem;     --text-title-large--line-height: 1.75rem;
  --text-title-medium: 1rem;        --text-title-medium--line-height: 1.5rem;
  --text-body-large: 1rem;          --text-body-large--line-height: 1.5rem;
  --text-body-medium: 0.875rem;     --text-body-medium--line-height: 1.25rem;
  --text-label-large: 0.875rem;     --text-label-large--line-height: 1.25rem;
}
```
</content>
