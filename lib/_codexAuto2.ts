// Codex 自動レビュー(オープン時) 再確認用。マージしない。
// AGENTS.md 違反をあえて含む: any 使用 / console.log
export function calcTotal(rows: any[]) {
  let t = 0
  for (let i = 0; i < rows.length; i++) t += rows[i].amount
  console.log('t', t)
  return t
}