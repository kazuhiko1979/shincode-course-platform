import { z } from 'zod'
import { extractYouTubeId } from '@/lib/youtube'

/** FormData の値を文字列として安全に取り出す（File / null は空文字に）。 */
export function formString(formData: FormData, key: string): string {
  const v = formData.get(key)
  return typeof v === 'string' ? v : ''
}

/** ZodError から最初のメッセージを取り出す（無ければ汎用文言）。 */
export function firstError(error: z.ZodError): string {
  return error.issues[0]?.message ?? '入力内容を確認してください'
}

/** UUID（コース/動画/ユーザー ID）。 */
export const uuidSchema = z.uuid()

/** ユーザー権限。 */
export const roleSchema = z.enum(['user', 'admin'])

/** 検索キーワード（長さを上限で制限し、キャッシュ肥大・濫用を防ぐ）。 */
export const searchQuerySchema = z.string().trim().max(100)

/** 表示順。数値以外・範囲外は 0 にフォールバック。 */
const orderField = z.coerce.number().int().min(0).max(1_000_000).catch(0)

/** 任意テキスト（トリム後、空なら null）。 */
const optionalText = (max: number, label: string) =>
  z
    .string()
    .trim()
    .max(max, `${label}は${max}文字以内で入力してください`)
    .transform((v) => (v.length > 0 ? v : null))

/** コース作成・編集フォーム。 */
export const courseFormSchema = z.object({
  title: z.string().trim().min(1, 'タイトルは必須です').max(200, 'タイトルは200文字以内で入力してください'),
  description: optionalText(5000, '説明'),
  thumbnail_url: z
    .string()
    .trim()
    .max(2000, 'サムネイル URL が長すぎます')
    .refine(
      (v) => v === '' || /^https:\/\/[^\s]+$/i.test(v),
      'サムネイル URL は https:// から始まる有効な URL を入力してください'
    )
    .transform((v) => (v.length > 0 ? v : null)),
  order: orderField,
})
export type CourseInput = z.infer<typeof courseFormSchema>

/** 動画作成・編集フォーム。 */
export const videoFormSchema = z.object({
  title: z.string().trim().min(1, 'タイトルは必須です').max(200, 'タイトルは200文字以内で入力してください'),
  description: optionalText(5000, '説明'),
  youtube_url: z
    .string()
    .trim()
    .min(1, 'YouTube URL は必須です')
    .refine((v) => extractYouTubeId(v) !== null, '有効な YouTube URL を入力してください'),
  order: orderField,
})
export type VideoInput = z.infer<typeof videoFormSchema>
