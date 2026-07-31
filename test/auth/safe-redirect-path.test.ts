// safeRedirectPath のオープンリダイレクト対策テスト。
// 期待値は lib/auth.ts の仕様（docstring）と AGENTS.md のセキュリティ基準
// 「`//`・バックスラッシュ・`javascript:` 等を排除」から導出した仕様駆動の値。
import { test } from 'node:test'
import assert from 'node:assert/strict'
import { safeRedirectPath } from '@/lib/auth'

test('サイト内の安全な相対パスはそのまま返す', () => {
  const safePaths = [
    '/',
    '/mypage',
    '/admin',
    '/courses/abc-123',
    '/search?q=next&sort=newest',
    '/courses/abc/videos/def#notes',
  ]
  for (const path of safePaths) {
    assert.equal(safeRedirectPath(path), path, `安全なパスが素通しされるべき: ${path}`)
  }
})

test('空・未指定は fallback を返す', () => {
  assert.equal(safeRedirectPath(null), null)
  assert.equal(safeRedirectPath(undefined), null)
  assert.equal(safeRedirectPath(''), null)
  assert.equal(safeRedirectPath(null, '/mypage'), '/mypage')
  assert.equal(safeRedirectPath(undefined, '/admin'), '/admin')
})

test('絶対 URL・スキーム付きは拒否して fallback', () => {
  const vectors = [
    'https://evil.example.com',
    'http://evil.example.com/phish',
    'javascript:alert(1)',
    'data:text/html;base64,xxx',
    'mailto:a@example.com',
  ]
  for (const v of vectors) {
    assert.equal(safeRedirectPath(v, '/mypage'), '/mypage', `拒否されるべき: ${v}`)
  }
})

test('プロトコル相対 URL（//）は拒否して fallback', () => {
  const vectors = ['//evil.example.com', '//evil.example.com/path', '////evil']
  for (const v of vectors) {
    assert.equal(safeRedirectPath(v, '/mypage'), '/mypage', `拒否されるべき: ${v}`)
  }
})

test('バックスラッシュを含むパスは拒否して fallback', () => {
  const vectors = ['/\\evil.example.com', '\\\\evil', '/mypage\\..\\admin']
  for (const v of vectors) {
    assert.equal(safeRedirectPath(v, '/mypage'), '/mypage', `拒否されるべき: ${v}`)
  }
})

test('制御文字・空白を含むパスは拒否して fallback', () => {
  const vectors = ['/my page', '/mypage\t', '/mypage\n', '/mypage\r\n', '/\x00admin', '/a\x1fb']
  for (const v of vectors) {
    assert.equal(safeRedirectPath(v, '/mypage'), '/mypage', `拒否されるべき: ${JSON.stringify(v)}`)
  }
})

test('fallback 未指定時の既定は null', () => {
  assert.equal(safeRedirectPath('//evil.example.com'), null)
  assert.equal(safeRedirectPath('https://evil.example.com'), null)
})
