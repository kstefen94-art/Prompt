// Vercel 서버리스 함수: fal.ai 이미지 생성 프록시.
// FAL_KEY(비밀)는 Vercel 환경변수에 넣으세요. 클라이언트엔 노출되지 않습니다.
// 로그인한 Supabase 사용자만 호출할 수 있도록 토큰을 검증합니다(크레딧 도용 방지).

const FAL_BASE = 'https://fal.run'
const SUPABASE_URL =
  process.env.VITE_SUPABASE_URL || 'https://ydszjxffswkqocpncvkn.supabase.co'
const SUPABASE_KEY =
  process.env.VITE_SUPABASE_ANON_KEY ||
  'sb_publishable_-w2GUQw5gMgEYQob2s3iDA_Tke1XZr1'

// 모델 슬러그/입력 스키마는 fal 모델 페이지 기준입니다.
// 슬러그가 맞지 않으면(예: 404) 아래 id 값만 바꾸면 됩니다.

// Txt→Img: body.model 로 선택 (기본 zimage)
const TXT_MODELS = {
  zimage: {
    id: 'fal-ai/z-image/turbo',
    build: (p) => ({
      prompt: p.prompt,
      image_size: p.imageSize || 'square_hd',
      num_images: p.numImages || 1,
      negative_prompt: p.negativePrompt || undefined,
    }),
  },
  flux2: {
    id: 'fal-ai/flux-2-pro',
    build: (p) => ({
      prompt: p.prompt,
      image_size: p.imageSize || 'square_hd',
      num_images: p.numImages || 1,
    }),
  },
  seedream: {
    id: 'fal-ai/bytedance/seedream/v5/lite/text-to-image',
    build: (p) => ({
      prompt: p.prompt,
      image_size: p.imageSize || 'square_hd',
      num_images: p.numImages || 1,
    }),
  },
  'zimage-lora': {
    id: 'fal-ai/z-image/turbo/lora',
    build: (p) => ({
      prompt: p.prompt,
      image_size: p.imageSize || 'square_hd',
      num_images: p.numImages || 1,
      loras: p.loraUrl ? [{ path: p.loraUrl, scale: 1 }] : [],
    }),
  },
}

// Img→Img: body.model 로 선택 (기본 kontext)
const IMG_MODELS = {
  kontext: {
    id: 'fal-ai/flux-pro/kontext/max/multi',
    build: (p) => ({ prompt: p.prompt, image_urls: p.imageUrls, num_images: p.numImages || 1 }),
  },
  'seedream-edit': {
    id: 'fal-ai/bytedance/seedream/v4.5/edit',
    build: (p) => ({ prompt: p.prompt, image_urls: p.imageUrls, num_images: p.numImages || 1 }),
  },
}

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
  if (!falKey) {
    return res
      .status(500)
      .json({ error: 'FAL_KEY가 설정되지 않았습니다. Vercel 환경변수에 FAL_KEY를 추가하세요.' })
  }

  const authHeader = req.headers.authorization || ''
  const token = authHeader.startsWith('Bearer ') ? authHeader.slice(7) : ''
  if (!(await verifyUser(token))) {
    return res.status(401).json({ error: '로그인이 필요합니다.' })
  }

  const body = typeof req.body === 'string' ? JSON.parse(req.body || '{}') : req.body || {}
  const model =
    body.mode === 'img2img'
      ? IMG_MODELS[body.model] || IMG_MODELS.kontext
      : TXT_MODELS[body.model] || TXT_MODELS.zimage
  if (!body.prompt) return res.status(400).json({ error: '프롬프트가 필요합니다.' })
  if (body.mode === 'img2img' && !(body.imageUrls && body.imageUrls.length))
    return res.status(400).json({ error: '입력 이미지가 필요합니다.' })

  const input = model.build(body)
  Object.keys(input).forEach((k) => input[k] === undefined && delete input[k])

  try {
    const r = await fetch(`${FAL_BASE}/${model.id}`, {
      method: 'POST',
      headers: { Authorization: `Key ${falKey}`, 'Content-Type': 'application/json' },
      body: JSON.stringify(input),
    })
    const data = await r.json()
    if (!r.ok) {
      const msg = data?.detail || data?.error || `fal 오류 (HTTP ${r.status})`
      return res.status(r.status).json({ error: typeof msg === 'string' ? msg : JSON.stringify(msg) })
    }
    const images = (data.images || (data.image ? [data.image] : [])).map((im) =>
      typeof im === 'string' ? im : im.url,
    )
    return res.status(200).json({ images })
  } catch (e) {
    return res.status(500).json({ error: e.message })
  }
}

export const config = { maxDuration: 60 }
