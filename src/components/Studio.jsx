import { useState } from 'react'
import { templates } from '../data/templates.js'
import { generate, saveGeneratedWork } from '../lib/falClient.js'

const MODES = [
  { id: 'txt2img', label: 'Txt → Img' },
  { id: 'img2img', label: 'Img → Img' },
  { id: 'face', label: 'InstantID' },
]

const RATIOS = [
  { id: '1:1', label: '정사각 1:1', w: 1024, h: 1024 },
  { id: '3:4', label: '세로 3:4', w: 960, h: 1280 },
  { id: '9:16', label: '세로 9:16', w: 720, h: 1280 },
  { id: '4:3', label: '가로 4:3', w: 1280, h: 960 },
  { id: '16:9', label: '가로 16:9', w: 1280, h: 720 },
  { id: 'custom', label: '직접 입력', w: 1024, h: 1024 },
]

export default function Studio({ user, onGoGallery }) {
  const [mode, setMode] = useState('txt2img')
  const [prompt, setPrompt] = useState('')
  const [negative, setNegative] = useState('')
  const [ratio, setRatio] = useState('1:1')
  const [customW, setCustomW] = useState(1024)
  const [customH, setCustomH] = useState(1024)
  const [numImages, setNumImages] = useState(1)
  const [strength, setStrength] = useState(0.75)
  const [inputFile, setInputFile] = useState(null)
  const [faceFile, setFaceFile] = useState(null)

  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')
  const [results, setResults] = useState([])

  // 저장 폼
  const [title, setTitle] = useState('')
  const [categories, setCategories] = useState('')
  const [templateId, setTemplateId] = useState('')
  const [saveMsg, setSaveMsg] = useState('')
  const [saving, setSaving] = useState(false)

  const dims =
    ratio === 'custom'
      ? { width: Number(customW) || 1024, height: Number(customH) || 1024 }
      : (() => {
          const r = RATIOS.find((x) => x.id === ratio)
          return { width: r.w, height: r.h }
        })()
  const mp = (dims.width * dims.height) / 1_000_000
  const estWon = Math.round(mp * 0.005 * numImages * 1350)

  async function run() {
    if (!prompt.trim()) return setError('프롬프트를 입력하세요.')
    if (mode === 'img2img' && !inputFile) return setError('입력 이미지를 선택하세요.')
    if (mode === 'face' && !faceFile) return setError('얼굴 이미지를 선택하세요.')
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
          strength,
          inputFile,
          faceFile,
        },
        user.id,
      )
      setResults(images)
      if (!title) setTitle(prompt.trim().slice(0, 20))
    } catch (e) {
      setError(e.message)
    } finally {
      setBusy(false)
    }
  }

  async function save() {
    if (!title.trim()) return setSaveMsg('제목을 입력하세요.')
    setSaving(true)
    setSaveMsg('')
    try {
      await saveGeneratedWork({
        title: title.trim(),
        categories: categories.split(',').map((c) => c.trim()).filter(Boolean),
        templateId,
        prompt: prompt.trim(),
        imageUrls: results,
      })
      setSaveMsg('갤러리에 저장했습니다 ✓')
      setResults([])
      setTitle('')
      setCategories('')
    } catch (e) {
      setSaveMsg(`저장 실패: ${e.message}`)
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
            mode === 'face'
              ? '예: a portrait in a sunlit cafe, cinematic lighting'
              : '예: a close-up portrait of a woman, golden hour, film grain'
          }
        />
      </div>

      {mode === 'txt2img' && (
        <>
          <div className="field">
            <label>이미지 비율</label>
            <select value={ratio} onChange={(e) => setRatio(e.target.value)}>
              {RATIOS.map((r) => (
                <option key={r.id} value={r.id}>
                  {r.label}
                  {r.id !== 'custom' ? ` (${r.w}×${r.h})` : ''}
                </option>
              ))}
            </select>
          </div>
          {ratio === 'custom' && (
            <div className="field-row">
              <div className="field">
                <label>가로 (px)</label>
                <input
                  type="number"
                  min="256"
                  max="2048"
                  value={customW}
                  onChange={(e) => setCustomW(e.target.value)}
                />
              </div>
              <div className="field">
                <label>세로 (px)</label>
                <input
                  type="number"
                  min="256"
                  max="2048"
                  value={customH}
                  onChange={(e) => setCustomH(e.target.value)}
                />
              </div>
            </div>
          )}
          <span className="hint">
            {dims.width}×{dims.height} · 약 {mp.toFixed(2)}MP · 예상 약 {estWon}원 ({numImages}장)
            {mp > 4 && ' · ⚠️ fal 최대 약 4MP'}
          </span>
        </>
      )}

      {mode === 'img2img' && (
        <>
          <div className="field">
            <label>입력 이미지 *</label>
            <input type="file" accept="image/*" onChange={(e) => setInputFile(e.target.files[0])} />
          </div>
          <div className="field">
            <label>변형 강도: {strength}</label>
            <input
              type="range"
              min="0.1"
              max="1"
              step="0.05"
              value={strength}
              onChange={(e) => setStrength(Number(e.target.value))}
            />
          </div>
        </>
      )}

      {mode === 'face' && (
        <div className="field">
          <label>얼굴 레퍼런스 이미지 *</label>
          <input type="file" accept="image/*" onChange={(e) => setFaceFile(e.target.files[0])} />
          <span className="hint">동의받은 본인/대상의 얼굴 사진만 사용하세요.</span>
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
              <img key={i} src={url} alt="" />
            ))}
          </div>
          <div className="save-form">
            <h3>갤러리에 저장</h3>
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
            <button className="builder-btn full" onClick={save} disabled={saving}>
              {saving ? '저장 중…' : '갤러리에 저장'}
            </button>
          </div>
        </div>
      )}

      {saveMsg && (
        <div className="save-msg">
          <span>{saveMsg}</span>
          {saveMsg.includes('저장했습니다') && (
            <button className="example-toggle" onClick={onGoGallery}>
              갤러리에서 보기 →
            </button>
          )}
        </div>
      )}
    </div>
  )
}
