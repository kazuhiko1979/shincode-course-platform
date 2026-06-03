/**
 * YouTube の各種 URL 形式から動画 ID（11文字）を抽出する。
 * 対応: watch?v=ID / youtu.be/ID / embed/ID / shorts/ID / v/ID、生の ID。
 * 抽出できない場合は null。
 */
export function extractYouTubeId(url: string | null | undefined): string | null {
  if (!url) return null

  const patterns = [
    /[?&]v=([\w-]{11})/,
    /youtu\.be\/([\w-]{11})/,
    /\/embed\/([\w-]{11})/,
    /\/shorts\/([\w-]{11})/,
    /\/v\/([\w-]{11})/,
  ]

  for (const pattern of patterns) {
    const match = url.match(pattern)
    if (match) return match[1]
  }

  // すでに ID のみが渡された場合
  if (/^[\w-]{11}$/.test(url.trim())) return url.trim()

  return null
}

/** 埋め込み用の URL を返す。ID が抽出できなければ null。 */
export function getYouTubeEmbedUrl(url: string | null | undefined): string | null {
  const id = extractYouTubeId(url)
  return id ? `https://www.youtube.com/embed/${id}` : null
}
