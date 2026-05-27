import { useEffect, useState } from 'react'
import { generate } from '../lib/falClient.js'
import { addDraft } from '../lib/drafts.js'
import { downloadUrl } from '../lib/download.js'

const MODES = [
  { id: 'txt2img', label: 'Txt → Img' },
  { id: 'img2img', label: 'Img → Img' },
]

const RATIOS = [
  { id: '1:1', label: '정사각 1:1', aw: 1, ah: 1 },
  { id: '3:4', label: '세로 3:4', aw: 3, ah: 4 },
  { id: '9:16', label: '세로 9:16', aw: 9, ah: 16 },
  { id: '4:3', label: '가로 4:3', aw: 4, ah: 3 },
  { id: '16:9', label: '가로 16:9', aw: 16, ah: 9 },
]

const QUALITIES = [
  { id: 'standard', label: '표준 (1K)', long: 1024 },
  { id: 'high', label: '고화질 (1.5K)', long: 1536 },
  { id: 'max', label: '최고 (2K)', long: 1792 },
]

// Txt→Img 모델 (perMp: 메가픽셀당 USD, flat: 장당 고정 USD)
const TXT_MODELS = [
  { id: 'zimage', label: 'Z-Image (저렴)', tool: 'fal Z-Image', perMp: 0.005 },
  { id: 'flux2', label: 'FLUX 2 Pro (고품질)', tool: 'FLUX 2 Pro', perMp: 0.03 },
  { id: 'seedream', label: 'Seedream 5 Lite (가성비)', tool: 'Seedream 5 Lite', flat: 0.03 },
]

function computeDims(ratioId, longSide) {
  const r = RATIOS.find((x) => x.id === ratioId) || RATIOS[0]
  const max = Math.max(r.aw, r.ah)
  const w = Math.round((longSide * (r.aw / max)) / 8) * 8
  const h = Math.round((longSide * (r.ah / max)) / 8) * 8
  return { width: w, height: h }
}

