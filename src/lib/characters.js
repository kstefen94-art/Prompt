// 캐릭터 LoRA: 이미지로 학습 → lora_url을 characters 테이블에 저장 → 생성 시 적용.
import { supabase, BUCKET } from './supabase.js'

async function authToken() {
  const {
    data: { session },
  } = await supabase.auth.getSession()
  return session?.access_token
}

// 학습 이미지를 ~1024px JPEG로 축소 (업로드 용량 한도 회피 + 학습엔 충분)
async function downscaleImage(file, maxSide = 1024, quality = 0.9) {
  try {
    const bmp = await createImageBitmap(file)
    const scale = Math.min(1, maxSide / Math.max(bmp.width, bmp.height))
    const w = Math.round(bmp.width * scale)
    const h = Math.round(bmp.height * scale)
    const canvas = document.createElement('canvas')
    canvas.width = w
    canvas.height = h
    canvas.getContext('2d').drawImage(bmp, 0, 0, w, h)
    const blob = await new Promise((res) => canvas.toBlob(res, 'image/jpeg', quality))
    return blob || file
  } catch {
    return file // 변환 실패 시 원본 사용
  }
}

// files: File[], onStatus: (status) => void
export async function trainCharacter({ name, trigger, files, steps }, userId, onStatus) {
  // jszip은 학습할 때만 로드 (번들 최적화)
  const JSZip = (await import('jszip')).default
  const zip = new JSZip()
  onStatus?.('이미지 준비 중…')
  let i = 0
  for (const f of files) {
    const blob = await downscaleImage(f)
    zip.file(`img_${i++}.jpg`, blob)
  }
  const zipBlob = await zip.generateAsync({ type: 'blob', compression: 'DEFLATE' })
  const zipPath = `train/${userId}/${crypto.randomUUID()}.zip`
  const { error } = await supabase.storage
    .from(BUCKET)
    .upload(zipPath, zipBlob, { contentType: 'application/zip' })
  if (error) throw error
  const zipUrl = supabase.storage.from(BUCKET).getPublicUrl(zipPath).data.publicUrl

  const token = await authToken()
  const headers = { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` }
  const caption = trigger?.trim() || `${name} person`

  onStatus?.('제출 중…')
  const sub = await fetch('/api/train', {
    method: 'POST',
    headers,
    body: JSON.stringify({ action: 'submit', imageDataUrl: zipUrl, defaultCaption: caption, steps: steps || 1000 }),
  })
  const sd = await sub.json()
  if (!sub.ok) throw new Error(sd.error || '학습 제출 실패')
  const requestId = sd.request_id
  if (!requestId) throw new Error('학습 요청 ID를 받지 못했습니다.')

  // 폴링 (최대 ~10분)
  for (let t = 0; t < 120; t++) {
    await new Promise((r) => setTimeout(r, 5000))
    const st = await fetch('/api/train', {
      method: 'POST',
      headers,
      body: JSON.stringify({ action: 'status', requestId }),
    })
    const stj = await st.json()
    onStatus?.(stj.status === 'COMPLETED' ? '저장 중…' : `학습 중… (${stj.status})`)
    if (stj.status === 'COMPLETED') {
      if (!stj.loraUrl) throw new Error('학습은 끝났지만 LoRA URL을 받지 못했습니다.')
      const { error: e2 } = await supabase
        .from('characters')
        .insert({ name, trigger: caption, lora_url: stj.loraUrl })
      if (e2) throw e2
      return
    }
  }
  throw new Error('학습 시간 초과')
}

export async function listCharacters() {
  const { data, error } = await supabase
    .from('characters')
    .select('*')
    .order('created_at', { ascending: false })
  if (error) throw error
  return data || []
}

export async function deleteCharacter(id) {
  const { error } = await supabase.from('characters').delete().eq('id', id)
  if (error) throw error
}
