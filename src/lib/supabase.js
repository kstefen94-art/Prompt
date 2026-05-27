import { createClient } from '@supabase/supabase-js'

// publishable 키는 공개되어도 안전한 키입니다(보안은 Supabase RLS 정책으로 처리).
// 환경변수(VITE_SUPABASE_URL / VITE_SUPABASE_ANON_KEY)가 있으면 그 값을 우선 사용하고,
// 없으면 아래 기본값을 씁니다. 프로젝트를 바꾸려면 이 두 값만 교체하세요.
const url = import.meta.env.VITE_SUPABASE_URL || 'https://ydszjxffswkqocpncvkn.supabase.co'
const key =
  import.meta.env.VITE_SUPABASE_ANON_KEY ||
  'sb_publishable_-w2GUQw5gMgEYQob2s3iDA_Tke1XZr1'

export const supabaseEnabled = Boolean(url && key)
export const supabase = supabaseEnabled ? createClient(url, key) : null
export const BUCKET = 'gallery'

export function publicUrl(path) {
  if (!supabase) return path
  return supabase.storage.from(BUCKET).getPublicUrl(path).data.publicUrl
}
