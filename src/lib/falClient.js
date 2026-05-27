import { supabase, BUCKET } from './supabase.js'

async function uploadInput(file, userId) {
  const ext = (file.name.split('.').pop() || 'png').toLowerCase()
  const path = `${userId}/_input/${crypto.randomUUID()}.${ext}`
  const { error } = await supabase.storage.from(BUCKET).upload(path, file)
  if (error) throw error
  return supabase.storage.from(BUCKET).getPublicUrl(path).data.publicUrl
}

export async function generate(params, userId) {
  const {
    data: { session },
  } = await supabase.auth.getSession()
  const token = session?.access_token

  const payload = {
    mode: params.mode,
    prompt: params.prompt,
    negativePrompt: params.negativePrompt,
    imageSize: params.imageSize,
    numImages: params.numImages,
    strength: params.strength,
  }
  if (params.mode === 'img2img' && params.inputFile)
    payload.imageUrl = await uploadInput(params.inputFile, userId)

  const res = await fetch('/api/generate', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
    body: JSON.stringify(payload),
  })
  const data = await res.json()
  if (!res.ok) throw new Error(data.error || '생성에 실패했습니다.')
  return data.images || []
}

// 임시저장(IndexedDB) 한 항목을 갤러리로 발행: blob들을 스토리지에 올리고 works에 삽입.
export async function publishDraft(draft) {
  const {
    data: { user },
  } = await supabase.auth.getUser()
  const media = []
  for (const m of draft.media) {
    const ext = (m.blob.type.split('/')[1] || 'png').split('+')[0]
    const path = `${user.id}/${crypto.randomUUID()}.${ext}`
    const { error } = await supabase.storage
      .from(BUCKET)
      .upload(path, m.blob, { contentType: m.blob.type })
    if (error) throw error
    media.push({ type: m.type, path })
  }
  const { error } = await supabase.from('works').insert({
    title: draft.title || '제목 없음',
    categories: draft.categories || [],
    tools: draft.tools || [],
    template_id: draft.templateId || null,
    prompt: draft.prompt || '',
    media,
  })
  if (error) throw error
}
