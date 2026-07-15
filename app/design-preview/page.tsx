import type { ComponentProps } from 'react'
import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Material 3 プレビュー',
}

// ── ステートレイヤー：塗りのある要素は前景色(bg-current)を疑似要素で薄く重ねる ──
const LAYER =
  'relative overflow-hidden before:absolute before:inset-0 before:bg-current ' +
  'before:opacity-0 before:transition-opacity hover:before:opacity-[0.08] active:before:opacity-[0.10]'

const BTN_BASE =
  'inline-flex items-center justify-center gap-2 h-10 min-h-12 px-6 rounded-full ' +
  'text-label-large font-medium tracking-[0.1px] transition-shadow ' +
  'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary cursor-pointer ' +
  'disabled:opacity-40 disabled:pointer-events-none'

const BTN_VARIANTS = {
  filled: `bg-primary text-on-primary hover:shadow-m3-1 ${LAYER}`,
  tonal: `bg-secondary-container text-on-secondary-container hover:shadow-m3-1 ${LAYER}`,
  elevated: `bg-surface-container-low text-primary shadow-m3-1 hover:shadow-m3-2 ${LAYER}`,
  outlined: 'border border-outline text-primary hover:bg-primary/[0.08]',
  text: 'px-3 text-primary hover:bg-primary/[0.08]',
} as const

function Button({
  variant = 'filled',
  className = '',
  ...props
}: { variant?: keyof typeof BTN_VARIANTS } & ComponentProps<'button'>) {
  return <button className={`${BTN_BASE} ${BTN_VARIANTS[variant]} ${className}`} {...props} />
}

const CARD_VARIANTS = {
  elevated: 'bg-surface-container-low shadow-m3-1',
  filled: 'bg-surface-container-highest',
  outlined: 'bg-surface border border-outline-variant',
} as const

function Card({
  variant = 'elevated',
  className = '',
  ...props
}: { variant?: keyof typeof CARD_VARIANTS } & ComponentProps<'div'>) {
  return (
    <div className={`rounded-m3-md text-on-surface p-5 ${CARD_VARIANTS[variant]} ${className}`} {...props} />
  )
}

const FIELD_INPUT =
  'h-14 w-full rounded-t-m3-xs bg-surface-container-highest px-4 text-body-large ' +
  'text-on-surface border-b-2 border-on-surface-variant transition-colors ' +
  'focus:border-primary focus:outline-none placeholder:text-on-surface-variant/60'

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="flex flex-col gap-4">
      <h2 className="text-title-large text-on-surface">{title}</h2>
      <div className="flex flex-wrap items-start gap-4">{children}</div>
    </section>
  )
}

export default function DesignPreviewPage() {
  return (
    <main className="min-h-screen bg-surface text-on-surface">
      <div className="mx-auto flex max-w-4xl flex-col gap-12 px-6 py-12">
        <header className="flex flex-col gap-2">
          <h1 className="text-headline-medium">Material 3 プレビュー</h1>
          <p className="text-body-medium text-on-surface-variant">
            material-design スキルのトークンとコンポーネントの見本。OS のダークモード設定で配色が切り替わります。
          </p>
        </header>

        <Section title="ボタン">
          <Button variant="filled">Filled</Button>
          <Button variant="tonal">Tonal</Button>
          <Button variant="elevated">Elevated</Button>
          <Button variant="outlined">Outlined</Button>
          <Button variant="text">Text</Button>
          <Button variant="filled" disabled>
            Disabled
          </Button>
        </Section>

        <Section title="カード">
          <Card variant="elevated" className="w-56">
            <h3 className="text-title-medium">Elevated</h3>
            <p className="mt-1 text-body-medium text-on-surface-variant">影で背景から分離するカード。</p>
          </Card>
          <Card variant="filled" className="w-56">
            <h3 className="text-title-medium">Filled</h3>
            <p className="mt-1 text-body-medium text-on-surface-variant">塗りで分離するカード。</p>
          </Card>
          <Card variant="outlined" className="w-56">
            <h3 className="text-title-medium">Outlined</h3>
            <p className="mt-1 text-body-medium text-on-surface-variant">線で分離するカード。</p>
          </Card>
        </Section>

        <Section title="テキストフィールド（filled）">
          <div className="flex w-full max-w-sm flex-col gap-1">
            <label htmlFor="preview-email" className="px-4 text-body-small text-on-surface-variant">
              メールアドレス
            </label>
            <input id="preview-email" type="email" placeholder="you@example.com" className={FIELD_INPUT} />
          </div>
        </Section>

        <Section title="カラーロール（面と on-* のペア）">
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
            <div className="rounded-m3-sm bg-primary p-4 text-on-primary text-label-large">Primary</div>
            <div className="rounded-m3-sm bg-primary-container p-4 text-on-primary-container text-label-large">
              Primary Container
            </div>
            <div className="rounded-m3-sm bg-secondary-container p-4 text-on-secondary-container text-label-large">
              Secondary Container
            </div>
            <div className="rounded-m3-sm bg-tertiary-container p-4 text-on-tertiary-container text-label-large">
              Tertiary Container
            </div>
            <div className="rounded-m3-sm bg-error p-4 text-on-error text-label-large">Error</div>
            <div className="rounded-m3-sm bg-surface-variant p-4 text-on-surface-variant text-label-large">
              Surface Variant
            </div>
            <div className="rounded-m3-sm border border-outline bg-surface p-4 text-on-surface text-label-large">
              Surface
            </div>
            <div className="rounded-m3-sm bg-surface-container-highest p-4 text-on-surface text-label-large">
              Container Highest
            </div>
          </div>
        </Section>
      </div>
    </main>
  )
}