export default function Studio({ user, onGoProfile }) {
  const [mode, setMode] = useState('txt2img')
  const [prompt, setPrompt] = useState('')
  const [negative, setNegative] = useState('')
  const [ratio, setRatio] = useState('1:1')
  const [quality, setQuality] = useState('standard')
  const [selectedModels, setSelectedModels] = useState(['zimage'])
  const [numImages, setNumImages] = useState(1)
  // img2img 참조 이미지(여러 장): { id, file, url }
  const [refItems, setRefItems] = useState([])

  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')
  const [results, setResults] = useState([])

  // 생성 후 자동 임시저장
  const [title, setTitle] = useState('')
  const [saveMsg, setSaveMsg] = useState('')

  const longSide = (QUALITIES.find((q) => q.id === quality) || QUALITIES[0]).long
  const dims = computeDims(ratio, longSide)
  const mp = (dims.width * dims.height) / 1_000_000
  const selModels = TXT_MODELS.filter((m) => selectedModels.includes(m.id))
  const totalUsd =
    selModels.reduce((s, m) => s + (m.flat != null ? m.flat : mp * m.perMp), 0) * numImages
  const estWon = Math.round(totalUsd * 1350)

  function toggleModel(id) {
    setSelectedModels((prev) =>
      prev.includes(id)
        ? prev.length > 1
          ? prev.filter((x) => x !== id)
          : prev
        : [...prev, id],
    )
  }

  useEffect(() => {
    return () => refItems.forEach((it) => URL.revokeObjectURL(it.url))
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  function addRefs(e) {
    const picked = [...e.target.files]
    e.target.value = ''
    setRefItems((prev) => [
      ...prev,
      ...picked.map((file) => ({ id: crypto.randomUUID(), file, url: URL.createObjectURL(file) })),
    ])
  }
  function removeRef(id) {
    setRefItems((prev) => {
      const t = prev.find((it) => it.id === id)
      if (t) URL.revokeObjectURL(t.url)
      return prev.filter((it) => it.id !== id)
    })
  }

  async function run() {
    if (!prompt.trim()) return setError('프롬프트를 입력하세요.')
    if (mode === 'img2img' && refItems.length === 0)
      return setError('참조 이미지를 1장 이상 선택하세요.')
    if (mode === 'txt2img' && selectedModels.length === 0)
      return setError('모델을 1개 이상 선택하세요.')
    setError('')
    setSaveMsg('')
    setBusy(true)
    setResults([])
    const autoTitle = prompt.trim().slice(0, 24) || '무제'
    setTitle(autoTitle)

    const jobs =
      mode === 'img2img'
        ? [{ id: 'kontext', label: '편집 결과', tool: 'FLUX Kontext' }]
        : TXT_MODELS.filter((m) => selectedModels.includes(m.id))

    const groups = []
    const errs = []
    await Promise.all(
      jobs.map(async (j) => {
        try {
          const imgs = await generate(
            {
              mode,
              model: j.id,
              prompt: prompt.trim(),
              negativePrompt: negative.trim() || undefined,
              imageSize: dims,
              numImages,
              inputFiles: refItems.map((it) => it.file),
            },
            user.id,
          )
          groups.push({ id: j.id, label: j.label, tool: j.tool, images: imgs })
        } catch (e) {
          errs.push(`${j.label}: ${e.message}`)
        }
      }),
    )
    const order = jobs.map((j) => j.id)
    groups.sort((a, b) => order.indexOf(a.id) - order.indexOf(b.id))
    setResults(groups)
    if (errs.length) setError(errs.join('\n'))

    // 각 모델 결과를 자동 임시저장
    for (const g of groups) {
      try {
        await autoSaveDraft(g.images, `${autoTitle} · ${g.label}`, [g.tool])
      } catch {
        /* 개별 저장 실패는 건너뜀 */
      }
    }
    if (groups.length) setSaveMsg('자동 임시저장됨 — 프로필 탭에서 확인·발행하세요 ✓')
    setBusy(false)
  }

  async function autoSaveDraft(images, autoTitle, autoTools) {
    const media = []
    for (const url of images) {
      const resp = await fetch(url)
      const blob = await resp.blob()
      media.push({ type: blob.type.startsWith('video') ? 'video' : 'image', blob })
    }
    await addDraft({
      id: crypto.randomUUID(),
      title: autoTitle,
      categories: [],
      tools: autoTools,
      templateId: '',
      prompt: prompt.trim(),
      media,
      createdAt: Date.now(),
    })
  }

  return (
    <div className="studio">
      <div className="seg">
        {MODES.map((m) => (
          <button
            key={m.id}
            className={`seg-btn ${mode === m.id ? 'seg-btn--active' : ''}`}
            onClick={() => {
              setMode(m.id)
              setResults([])
              setError('')
            }}
          >
            {m.label}
          </button>
        ))}
      </div>

      <div className="field">
        <label>프롬프트 *</label>
        <textarea
          rows={3}
          value={prompt}
          onChange={(e) => setPrompt(e.target.value)}
          placeholder={
            mode === 'img2img'
              ? '예: 이미지1 인물에 이미지2의 옷을 입혀줘 / 셔츠를 파란색으로 바꿔줘'
              : '예: a close-up portrait of a woman, golden hour, film grain'
          }
        />
      </div>

      {mode === 'txt2img' && (
        <>
          <div className="field">
            <label>모델 (여러 개 선택해 비교)</label>
            <div className="chips">
              {TXT_MODELS.map((m) => (
                <button
                  key={m.id}
                  type="button"
                  className={`chip ${selectedModels.includes(m.id) ? 'chip--active' : ''}`}
                  onClick={() => toggleModel(m.id)}
                >
                  {m.label}
                </button>
              ))}
            </div>
          </div>
          <div className="field-row">
            <div className="field">
              <label>이미지 비율</label>
              <select value={ratio} onChange={(e) => setRatio(e.target.value)}>
                {RATIOS.map((r) => (
                  <option key={r.id} value={r.id}>
                    {r.label}
                  </option>
                ))}
              </select>
            </div>
            <div className="field">
              <label>화질</label>
              <select value={quality} onChange={(e) => setQuality(e.target.value)}>
                {QUALITIES.map((q) => (
                  <option key={q.id} value={q.id}>
                    {q.label}
                  </option>
                ))}
              </select>
            </div>
          </div>
          <span className="hint">
            {dims.width}×{dims.height} · 모델 {selModels.length}개 · {numImages}장 · 예상 약 {estWon}원
          </span>
        </>
      )}

      {mode === 'img2img' && (
        <div className="field">
          <label>참조 이미지 (여러 장 가능) *</label>
          <input type="file" accept="image/*" multiple onChange={addRefs} />
          <span className="hint">
            FLUX Kontext 멀티 참조 · 여러 장을 넣고 "이미지1에 이미지2의 옷을 입혀줘"처럼 지시
          </span>
          {refItems.length > 0 && (
            <div className="edit-media">
              {refItems.map((it, i) => (
                <div key={it.id} className="edit-thumb">
                  <img src={it.url} alt="" />
                  <button type="button" onClick={() => removeRef(it.id)}>
                    ✕
                  </button>
                  <span className="ref-idx">{i + 1}</span>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      <div className="field">
        <label>제외할 요소 (negative prompt, 선택)</label>
        <input value={negative} onChange={(e) => setNegative(e.target.value)} placeholder="예: blurry, low quality, extra fingers" />
      </div>

      <div className="field">
        <label>장수: {numImages}</label>
        <input
          type="range"
          min="1"
          max="4"
          step="1"
          value={numImages}
          onChange={(e) => setNumImages(Number(e.target.value))}
        />
      </div>

      {error && <p className="error-text">{error}</p>}

      <button className="builder-btn full" onClick={run} disabled={busy}>
        {busy ? '생성 중… (수 초 걸릴 수 있어요)' : '✨ 이미지 생성'}
      </button>

      {results.length > 0 && (
        <div className="studio-out">
          {results.map((g) => (
            <div key={g.id} className="result-group">
              <h4 className="result-group-title">{g.label}</h4>
              <div className="studio-results">
                {g.images.map((url, i) => (
                  <div key={i} className="studio-result">
                    <img src={url} alt="" />
                    <button
                      className="result-dl"
                      onClick={() => downloadUrl(url, `${title || 'image'}-${g.label}-${i + 1}`)}
                    >
                      ⬇ 다운로드
                    </button>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}

      {saveMsg && (
        <div className="save-msg">
          <span>{saveMsg}</span>
          {saveMsg.includes('임시저장됨') && (
            <button className="example-toggle" onClick={onGoProfile}>
              프로필에서 보기 →
            </button>
          )}
        </div>
      )}
    </div>
  )
}
