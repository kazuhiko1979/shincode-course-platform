'use client'

import { useEffect, useId, useRef, useState } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { suggestCourses } from '@/app/search/actions'
import type { CourseSuggestion } from '@/lib/courses'

/**
 * Udemy 風のオートサジェスト検索バー。
 * - 入力をデバウンス（200ms）して最小 2 文字から候補取得（Server Action）
 * - 候補は最大 8 件・スクロールなし、キーボード操作（↑↓ / Enter / Esc）対応
 * - 一致部分をハイライト、候補クリックでそのコースへ、Enter / 虫眼鏡で検索結果ページへ
 * - ARIA combobox パターン
 */
export default function SearchBar() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [value, setValue] = useState(searchParams.get('q') ?? '')
  const [suggestions, setSuggestions] = useState<CourseSuggestion[]>([])
  const [open, setOpen] = useState(false)
  const [activeIndex, setActiveIndex] = useState(-1)
  const containerRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLInputElement>(null)
  const listboxId = useId()

  // デバウンスして候補取得。最新リクエストのみ反映（古いレスポンスは破棄）。
  // setState は同期実行を避け、タイマーコールバック内でのみ呼ぶ。
  useEffect(() => {
    const q = value.trim()
    let cancelled = false
    const t = setTimeout(async () => {
      if (cancelled) return
      if (q.length < 2) {
        setSuggestions([])
        return
      }
      const results = await suggestCourses(q)
      if (!cancelled) {
        setSuggestions(results)
        setActiveIndex(-1)
        setOpen(true)
      }
    }, 200)
    return () => {
      cancelled = true
      clearTimeout(t)
    }
  }, [value])

  // 外側クリックで閉じる
  useEffect(() => {
    function onClick(e: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setOpen(false)
      }
    }
    document.addEventListener('mousedown', onClick)
    return () => document.removeEventListener('mousedown', onClick)
  }, [])

  function goToSearch(q: string) {
    const trimmed = q.trim()
    setOpen(false)
    router.push(trimmed ? `/search?q=${encodeURIComponent(trimmed)}` : '/')
  }

  function goToCourse(id: string) {
    setOpen(false)
    router.push(`/courses/${id}`)
  }

  // 入力欄を空にする（遷移はしない）。サジェストを閉じて入力にフォーカスを戻す。
  function clearSearch() {
    setValue('')
    setSuggestions([])
    setActiveIndex(-1)
    setOpen(false)
    inputRef.current?.focus()
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    // 候補をキーボードで選択中ならそのコースへ、そうでなければ検索結果ページへ
    if (activeIndex >= 0 && suggestions[activeIndex]) {
      goToCourse(suggestions[activeIndex].id)
    } else {
      goToSearch(value)
    }
  }

  function handleKeyDown(e: React.KeyboardEvent) {
    if (!open || suggestions.length === 0) {
      if (e.key === 'ArrowDown' && suggestions.length > 0) setOpen(true)
      return
    }
    if (e.key === 'ArrowDown') {
      e.preventDefault()
      setActiveIndex((i) => (i + 1) % suggestions.length)
    } else if (e.key === 'ArrowUp') {
      e.preventDefault()
      setActiveIndex((i) => (i <= 0 ? suggestions.length - 1 : i - 1))
    } else if (e.key === 'Escape') {
      setOpen(false)
      setActiveIndex(-1)
    }
  }

  const showList = open && value.trim().length >= 2

  return (
    <div ref={containerRef} className="relative w-full">
      <form onSubmit={handleSubmit} role="search">
        <div
          role="combobox"
          aria-expanded={showList}
          aria-haspopup="listbox"
          aria-controls={listboxId}
          aria-owns={listboxId}
          className="flex items-center w-full h-11 rounded-full border border-[#1c1d1f] bg-[#f7f9fa] px-4 gap-3 focus-within:border-[#a435f0] transition-colors"
        >
          <button type="submit" aria-label="検索" className="shrink-0 text-[#1c1d1f]">
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" d="m21 21-5.197-5.197m0 0A7.5 7.5 0 1 0 5.196 5.196a7.5 7.5 0 0 0 10.607 10.607Z" />
            </svg>
          </button>
          <input
            ref={inputRef}
            type="search"
            name="q"
            value={value}
            onChange={(e) => setValue(e.target.value)}
            onFocus={() => value.trim().length >= 2 && setOpen(true)}
            onKeyDown={handleKeyDown}
            placeholder="学びたいことを検索"
            autoComplete="off"
            aria-autocomplete="list"
            aria-controls={listboxId}
            aria-activedescendant={activeIndex >= 0 ? `${listboxId}-opt-${activeIndex}` : undefined}
            className="flex-1 bg-transparent outline-none text-sm text-[#1c1d1f] placeholder:text-[#6a6f73] [&::-webkit-search-cancel-button]:appearance-none"
          />
          {value.length > 0 && (
            <button
              type="button"
              aria-label="検索をクリア"
              onClick={clearSearch}
              className="shrink-0 flex items-center justify-center w-5 h-5 rounded-full text-[#6a6f73] hover:bg-[#e3e6e8] hover:text-[#1c1d1f] transition-colors"
            >
              <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" d="M6 18 18 6M6 6l12 12" />
              </svg>
            </button>
          )}
        </div>
      </form>

      {showList && (
        <ul
          id={listboxId}
          role="listbox"
          className="absolute left-0 right-0 top-full mt-2 bg-white border border-[#d1d7dc] rounded-lg shadow-[0_4px_20px_rgba(0,0,0,0.12)] overflow-hidden z-50"
        >
          {/* 先頭：このキーワードで検索 */}
          <li
            role="option"
            aria-selected={activeIndex === -1}
            onMouseDown={(e) => {
              e.preventDefault()
              goToSearch(value)
            }}
            onMouseEnter={() => setActiveIndex(-1)}
            className={`flex items-center gap-3 px-4 py-2.5 cursor-pointer ${
              activeIndex === -1 ? 'bg-[#f7f9fa]' : ''
            }`}
          >
            <svg className="w-4 h-4 shrink-0 text-[#6a6f73]" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" d="m21 21-5.197-5.197m0 0A7.5 7.5 0 1 0 5.196 5.196a7.5 7.5 0 0 0 10.607 10.607Z" />
            </svg>
            <span className="text-sm text-[#1c1d1f]">
              「<span className="font-bold">{value.trim()}</span>」で検索
            </span>
          </li>

          {suggestions.length > 0 && <li role="presentation" className="border-t border-[#f0f1f3]" />}

          {suggestions.map((s, i) => (
            <li
              key={s.id}
              id={`${listboxId}-opt-${i}`}
              role="option"
              aria-selected={activeIndex === i}
              onMouseDown={(e) => {
                e.preventDefault()
                goToCourse(s.id)
              }}
              onMouseEnter={() => setActiveIndex(i)}
              className={`flex items-center gap-3 px-4 py-2.5 cursor-pointer ${
                activeIndex === i ? 'bg-[#f7f9fa]' : ''
              }`}
            >
              <svg className="w-4 h-4 shrink-0 text-[#a435f0]" fill="currentColor" viewBox="0 0 24 24">
                <path d="M8 5v14l11-7z" />
              </svg>
              <span className="text-sm text-[#1c1d1f] truncate">{highlight(s.title, value.trim())}</span>
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}

/** タイトル中の一致部分を太字でハイライトする。 */
function highlight(title: string, query: string) {
  if (!query) return title
  const idx = title.toLowerCase().indexOf(query.toLowerCase())
  if (idx === -1) return title
  return (
    <>
      {title.slice(0, idx)}
      <span className="font-bold text-[#5022c3]">{title.slice(idx, idx + query.length)}</span>
      {title.slice(idx + query.length)}
    </>
  )
}
