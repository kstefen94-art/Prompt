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
  if (params.mode === 'face' && params.faceFile)
    payload.faceImageUrl = await uploadInput(params.faceFile, userId)

  const res = await fetch('/api/generate', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
    body: JSON.stringify(payload),
  })
  const data = await res.json()
  if (!res.ok) throw new Error(data.error || '생성에 실패했습니다.')
  return data.images || []
}

export async function saveGeneratedWork({ title, categories, templateId, prompt, imageUrls }) {
  const {
    data: { user },
  } = await supabase.auth.getUser()
  const media = []
  for (const url of imageUrls) {
    const resp = await fetch(url)
    const blob = await resp.blob()
    const ext = (blob.type.split('/')[1] || 'png').split('+')[0]
    const path = `${user.id}/${crypto.randomUUID()}.${ext}`
    const { error } = await supabase.storage
      .from(BUCKET)
      .upload(path, blob, { contentType: blob.type })
    if (error) throw error
    media.push({ type: blob.type.startsWith('video') ? 'video' : 'image', path })
  }
  const { error } = await supabase
    .from('works')
    .insert({ title, categories, template_id: templateId || null, prompt, media })
  if (error) throw error
}
