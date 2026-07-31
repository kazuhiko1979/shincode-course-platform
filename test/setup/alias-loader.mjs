// Resolve hook: maps the project's "@/" path alias (tsconfig paths "@/*" -> "./*")
// to real files so `node --test` can run .ts sources directly (type stripping).
// Tries the bare path, then .ts/.tsx, then /index.ts — mirroring bundler resolution.
import { existsSync } from 'node:fs'
import { fileURLToPath, pathToFileURL } from 'node:url'

const ROOT = new URL('../../', import.meta.url)

// next の package.json には exports が無く、素の ESM では拡張子無しサブパスを
// 解決できないため、テスト時のみ実ファイルへ写像する。
const BARE_SUBPATH_FIXES = new Map([['next/headers', 'next/headers.js']])

export async function resolve(specifier, context, nextResolve) {
  const fixed = BARE_SUBPATH_FIXES.get(specifier)
  if (fixed) return nextResolve(fixed, context)
  if (specifier.startsWith('@/')) {
    const base = fileURLToPath(new URL(specifier.slice(2), ROOT))
    for (const candidate of [base, `${base}.ts`, `${base}.tsx`, `${base}/index.ts`]) {
      if (existsSync(candidate)) {
        return nextResolve(pathToFileURL(candidate).href, context)
      }
    }
  }
  return nextResolve(specifier, context)
}
