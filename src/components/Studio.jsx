import { useEffect, useState } from 'react'
import { generate } from '../lib/falClient.js'
import { addDraft } from '../lib/drafts.js'
import { downloadUrl } from '../lib/download.js'
import { listRefs, addRef, deleteRef } from '../lib/refs.js'

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

// perMp: 메가픽셀당 USD, flat: 장당 고정 USD
const TXT_MODELS = [
  { id: 'zimage', label: 'Z-Image (저렴)', tool: 'fal Z-Image', perMp: 0.005 },
  { id: 'flux2', label: 'FLUX 2 Pro (고품질)', tool: 'FLUX 2 Pro', perMp: 0.03 },
  { id: 'seedream', label: 'Seedream 5 Lite (가성비)', tool: 'Seedream 5 Lite', flat: 0.03 },
]
const IMG_MODELS = [
  { id: 'kontext', label: 'FLUX Kontext', tool: 'FLUX Kontext', flat: 0.04 },
  { id: 'seedream-edit', label: 'Seedream 4.5 Edit', tool: 'Seedream Edit', flat: 0.04 },
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
  const [numImages, setNumImages] = useState(1)
  const [selectedTxt, setSelectedTxt] = useState(['zimage'])
  const [selectedImg, setSelectedImg] = useState(['kontext'])

  // 이번만 쓸 업로드 이미지
  const [refItems, setRefItems] = useState([])
  // 저장된 레퍼런스 (재사용)
  const [savedRefs, setSavedRefs] = useState([])
  const [selectedRefIds, setSelectedRefIds] = useState([])

  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')
  const [results, setResults] = useState([])
  const [title, setTitle] = useState('')
  const [saveMsg, setSaveMsg] = useState('')

  const longSide = (QUALITIES.find((q) => q.id === quality) || QUALITIES[0]).long
  const dims = computeDims(ratio, longSide)
  const mp = (dims.width * dims.height) / 1_000_000

  const modelList = mode === 'img2img' ? IMG_MODELS : TXT_MODELS
  const selIds = mode === 'img2img' ? selectedImg : selectedTxt
  const setSel = mode === 'img2img' ? setSelectedImg : setSelectedTxt
  const selModels = modelList.filter((m) => selIds.includes(m.id))
  const totalUsd =
    selModels.reduce((s, m) => s + (m.flat != null ? m.flat : mp * m.perMp), 0) * numImages
  const estWon = Math.round(totalUsd * 1350)

  useEffect(() => {
    listRefs(user.id).then(setSavedRefs).catch(() => {})
  }, [user.id])

  useEffect(() => () => refItems.forEach((it) => URL.revokeObjectURL(it.url)), []) // eslint-disable-line

  function toggleModel(id) {
    setSel((prev) =>
      prev.includes(id) ? (prev.length > 1 ? prev.filter((x) => x !== id) : prev) : [...prev, id],
    )
  }

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

  async function addSavedRefs(e) {
    const picked = [...e.target.files]
    e.target.value = ''
    setError('')
    try {
      for (const f of picked) await addRef(f, user.id)
      setSavedRefs(await listRefs(user.id))
    } catch (err) {
      setError(`레퍼런스 저장 실패: ${err.message}`)
    }
  }
  async function removeSavedRef(path) {
    await deleteRef(path)
    setSavedRefs(await listRefs(user.id))
    setSelectedRefIds((prev) => prev.filter((x) => x !== path))
  }
  function toggleSavedRef(path) {
    setSelectedRefIds((prev) =>
      prev.includes(path) ? prev.filter((x) => x !== path) : [...prev, path],
    )
  }

  async function autoSaveDraft(images, autoTitle, autoTools) {
    const mediaBlobs = []
    for (const url of images) {
      const resp = await fetch(url)
      const blob = await resp.blob()
      mediaBlobs.push({ type: blob.type.startsWith('video') ? 'video' : 'image', blob })
    }
    await addDraft(
      { title: autoTitle, categories: [], tools: autoTools, templateId: '', prompt: prompt.trim(), mediaBlobs },
      user.id,
    )
  }

  async function run() {
    if (!prompt.trim()) return setError('프롬프트를 입력하세요.')
    const refImageUrls = savedRefs.filter((r) => selectedRefIds.includes(r.path)).map((r) => r.url)
    const adhocFiles = refItems.map((it) => it.file)
    if (mode === 'img2img' && refImageUrls.length + adhocFiles.length === 0)
      return setError('참조 이미지를 1장 이상 선택하세요. (저장된 레퍼런스 또는 업로드)')
    if (selModels.length === 0) return setError('모델을 1개 이상 선택하세요.')
    setError('')
    setSaveMsg('')
    setBusy(true)
    setResults([])
    const autoTitle = prompt.trim().slice(0, 24) || '무제'
    setTitle(autoTitle)

    const groups = []
    const errs = []
    await Promise.all(
      selModels.map(async (j) => {
        try {
          const imgs = await generate(
            {
              mode,
              model: j.id,
              prompt: prompt.trim(),
              negativePrompt: negative.trim() || undefined,
              imageSize: dims,
              numImages,
              refImageUrls,
              inputFiles: adhocFiles,
            },
            user.id,
          )
          groups.push({ id: j.id, label: j.label, tool: j.tool, images: imgs })
        } catch (e) {
          errs.push(`${j.label}: ${e.message}`)
        }
      }),
    )
    const order = selModels.map((j) => j.id)
    groups.sort((a, b) => order.indexOf(a.id) - order.indexOf(b.id))
    setResults(groups)
    if (errs.length) setError(errs.join('\n'))

    for (const g of groups) {
      try {
        await autoSaveDraft(g.images, `${autoTitle} · ${g.label}`, [g.tool])
      } catch {
        /* skip */
      }
    }
    if (groups.length) setSaveMsg('자동 임시저장됨 — 프로필 탭에서 확인·발행하세요 ✓')
    setBusy(false)
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
              ? '예: 이 인물이 흰 셔츠를 입고 카페에 앉아있는 모습 / 배경을 노을로'
              : '예: a close-up portrait of a woman, golden hour, film grain'
          }
        />
      </div>

      <div className="field">
        <label>모델 (여러 개 선택해 비교)</label>
        <div className="chips">
          {modelList.map((m) => (
            <button
              key={m.id}
              type="button"
              className={`chip ${selIds.includes(m.id) ? 'chip--active' : ''}`}
              onClick={() => toggleModel(m.id)}
            >
              {m.label}
            </button>
          ))}
        </div>
      </div>

      {mode === 'txt2img' && (
        <>
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
        </>
      )}

      {mode === 'img2img' && (
        <>
          <div className="field">
            <label>내 레퍼런스 (한 번 저장해두면 매번 안 올려도 됨)</label>
            {savedRefs.length > 0 && (
              <div className="edit-media">
                {savedRefs.map((r) => (
                  <div
                    key={r.path}
                    className={`edit-thumb ref-thumb ${selectedRefIds.includes(r.path) ? 'sel' : ''}`}
                    onClick={() => toggleSavedRef(r.path)}
                  >
                    <img src={r.url} alt="" />
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation()
                        removeSavedRef(r.path)
                      }}
                    >
                      ✕
                    </button>
                    {selectedRefIds.includes(r.path) && <span className="ref-check">✓</span>}
                  </div>
                ))}
              </div>
            )}
            <label className="ref-add">
              ＋ 레퍼런스 저장
              <input type="file" accept="image/*" multiple hidden onChange={addSavedRefs} />
            </label>
            <span className="hint">
              서버에 저장 → 기기 바꿔도 유지. 탭하면 선택(✓), ✕로 삭제.
            </span>
          </div>

          <div className="field">
            <label>이번만 쓸 이미지 추가 (선택)</label>
            <input type="file" accept="image/*" multiple onChange={addRefs} />
            {refItems.length > 0 && (
              <div className="edit-media">
                {refItems.map((it) => (
                  <div key={it.id} className="edit-thumb">
                    <img src={it.url} alt="" />
                    <button type="button" onClick={() => removeRef(it.id)}>
                      ✕
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        </>
      )}

      <span className="hint">
        {mode === 'txt2img' ? `${dims.width}×${dims.height} · ` : ''}모델 {selModels.length}개 ·{' '}
        {numImages}장 · 예상 약 {estWon}원
      </span>

      <div className="field">
        <label>제외할 요소 (negative prompt, 선택)</label>
        <input
          value={negative}
          onChange={(e) => setNegative(e.target.value)}
          placeholder="예: blurry, low quality, extra fingers"
        />
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
