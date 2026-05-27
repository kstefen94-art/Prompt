// Vercel 서버리스: fal z-image-trainer 큐 API 프록시 (LoRA 학습 제출/상태).
// FAL_KEY는 서버에서만 사용. 로그인 사용자만 호출 가능.

const FAL_QUEUE = 'https://queue.fal.run'
const TRAINER = 'fal-ai/z-image-trainer'
const SUPABASE_URL =
  process.env.VITE_SUPABASE_URL || 'https://ydszjxffswkqocpncvkn.supabase.co'
const SUPABASE_KEY =
  process.env.VITE_SUPABASE_ANON_KEY ||
  'sb_publishable_-w2GUQw5gMgEYQob2s3iDA_Tke1XZr1'

async function verifyUser(token) {
  if (!token) return false
  try {
    const r = await fetch(`${SUPABASE_URL}/auth/v1/user`, {
      headers: { Authorization: `Bearer ${token}`, apikey: SUPABASE_KEY },
    })
    return r.ok
  } catch {
    return false
  }
}

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'POST only' })
  const falKey = process.env.FAL_KEY
  if (!falKey) return res.status(500).json({ error: 'FAL_KEY가 설정되지 않았습니다.' })

  const auth = req.headers.authorization || ''
  const token = auth.startsWith('Bearer ') ? auth.slice(7) : ''
  if (!(await verifyUser(token))) return res.status(401).json({ error: '로그인이 필요합니다.' })

  const body = typeof req.body === 'string' ? JSON.parse(req.body || '{}') : req.body || {}
  const headers = { Authorization: `Key ${falKey}`, 'Content-Type': 'application/json' }

  try {
    if (body.action === 'submit') {
      const r = await fetch(`${FAL_QUEUE}/${TRAINER}`, {
        method: 'POST',
        headers,
        body: JSON.stringify({
          image_data_url: body.imageDataUrl,
          default_caption: body.defaultCaption || undefined,
          steps: body.steps || 1000,
        }),
      })
      const d = await r.json()
      if (!r.ok) return res.status(r.status).json({ error: d?.detail || d?.error || '학습 제출 실패' })
      return res.status(200).json({ request_id: d.request_id || d.requestId })
    }

    if (body.action === 'status') {
      const id = body.requestId
      const sr = await fetch(`${FAL_QUEUE}/${TRAINER}/requests/${id}/status`, { headers })
      const sd = await sr.json()
      if ((sd.status || '') !== 'COMPLETED') {
        return res.status(200).json({ status: sd.status || 'UNKNOWN' })
      }
      const rr = await fetch(`${FAL_QUEUE}/${TRAINER}/requests/${id}`, { headers })
      const rd = await rr.json()
      const loraUrl =
        rd.lora_url || rd.diffusers_lora_file?.url || rd.lora?.url || rd?.data?.lora_url
      return res.status(200).json({ status: 'COMPLETED', loraUrl })
    }

    return res.status(400).json({ error: '알 수 없는 action' })
  } catch (e) {
    return res.status(500).json({ error: e.message })
  }
}

export const config = { maxDuration: 60 }
