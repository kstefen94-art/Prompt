import { useState } from 'react'
import { templates } from '../data/templates.js'
import { generate } from '../lib/falClient.js'
import { addDraft } from '../lib/drafts.js'
import { downloadUrl } from '../lib/download.js'
import ToolPicker from './ToolPicker.jsx'

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
  const [inputFile, setInputFile] = useState(null)

  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')
  const [results, setResults] = useState([])

  // 저장 폼
  const [title, setTitle] = useState('')
  const [categories, setCategories] = useState('')
  const [tools, setTools] = useState([])
  const [templateId, setTemplateId] = useState('')
  const [saveMsg, setSaveMsg] = useState('')
  const [saving, setSaving] = useState(false)

  const longSide = (QUALITIES.find((q) => q.id === quality) || QUALITIES[0]).long
  const dims = computeDims(ratio, longSide)
  const mp = (dims.width * dims.height) / 1_000_000
  const estWon = Math.round(mp * 0.005 * numImages * 1350)

  async function run() {
    if (!prompt.trim()) return setError('프롬프트를 입력하세요.')
    if (mode === 'img2img' && !inputFile) return setError('입력 이미지를 선택하세요.')
    setError('')
    setSaveMsg('')
    setBusy(true)
    setResults([])
    try {
      const images = await generate(
        {
          mode,
          prompt: prompt.trim(),
          negativePrompt: negative.trim() || undefined,
          imageSize: dims,
          numImages,
          inputFile,
        },
        user.id,
      )
      setResults(images)
      setTools([mode === 'img2img' ? 'FLUX Kontext' : 'fal Z-Image'])
      if (!title) setTitle(prompt.trim().slice(0, 20))
    } catch (e) {
      setError(e.message)
    } finally {
      setBusy(false)
    }
  }

  async function saveDraft() {
    setSaving(true)
    setSaveMsg('')
    try {
      const media = []
      for (const url of results) {
        const resp = await fetch(url)
        const blob = await resp.blob()
        media.push({ type: blob.type.startsWith('video') ? 'video' : 'image', blob })
      }
      await addDraft({
        id: crypto.randomUUID(),
        title: title.trim(),
        categories: categories.split(',').map((c) => c.trim()).filter(Boolean),
        tools,
        templateId,
        prompt: prompt.trim(),
        media,
        createdAt: Date.now(),
      })
      setSaveMsg('임시저장됨 — 프로필 탭에서 갤러리로 보낼 수 있어요 ✓')
      setResults([])
      setTitle('')
      setCategories('')
    } catch (e) {
      setSaveMsg(`임시저장 실패: ${e.message}`)
    } finally {
      setSaving(false)
    }
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
              ? '수정 지시 예: 셔츠를 파란색으로 바꿔줘 / 배경을 노을로 바꿔줘'
              : '예: a close-up portrait of a woman, golden hour, film grain'
          }
        />
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
          <span className="hint">
            {dims.width}×{dims.height} · 약 {mp.toFixed(2)}MP · 예상 약 {estWon}원 ({numImages}장)
          </span>
        </>
      )}

      {mode === 'img2img' && (
        <div className="field">
          <label>편집할 이미지 *</label>
          <input type="file" accept="image/*" onChange={(e) => setInputFile(e.target.files[0])} />
          <span className="hint">FLUX Kontext · 지시문대로 편집 · 약 54원/장</span>
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
          <div className="studio-results">
            {results.map((url, i) => (
              <div key={i} className="studio-result">
                <img src={url} alt="" />
                <button
                  className="result-dl"
                  onClick={() => downloadUrl(url, `${title || 'image'}-${i + 1}`)}
                >
                  ⬇ 다운로드
                </button>
              </div>
            ))}
          </div>
          <div className="save-form">
            <h3>임시저장</h3>
            <div className="field">
              <label>제목 *</label>
              <input value={title} onChange={(e) => setTitle(e.target.value)} />
            </div>
            <div className="field">
              <label>카테고리 (쉼표로 구분)</label>
              <input
                value={categories}
                onChange={(e) => setCategories(e.target.value)}
                placeholder="예: 인물/화보"
              />
            </div>
            <div className="field">
              <label>사용한 도구</label>
              <ToolPicker value={tools} onChange={setTools} />
            </div>
            <div className="field">
              <label>연결할 템플릿 (선택)</label>
              <select value={templateId} onChange={(e) => setTemplateId(e.target.value)}>
                <option value="">없음</option>
                {templates.map((t) => (
                  <option key={t.id} value={t.id}>
                    {t.title}
                  </option>
                ))}
              </select>
            </div>
            <button className="builder-btn full" onClick={saveDraft} disabled={saving}>
              {saving ? '저장 중…' : '임시저장'}
            </button>
          </div>
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
