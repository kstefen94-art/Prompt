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
    model: params.model,
    prompt: params.prompt,
    negativePrompt: params.negativePrompt,
    imageSize: params.imageSize,
    numImages: params.numImages,
    loraUrl: params.loraUrl,
    loraScale: params.loraScale,
  }
  if (params.mode === 'img2img') {
    // 저장된 레퍼런스는 이미 공개 URL이라 그대로 사용, 1회용 업로드만 새로 올림
    const urls = [...(params.refImageUrls || [])]
    for (const f of params.inputFiles || []) {
      urls.push(await uploadInput(f, userId))
    }
    payload.imageUrls = urls
  }

  const res = await fetch('/api/generate', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
    body: JSON.stringify(payload),
  })
  const data = await res.json()
  if (!res.ok) throw new Error(data.error || '생성에 실패했습니다.')
  return data.images || []
}

