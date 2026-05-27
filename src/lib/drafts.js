// 임시저장(드래프트)을 Supabase(서버)에 보관 → 기기 간 유지.
// 미디어는 gallery 버킷의 drafts/<userId>/ 폴더, 메타는 drafts 테이블.
import { supabase, BUCKET, publicUrl } from './supabase.js'

// mediaBlobs: [{ type, blob }]
export async function addDraft({ title, categories, tools, templateId, prompt, mediaBlobs }, userId) {
  const media = []
  for (const m of mediaBlobs) {
    const ext = (m.blob.type.split('/')[1] || 'png').split('+')[0]
    const path = `drafts/${userId}/${crypto.randomUUID()}.${ext}`
    const { error } = await supabase.storage
      .from(BUCKET)
      .upload(path, m.blob, { contentType: m.blob.type })
    if (error) throw error
    media.push({ type: m.type, path })
  }
  const { error } = await supabase.from('drafts').insert({
    title,
    categories: categories || [],
    tools: tools || [],
    template_id: templateId || null,
    prompt: prompt || '',
    media,
  })
  if (error) throw error
}

export async function listDrafts() {
  const { data, error } = await supabase
    .from('drafts')
    .select('*')
    .order('created_at', { ascending: false })
  if (error) throw error
  return (data || []).map((d) => ({
    id: d.id,
    title: d.title,
    categories: d.categories || [],
    tools: d.tools || [],
    templateId: d.template_id,
    prompt: d.prompt || '',
    media: (d.media || []).map((m) => ({ type: m.type, src: publicUrl(m.path) })),
    _paths: (d.media || []).map((m) => m.path),
  }))
}

export async function deleteDraft(draft) {
  if (draft._paths?.length) {
    await supabase.storage.from(BUCKET).remove(draft._paths)
  }
  const { error } = await supabase.from('drafts').delete().eq('id', draft.id)
  if (error) throw error
}

// 발행: 같은 스토리지 경로를 그대로 works에 옮기고 draft 행만 삭제(파일 유지)
export async function publishDraft(draft) {
  const media = (draft._paths || []).map((path, i) => ({
    type: draft.media[i]?.type || 'image',
    path,
  }))
  const { error } = await supabase.from('works').insert({
    title: draft.title || '제목 없음',
    categories: draft.categories || [],
    tools: draft.tools || [],
    template_id: draft.templateId || null,
    prompt: draft.prompt || '',
    media,
  })
  if (error) throw error
  const { error: e2 } = await supabase.from('drafts').delete().eq('id', draft.id)
  if (e2) throw e2
}
