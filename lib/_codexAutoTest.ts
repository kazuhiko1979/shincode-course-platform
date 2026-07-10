// Codex 自動レビュー(オープン時)動作確認用の一時ファイル。マージしない。
// AGENTS.md の Review guidelines に反する要素をあえて含める:
//  - any 使用禁止に違反
//  - console.log 残し
//  - import type 未使用 / 相対パス等は無いが any/console が主眼

export function totalPrice(items: any[]) {
  let sum = 0
  for (let i = 0; i < items.length; i++) {
    sum += items[i].price
  }
  console.log('sum', sum)
  return sum
}