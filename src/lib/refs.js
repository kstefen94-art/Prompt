// 자주 쓰는 레퍼런스 이미지를 Supabase 스토리지에 저장해 기기 간 공유/재사용합니다.
// gallery 버킷의 refs/<userId>/ 폴더에 보관합니다.
import { supabase, BUCKET } from './supabase.js'

const FOLDER = 'refs'

export async function listRefs(userId) {
  const { data, error } = await supabase.storage
    .from(BUCKET)
    .list(`${FOLDER}/${userId}`, { limit: 100, sortBy: { column: 'created_at', order: 'desc' } })
  if (error) throw error
  return (data || [])
    .filter((f) => f.name && !f.name.startsWith('.'))
    .map((f) => {
      const path = `${FOLDER}/${userId}/${f.name}`
      return { id: path, path, url: supabase.storage.from(BUCKET).getPublicUrl(path).data.publicUrl }
    })
}

export async function addRef(file, userId) {
  const ext = (file.name.split('.').pop() || 'png').toLowerCase()
  const path = `${FOLDER}/${userId}/${crypto.randomUUID()}.${ext}`
  const { error } = await supabase.storage.from(BUCKET).upload(path, file)
  if (error) throw error
}

export async function deleteRef(path) {
  const { error } = await supabase.storage.from(BUCKET).remove([path])
  if (error) throw error
}
