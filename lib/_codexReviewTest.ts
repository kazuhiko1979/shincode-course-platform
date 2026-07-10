// Codex 自動レビュー動作確認用の一時ファイル（マージしない）
// あえて規約違反を含める: any 使用 / console.log / import type 未使用など

export function sumValues(items: any[]) {
  let total = 0
  for (let i = 0; i < items.length; i++) {
    total += items[i].value
  }
  console.log('total =', total)
  return total
}