import { createClient } from '@supabase/supabase-js'

// 이 두 값은 Vercel(또는 .env)의 환경변수로 주입됩니다.
// VITE_SUPABASE_URL, VITE_SUPABASE_ANON_KEY
// anon 키는 공개되어도 안전한 키입니다(보안은 Supabase RLS 정책으로 처리).
const url = import.meta.env.VITE_SUPABASE_URL
const key = import.meta.env.VITE_SUPABASE_ANON_KEY

export const supabaseEnabled = Boolean(url && key)
export const supabase = supabaseEnabled ? createClient(url, key) : null
export const BUCKET = 'gallery'

export function publicUrl(path) {
  if (!supabase) return path
  return supabase.storage.from(BUCKET).getPublicUrl(path).data.publicUrl
}
