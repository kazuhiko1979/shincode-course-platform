# Material 3 コンポーネントレシピ（React + Tailwind v4）

前提：`references/tokens.md` のトークンが `app/globals.css` に配線済み（`bg-primary` 等が使える）。ここでは各コンポーネントの構造と役割トークンの使い方を示す。値はコピペの出発点であり、依頼に合わせて調整する。繰り返すクラス文字列は**コンポーネント外の定数**に抽出すること（本プロジェクト規約）。

## 目次
- [ボタン（5種）](#ボタン)
- [FAB](#fab)
- [カード（3種）](#カード)
- [テキストフィールド](#テキストフィールド)
- [チップ](#チップ)
- [ナビゲーションバー](#ナビゲーションバー)
- [トップアプリバー](#トップアプリバー)
- [ダイアログ](#ダイアログ)
- [ステートレイヤーの実装](#ステートレイヤーの実装)

## ボタン

M3 のボタンは5種。ラベルは `label-large`、高さ 40px（当たり判定は 48px 確保）、角丸 `full`、水平パディング 24px（アイコン付きは 16px）。

```tsx
// components/md/Button.tsx
import type { ComponentProps } from 'react'

type Variant = 'filled' | 'tonal' | 'outlined' | 'text' | 'elevated'

const BASE =
  'inline-flex items-center justify-center gap-2 h-10 min-h-12 px-6 rounded-full ' +
  'text-label-large font-medium tracking-[0.1px] transition-shadow ' +
  'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary ' +
  'disabled:opacity-40 disabled:pointer-events-none cursor-pointer'

// ステートレイヤーの付け方はバリアントで異なる（重要・後述の「ステートレイヤーの実装」参照）:
//  - 塗りのある filled / tonal / elevated → 疑似要素オーバーレイ（before:）で重ねる。
//    hover:bg-* を使うと元の塗り（bg-primary 等）を置き換えてしまい M3 的に誤りになる。
//  - 透明背景の outlined / text → hover:bg-<前景>/[0.08] でよい（重ねる相手が下地なので置換にならない）。
const LAYER = // filled/tonal/elevated 用：前景色(bg-current=text色)を薄く重ねる
  'relative overflow-hidden before:absolute before:inset-0 before:bg-current ' +
  'before:opacity-0 before:transition-opacity hover:before:opacity-[0.08] active:before:opacity-[0.10]'

const VARIANTS: Record<Variant, string> = {
  filled: `bg-primary text-on-primary hover:shadow-m3-1 ${LAYER}`,
  tonal: `bg-secondary-container text-on-secondary-container hover:shadow-m3-1 ${LAYER}`,
  outlined: 'border border-outline text-primary hover:bg-primary/[0.08]',
  text: 'px-3 text-primary hover:bg-primary/[0.08]',
  elevated: `bg-surface-container-low text-primary shadow-m3-1 hover:shadow-m3-2 ${LAYER}`,
}

type Props = ComponentProps<'button'> & { variant?: Variant }

export default function Button({ variant = 'filled', className = '', ...props }: Props) {
  return <button className={`${BASE} ${VARIANTS[variant]} ${className}`} {...props} />
}
```

使い分け：filled＝最重要の単一アクション / tonal＝2番目に重要 / elevated＝背景と分離したい時 / outlined＝中程度 / text＝低優先（ダイアログの補助アクション等）。

## FAB

主要アクションの浮遊ボタン。standard は 56px・`rounded-m3-lg`・`shadow-m3-2`、色は `primary-container`/`on-primary-container` が既定。アイコンボタンなので必ず `aria-label`。

```tsx
export function Fab({ label, children, ...props }: { label: string } & ComponentProps<'button'>) {
  return (
    <button
      aria-label={label}
      className="inline-flex items-center justify-center size-14 rounded-m3-lg
                 bg-primary-container text-on-primary-container shadow-m3-2
                 hover:shadow-m3-3 transition-shadow focus-visible:outline-none
                 focus-visible:ring-2 focus-visible:ring-primary cursor-pointer"
      {...props}
    >
      {children}
    </button>
  )
}
```

## カード

3種：elevated（影で分離）/ filled（塗りで分離）/ outlined（線で分離）。角丸 `m3-md`。

```tsx
const CARD: Record<'elevated' | 'filled' | 'outlined', string> = {
  elevated: 'bg-surface-container-low shadow-m3-1',
  filled: 'bg-surface-container-highest',
  outlined: 'bg-surface border border-outline-variant',
}

export function Card({
  variant = 'elevated', className = '', ...props
}: { variant?: keyof typeof CARD } & ComponentProps<'div'>) {
  return <div className={`rounded-m3-md text-on-surface ${CARD[variant]} ${className}`} {...props} />
}
```

クリック可能なカードにする場合は `<Link>` でラップし、ホバーで `shadow-m3-2`＋ステートレイヤーを付ける。

## テキストフィールド

filled と outlined。ラベルは浮上（floating label）が M3 らしいが、まずは静的ラベル版から。入力欄の当たり判定 56px。

```tsx
// filled 版（下線＋塗り）
export function TextField({ label, id, ...props }: { label: string; id: string } & ComponentProps<'input'>) {
  return (
    <div className="flex flex-col gap-1">
      <label htmlFor={id} className="text-body-small text-on-surface-variant px-4">
        {label}
      </label>
      <input
        id={id}
        className="h-14 rounded-t-m3-xs bg-surface-container-highest px-4 text-body-large
                   text-on-surface border-b-2 border-on-surface-variant
                   focus:border-primary focus:outline-none
                   placeholder:text-on-surface-variant/60"
        {...props}
      />
    </div>
  )
}
```

outlined 版は `border border-outline rounded-m3-xs focus:border-2 focus:border-primary`、背景は透明。

## チップ

assist / filter / input / suggestion。高さ 32px・`rounded-m3-sm`・`label-large`。選択状態は `secondary-container`。

```tsx
export function Chip({ selected = false, ...props }: { selected?: boolean } & ComponentProps<'button'>) {
  return (
    <button
      aria-pressed={selected}
      className={`inline-flex items-center gap-2 h-8 px-4 rounded-m3-sm text-label-large
                  border transition-colors focus-visible:outline-none focus-visible:ring-2
                  focus-visible:ring-primary cursor-pointer ${
        selected
          ? 'bg-secondary-container text-on-secondary-container border-transparent'
          : 'bg-surface text-on-surface-variant border-outline hover:bg-on-surface/[0.08]'
      }`}
      {...props}
    />
  )
}
```

## ナビゲーションバー

画面下部の主ナビ（モバイル）。各項目はアイコン＋ラベル、選択中はアイコン背後に `secondary-container` のピル。高さ 80px。

```tsx
// 選択項目のインジケータ：アイコンを span で囲み、選択時に pill 背景
<nav className="flex h-20 items-center justify-around bg-surface-container text-on-surface-variant">
  {items.map((it) => (
    <Link key={it.href} href={it.href} className="flex flex-col items-center gap-1 flex-1 py-3">
      <span className={`flex items-center justify-center h-8 w-16 rounded-full ${
        it.active ? 'bg-secondary-container text-on-secondary-container' : ''
      }`}>
        {it.icon}
      </span>
      <span className={`text-label-medium ${it.active ? 'text-on-surface font-medium' : ''}`}>
        {it.label}
      </span>
    </Link>
  ))}
</nav>
```

## トップアプリバー

高さ 64px、`surface` 背景、タイトルは `title-large`。スクロールで `surface-container` に色が付く（`on-scroll`）挙動は任意。

```tsx
<header className="flex h-16 items-center gap-4 bg-surface px-4 text-on-surface">
  <button aria-label="メニュー" className="grid size-12 place-items-center rounded-full hover:bg-on-surface/[0.08]">
    {/* menu icon */}
  </button>
  <h1 className="text-title-large">画面タイトル</h1>
</header>
```

## ダイアログ

角丸 `m3-xl`、`surface-container-high`、`shadow-m3-3`、最大幅 560px。見出し `headline-small`、本文 `body-medium`、アクションは text ボタンを右下に。背後に `scrim`（黒 32%）。

```tsx
// scrim + 中央のダイアログ（開閉は 'use client' 側で制御）
<div className="fixed inset-0 z-50 grid place-items-center bg-scrim/32 p-4">
  <div role="dialog" aria-modal="true" aria-labelledby="dlg-title"
       className="w-full max-w-[560px] rounded-m3-xl bg-surface-container-high text-on-surface shadow-m3-3 p-6">
    <h2 id="dlg-title" className="text-headline-small mb-4">タイトル</h2>
    <p className="text-body-medium text-on-surface-variant">本文…</p>
    <div className="mt-6 flex justify-end gap-2">
      <Button variant="text">キャンセル</Button>
      <Button variant="text">OK</Button>
    </div>
  </div>
</div>
```

## ステートレイヤーの実装

M3 の「前景色を 8/10/10% 重ねる」を Tailwind で表す2通り。**どちらを使うかは背景が塗られているかで決まる**——これを間違えると塗りが消える。

1. **簡易（不透明度ユーティリティ）** — 背景が**透明**な要素（text / outlined ボタン、リスト項目、アイコンボタン）専用。
   `hover:bg-on-surface/[0.08] focus-visible:bg-on-surface/[0.10] active:bg-on-surface/[0.10]`
   （`surface` 面上なら `on-surface` を、`primary` 面上なら `on-primary` を重ねる）
   ⚠️ **塗りのある要素（filled/tonal/FAB/elevated）にこれを使わない**。`bg-primary` の上に `hover:bg-on-primary/[0.08]` を書くと、ホバー時に背景が「on-primary 8% の半透明」に**置き換わり**、primary の塗りが消える。塗りのある要素は必ず次の疑似要素方式を使う。

2. **疑似要素オーバーレイ** — 塗りのある要素（filled/tonal/FAB/elevated など）、または元の背景を保ったまま重ねたい場合。
   ```
   relative overflow-hidden
   before:absolute before:inset-0 before:bg-current before:opacity-0
   before:transition-opacity hover:before:opacity-[0.08] active:before:opacity-[0.10]
   ```
   `before:bg-current` は文字色（＝前景 `on-*`）を継承するので、ボタンの `text-on-primary` などがそのままレイヤー色になる。

`prefers-reduced-motion` 環境ではトランジションが既存の `globals.css` で無効化される点に留意（余分な motion を足さない）。
</content>
