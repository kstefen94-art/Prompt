// 내 PC에서 도는 ComfyUI(터널 공개 URL)를 호출해 생성합니다.
// 설정(URL·체크포인트)은 브라우저에 저장. SD/SDXL 계열 체크포인트 기준 기본 워크플로.

const KEY = 'comfy_settings'

export function loadComfy() {
  try {
    return { url: '', checkpoint: '', steps: 25, cfg: 7, ...JSON.parse(localStorage.getItem(KEY)) }
  } catch {
    return { url: '', checkpoint: '', steps: 25, cfg: 7 }
  }
}
export function saveComfy(s) {
  localStorage.setItem(KEY, JSON.stringify(s))
}

function txt2imgWorkflow({ checkpoint, prompt, negative, width, height, steps, cfg, batch }) {
  return {
    3: {
      class_type: 'KSampler',
      inputs: {
        seed: Math.floor(Math.random() * 1e15),
        steps: steps || 25,
        cfg: cfg || 7,
        sampler_name: 'euler',
        scheduler: 'normal',
        denoise: 1,
        model: ['4', 0],
        positive: ['6', 0],
        negative: ['7', 0],
        latent_image: ['5', 0],
      },
    },
    4: { class_type: 'CheckpointLoaderSimple', inputs: { ckpt_name: checkpoint } },
    5: { class_type: 'EmptyLatentImage', inputs: { width, height, batch_size: batch || 1 } },
    6: { class_type: 'CLIPTextEncode', inputs: { text: prompt, clip: ['4', 1] } },
    7: { class_type: 'CLIPTextEncode', inputs: { text: negative || '', clip: ['4', 1] } },
    8: { class_type: 'VAEDecode', inputs: { samples: ['3', 0], vae: ['4', 2] } },
    9: { class_type: 'SaveImage', inputs: { filename_prefix: 'site', images: ['8', 0] } },
  }
}

export async function comfyGenerate({ url, checkpoint, prompt, negative, width, height, numImages, steps, cfg }) {
  const base = url.replace(/\/$/, '')
  const wf = txt2imgWorkflow({ checkpoint, prompt, negative, width, height, steps, cfg, batch: numImages || 1 })

  const res = await fetch(`${base}/prompt`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ prompt: wf, client_id: crypto.randomUUID() }),
  })
  if (!res.ok) {
    const t = await res.text().catch(() => '')
    throw new Error(`ComfyUI 응답 오류 ${res.status} ${t.slice(0, 120)}`)
  }
  const { prompt_id } = await res.json()
  if (!prompt_id) throw new Error('ComfyUI가 prompt_id를 반환하지 않았습니다.')

  // /history 폴링
  let outputs
  for (let t = 0; t < 300; t++) {
    await new Promise((r) => setTimeout(r, 1000))
    const h = await fetch(`${base}/history/${prompt_id}`)
    if (!h.ok) continue
    const hj = await h.json()
    if (hj[prompt_id]?.outputs) {
      outputs = hj[prompt_id].outputs
      break
    }
  }
  if (!outputs) throw new Error('생성 시간 초과(또는 ComfyUI 미응답)')

  const images = []
  for (const nodeId in outputs) {
    for (const img of outputs[nodeId].images || []) {
      const q = new URLSearchParams({
        filename: img.filename,
        subfolder: img.subfolder || '',
        type: img.type || 'output',
      })
      images.push(`${base}/view?${q.toString()}`)
    }
  }
  if (!images.length) throw new Error('출력 이미지를 찾지 못했습니다.')
  return images
}
